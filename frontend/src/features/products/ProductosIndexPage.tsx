import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToast } from '@/components/Toast'
import { api, ApiError } from '@/lib/api'

export function ProductosIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const search = searchParams.get('search') ?? ''
  const page = Number(searchParams.get('page') ?? 1)
  const [searchInput, setSearchInput] = useState(search)
  const [pendingDelete, setPendingDelete] = useState<{ id: number; nombre: string } | null>(null)

  const productosQuery = useQuery({
    queryKey: ['productos', { search, page }],
    queryFn: () => api.productos.list({ search, page, per_page: 10 }),
  })
  const productosPage = productosQuery.data

  const deleteMutation = useMutation({
    mutationFn: api.productos.delete,
    onSuccess: async (response) => {
      notify(response.message, 'success')
      await queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
    onError: (error) => {
      notify(error instanceof Error ? error.message : 'No se pudo eliminar el producto.', 'error')
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
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">Productos</h1>
          <p className="mt-1 text-sm text-slate-600">CRUD principal con relaciones de catalogo visibles.</p>
        </div>
        <Link
          to="/productos/nuevo"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={16} />
          Nuevo producto
        </Link>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
          <label htmlFor="buscar-productos" className="sr-only">
            Buscar productos
          </label>
          <input
            id="buscar-productos"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por codigo, nombre, categoria o marca"
            className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
          />
        </div>
        <button type="submit" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100">
          Buscar
        </button>
      </form>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        {productosQuery.isLoading ? (
          <div role="status" aria-live="polite" className="p-8 text-center text-sm text-slate-500">
            Cargando productos...
          </div>
        ) : productosQuery.isError ? (
          <div role="alert" className="p-8 text-center text-sm text-red-700">
            {productosQuery.error instanceof ApiError
              ? productosQuery.error.message
              : 'No se pudieron cargar los productos.'}
          </div>
        ) : !productosPage ? (
          <div role="status" className="p-8 text-center text-sm text-slate-500">Sin datos disponibles.</div>
        ) : productosPage.data.length === 0 ? (
          <div role="status" className="p-8 text-center">
            <p className="font-medium text-slate-950">No hay productos para mostrar.</p>
            <p className="mt-1 text-sm text-slate-500">Prueba con otro filtro o crea un producto nuevo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Marca</th>
                  <th className="px-4 py-3">Precio desde</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productosPage.data.map((producto) => (
                  <tr key={producto.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-950">{producto.nombre}</p>
                      <p className="text-xs text-slate-500">{producto.codigo}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{producto.categoria?.nombre ?? 'Sin categoria'}</td>
                    <td className="px-4 py-3 text-slate-700">{producto.marca_pieza?.nombre ?? 'Sin marca'}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {producto.precio_desde ? `${producto.precio_desde} BOB` : 'Sin oferta'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{producto.stock_total ?? 0}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          producto.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/productos/${producto.id}`}
                          className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                          aria-label={`Ver producto ${producto.nombre}`}
                        >
                          <Eye size={16} aria-hidden="true" />
                        </Link>
                        <Link
                          to={`/productos/${producto.id}/editar`}
                          className="grid size-9 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                          aria-label={`Editar producto ${producto.nombre}`}
                        >
                          <Edit size={16} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ id: producto.id, nombre: producto.nombre })}
                          className="grid size-9 place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                          aria-label={`Eliminar producto ${producto.nombre}`}
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

      {productosPage ? (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span role="status" aria-live="polite">
            Mostrando {productosPage.meta.from ?? 0}-{productosPage.meta.to ?? 0} de{' '}
            {productosPage.meta.total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Ir a la pagina anterior"
              disabled={productosPage.meta.current_page <= 1}
              onClick={() => goToPage(productosPage.meta.current_page - 1)}
              className="rounded-md border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              aria-label="Ir a la pagina siguiente"
              disabled={productosPage.meta.current_page >= productosPage.meta.last_page}
              onClick={() => goToPage(productosPage.meta.current_page + 1)}
              className="rounded-md border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar producto"
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
