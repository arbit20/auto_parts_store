import { Link } from 'react-router-dom'
import { ArrowRight, FolderTree, PackageSearch, ShieldCheck } from 'lucide-react'

const cards = [
  {
    title: 'Productos',
    description: 'Catalogo con categoria, marca, stock y compatibilidades visibles.',
    to: '/productos',
    icon: PackageSearch,
  },
  {
    title: 'Categorias',
    description: 'Jerarquia padre-hijo para demostrar relaciones del dominio.',
    to: '/categorias',
    icon: FolderTree,
  },
]

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">MVP Sprints 0-6</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
              BAGG Auto Parts Store
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Administracion del catalogo con autenticacion Sanctum, API Laravel y vistas React.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
            <ShieldCheck size={18} />
            Rutas protegidas
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.to}
              to={card.to}
              className="group rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid size-11 place-items-center rounded-md bg-amber-100 text-amber-900">
                  <Icon size={22} />
                </div>
                <ArrowRight className="text-slate-400 transition group-hover:translate-x-1" size={20} />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-normal text-slate-950">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
