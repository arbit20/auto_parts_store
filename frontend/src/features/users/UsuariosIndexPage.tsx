import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Plus, Search, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import { api, ApiError } from '@/lib/api'
import type { UsuarioEstado } from '@/types'

const estadoStyles: Record<UsuarioEstado, string> = {
  activo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactivo: 'bg-slate-100 text-slate-600 border-slate-200',
  bloqueado: 'bg-red-50 text-red-700 border-red-200',
}

export function UsuariosIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const page = Number(searchParams.get('page') ?? 1)
  const [searchInput, setSearchInput] = useState(search)
  const [pendingDelete, setPendingDelete] = useState<{ id: number; nombre: string } | null>(null)
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const usuariosQuery = useQuery({
    queryKey: ['usuarios', { search, page }],
    queryFn: () => api.usuarios.list({ search, page, per_page: 10 }),
  })
  const usuariosPage = usuariosQuery.data

  const deleteMutation = useMutation({
    mutationFn: api.usuarios.delete,
    onSuccess: async (response) => {
      notify(response.message, 'success')
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
    onError: (error) => {
      notify(error instanceof Error ? error.message : 'No se pudo eliminar el usuario.', 'error')
    },
  })

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (searchInput.trim()) {
      next.set('search', searchInput.trim())
    }
    setSearchParams(next)
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    const id = pendingDelete.id
    setPendingDelete(null)
    try {
      await deleteMutation.mutateAsync(id)
    } catch {
      // onError ya notifica al usuario
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Usuarios y roles</h1>
          <p className="mt-1 text-sm text-slate-600">Relacion muchos-a-muchos: cada usuario puede tener varios roles.</p>
        </div>
        <Link
          to="/usuarios/nuevo"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={16} />
          Nuevo usuario
        </Link>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
          <label htmlFor="buscar-usuarios" className="sr-only">
            Buscar usuarios
          </label>
          <input
            id="buscar-usuarios"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre, email o rol"
            className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          />
        </div>
        <button type="submit" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100">
          Buscar
        </button>
      </form>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        {usuariosQuery.isLoading ? (
          <div role="status" aria-live="polite" className="p-8 text-center text-sm text-slate-500">
            Cargando usuarios...
          </div>
        ) : usuariosQuery.isError ? (
          <div role="alert" className="p-8 text-center text-sm text-red-700">
            {usuariosQuery.error instanceof ApiError
              ? usuariosQuery.error.message
              : 'No se pudieron cargar los usuarios.'}
          </div>
        ) : !usuariosPage ? (
          <div role="status" className="p-8 text-center text-sm text-slate-500">Sin datos disponibles.</div>
        ) : usuariosPage.data.length === 0 ? (
          <div role="status" className="p-8 text-center">
            <Users className="mx-auto text-slate-400" size={36} />
            <p className="mt-3 font-medium text-slate-950">No hay usuarios para mostrar.</p>
            <p className="mt-1 text-sm text-slate-500">Prueba otro filtro o crea un usuario.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosPage.data.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-950">
                        {usuario.nombre} {usuario.apellido ?? ''}
                      </p>
                      <p className="text-xs text-slate-500">{usuario.telefono ?? 'Sin telefono'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{usuario.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                          estadoStyles[usuario.estado] ?? estadoStyles.inactivo
                        }`}
                      >
                        {usuario.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {usuario.roles && usuario.roles.length > 0 ? (
                          usuario.roles.map((rol) => (
                            <span
                              key={rol.id}
                              className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700"
                            >
                              {rol.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Sin roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/usuarios/${usuario.id}/editar`}
                          className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                          aria-label={`Editar usuario ${usuario.nombre}`}
                        >
                          <Edit size={16} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ id: usuario.id, nombre: usuario.nombre })}
                          className="grid size-9 place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                          aria-label={`Eliminar usuario ${usuario.nombre}`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {usuariosPage ? (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span role="status" aria-live="polite">
            Mostrando {usuariosPage.meta.from ?? 0}-{usuariosPage.meta.to ?? 0} de {usuariosPage.meta.total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Ir a la pagina anterior"
              disabled={usuariosPage.meta.current_page <= 1}
              onClick={() => goToPage(usuariosPage.meta.current_page - 1)}
              className="rounded-md border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              aria-label="Ir a la pagina siguiente"
              disabled={usuariosPage.meta.current_page >= usuariosPage.meta.last_page}
              onClick={() => goToPage(usuariosPage.meta.current_page + 1)}
              className="rounded-md border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar usuario"
        description={pendingDelete ? `Esta accion eliminara "${pendingDelete.nombre}" de forma permanente.` : undefined}
        confirmLabel="Eliminar"
        destructive
        onConfirm={confirmDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      />
    </div>
  )
}
