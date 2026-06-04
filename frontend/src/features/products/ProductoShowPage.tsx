import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/lib/api'

export function ProductoShowPage() {
  const { id = '' } = useParams()
  const productoQuery = useQuery({
    queryKey: ['productos', id],
    queryFn: () => api.productos.get(id),
    enabled: Boolean(id),
  })

  if (productoQuery.isLoading) {
    return <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm">Cargando producto...</div>
  }

  if (productoQuery.isError || !productoQuery.data) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-8 text-center text-sm text-red-800">
        No se pudo cargar el producto.
      </div>
    )
  }

  const producto = productoQuery.data.data

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/productos" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
          <ArrowLeft size={16} />
          Volver a productos
        </Link>
        <Link
          to={`/productos/${producto.id}/editar`}
          className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Edit size={16} />
          Editar
        </Link>
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{producto.codigo}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950">{producto.nombre}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {producto.descripcion ?? 'Sin descripcion registrada.'}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              producto.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {producto.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Categoria" value={producto.categoria?.nombre ?? 'Sin categoria'} />
        <InfoCard label="Marca pieza" value={producto.marca_pieza?.nombre ?? 'Sin marca'} />
        <InfoCard label="Peso" value={producto.peso_kg ? `${producto.peso_kg} kg` : 'No registrado'} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Compatibilidades">
          {producto.compatibilidades?.length ? (
            <ul className="space-y-2">
              {producto.compatibilidades.map((item) => (
                <li key={item.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                  {item.etiqueta}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyText text="No hay compatibilidades registradas." />
          )}
        </Panel>

        <Panel title="Ofertas">
          {producto.ofertas?.length ? (
            <ul className="space-y-3">
              {producto.ofertas.map((oferta) => (
                <li key={oferta.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-950">{oferta.vendedor.nombre}</p>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
                      {oferta.tipo_venta}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-600">
                    {oferta.precio} {oferta.moneda} · stock {oferta.stock} · {oferta.condicion}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyText text="No hay ofertas registradas." />
          )}
        </Panel>
      </section>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-normal text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function EmptyText({ text }: { text: string }) {
  return <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">{text}</p>
}
