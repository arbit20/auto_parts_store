import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { useToast } from '@/components/Toast'
import { api, ApiError, type ProductoPayload } from '@/lib/api'

const schema = z.object({
  codigo: z.string().min(1, 'El codigo es obligatorio.').max(50),
  nombre: z.string().min(1, 'El nombre es obligatorio.').max(150),
  descripcion: z.string().optional(),
  categoria_id: z.string().min(1, 'Selecciona una categoria.'),
  marca_pieza_id: z.string().optional(),
  peso_kg: z.string().optional(),
  activo: z.boolean(),
})

type ProductoFormValues = z.infer<typeof schema>

export function ProductoFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const categoriasQuery = useQuery({
    queryKey: ['categorias', { per_page: 100 }],
    queryFn: () => api.categorias.list({ per_page: 100 }),
  })

  const productoQuery = useQuery({
    queryKey: ['productos', id],
    queryFn: () => api.productos.get(id ?? ''),
    enabled: isEditing,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria_id: '',
      marca_pieza_id: '',
      peso_kg: '',
      activo: true,
    },
  })

  useEffect(() => {
    if (productoQuery.data) {
      const producto = productoQuery.data.data
      reset({
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? '',
        categoria_id: String(producto.categoria_id),
        marca_pieza_id: producto.marca_pieza_id ? String(producto.marca_pieza_id) : '',
        peso_kg: producto.peso_kg ?? '',
        activo: producto.activo,
      })
    }
  }, [productoQuery.data, reset])

  const saveMutation = useMutation({
    mutationFn: (payload: ProductoPayload) =>
      isEditing && id ? api.productos.update(id, payload) : api.productos.create(payload),
    onSuccess: async (response) => {
      notify(response.message, 'success')
      await queryClient.invalidateQueries({ queryKey: ['productos'] })
      navigate('/productos')
    },
    onError: (error) => {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          setError(field as keyof ProductoFormValues, { message: messages[0] })
        })
      }
      notify(error instanceof Error ? error.message : 'No se pudo guardar el producto.', 'error')
    },
  })

  function toPayload(values: ProductoFormValues): ProductoPayload {
    return {
      codigo: values.codigo,
      nombre: values.nombre,
      descripcion: values.descripcion?.trim() ? values.descripcion.trim() : null,
      categoria_id: Number(values.categoria_id),
      marca_pieza_id: values.marca_pieza_id ? Number(values.marca_pieza_id) : null,
      peso_kg: values.peso_kg ? Number(values.peso_kg) : null,
      activo: values.activo,
    }
  }

  async function onSubmit(values: ProductoFormValues) {
    await saveMutation.mutateAsync(toPayload(values))
  }

  return (
    <div className="space-y-5">
      <Link to="/productos" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft size={16} />
        Volver a productos
      </Link>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-md border border-slate-200 bg-white p-6 shadow-sm"
        noValidate
      >
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Los datos de precio y stock se muestran desde ofertas existentes.</p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Codigo" error={errors.codigo?.message}>
            <input className="field-input" {...register('codigo')} />
          </Field>
          <Field label="Nombre" error={errors.nombre?.message}>
            <input className="field-input" {...register('nombre')} />
          </Field>
          <Field label="Categoria" error={errors.categoria_id?.message}>
            <select className="field-input" {...register('categoria_id')}>
              <option value="">Seleccionar categoria</option>
              {categoriasQuery.data?.data.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ID marca pieza" error={errors.marca_pieza_id?.message}>
            <input className="field-input" inputMode="numeric" placeholder="Opcional" {...register('marca_pieza_id')} />
          </Field>
          <Field label="Peso kg" error={errors.peso_kg?.message}>
            <input className="field-input" inputMode="decimal" placeholder="0.000" {...register('peso_kg')} />
          </Field>
          <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2">
            <input type="checkbox" className="size-4 rounded border-slate-300" {...register('activo')} />
            <span className="text-sm font-medium text-slate-700">Producto activo</span>
          </label>
          <Field label="Descripcion" error={errors.descripcion?.message} className="md:col-span-2">
            <textarea className="field-input min-h-28" {...register('descripcion')} />
          </Field>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} />
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  error,
  children,
  className = '',
}: {
  label: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block space-y-2 ${className}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  )
}
