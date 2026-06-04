import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Edit, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import { api, ApiError } from '@/lib/api'
import type { ProveedorTipo } from '@/types'

const tipoLabels: Record<ProveedorTipo, string> = {
  empresa: 'Empresa',
  particular: 'Particular',
}

export function ProveedoresIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const page = Number(searchParams.get('page') ?? 1)
  const [searchInput, setSearchInput] = useState(search)
  const [pendingDelete, setPendingDelete] = useState<{ id: number; nombre: string } | null>(null)
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const proveedoresQuery = useQuery({
    queryKey: ['proveedores', { search, page }],
    queryFn: () => api.proveedores.list({ search, page, per_page: 10 }),
  })
  const proveedoresPage = proveedoresQuery.data

  const deleteMutation = useMutation({
    mutationFn: api.proveedores.delete,
    onSuccess: async (response) => {
      notify(response.message, 'success')
      await queryClient.invalidateQueries({ queryKey: ['proveedores'] })
    },
    onError: (error) => {
      notify(error instanceof Error ? error.message : 'No se pudo eliminar el proveedor.', 'error')
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
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Proveedores</h1>
          <p className="mt-1 text-sm text-slate-600">Tercer CRUD con relacion opcional a usuario.</p>
        </div>
        <Link
          to="/proveedores/nuevo"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={16} />
          Nuevo proveedor
        </Link>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
          <label htmlFor="buscar-proveedores" className="sr-only">
            Buscar proveedores
          </label>
          <input
            id="buscar-proveedores"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por nombre, pais, tipo o usuario"
            className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          />
        </div>
        <button type="submit" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100">
          Buscar
        </button>
      </form>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        {proveedoresQuery.isLoading ? (
          <div role="status" aria-live="polite" className="p-8 text-center text-sm text-slate-500">
            Cargando proveedores...
          </div>
        ) : proveedoresQuery.isError ? (
          <div role="alert" className="p-8 text-center text-sm text-red-700">
            {proveedoresQuery.error instanceof ApiError
              ? proveedoresQuery.error.message
              : 'No se pudieron cargar los proveedores.'}
          </div>
        ) : !proveedoresPage ? (
          <div role="status" className="p-8 text-center text-sm text-slate-500">Sin datos disponibles.</div>
        ) : proveedoresPage.data.length === 0 ? (
          <div role="status" className="p-8 text-center">
            <Building2 className="mx-auto text-slate-400" size={36} />
            <p className="mt-3 font-medium text-slate-950">No hay proveedores para mostrar.</p>
            <p className="mt-1 text-sm text-slate-500">Prueba otro filtro o crea un proveedor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Pais</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Ofertas</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proveedoresPage.data.map((proveedor) => (
                  <tr key={proveedor.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-950">{proveedor.nombre}</p>
                      <p className="text-xs text-slate-500">{proveedor.contacto ?? 'Sin contacto'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{tipoLabels[proveedor.tipo] ?? proveedor.tipo}</td>
                    <td className="px-4 py-3 text-slate-700">{proveedor.pais ?? 'Sin pais'}</td>
                    <td className="px-4 py-3 text-slate-700">{proveedor.usuario?.nombre ?? 'Sin usuario'}</td>
                    <td className="px-4 py-3 text-slate-700">{proveedor.ofertas_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/proveedores/${proveedor.id}/editar`}
                          className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                          aria-label={`Editar proveedor ${proveedor.nombre}`}
                        >
                          <Edit size={16} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ id: proveedor.id, nombre: proveedor.nombre })}
                          className="grid size-9 place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                          aria-label={`Eliminar proveedor ${proveedor.nombre}`}
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

      {proveedoresPage ? (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span role="status" aria-live="polite">
            Mostrando {proveedoresPage.meta.from ?? 0}-{proveedoresPage.meta.to ?? 0} de{' '}
            {proveedoresPage.meta.total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Ir a la pagina anterior"
              disabled={proveedoresPage.meta.current_page <= 1}
              onClick={() => goToPage(proveedoresPage.meta.current_page - 1)}
              className="rounded-md border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              aria-label="Ir a la pagina siguiente"
              disabled={proveedoresPage.meta.current_page >= proveedoresPage.meta.last_page}
              onClick={() => goToPage(proveedoresPage.meta.current_page + 1)}
              className="rounded-md border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar proveedor"
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
