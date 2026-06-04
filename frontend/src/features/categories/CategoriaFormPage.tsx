import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { FormField as Field } from '@/components/FormField'
import { useToast } from '@/components/Toast'
import { api, ApiError, type CategoriaPayload } from '@/lib/api'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.').max(100),
  descripcion: z.string().optional(),
  categoria_padre_id: z.string().optional(),
})

type CategoriaFormValues = z.infer<typeof schema>

export function CategoriaFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const categoriasQuery = useQuery({
    queryKey: ['categorias', { per_page: 100 }],
    queryFn: () => api.categorias.list({ per_page: 100 }),
  })

  const categoriaQuery = useQuery({
    queryKey: ['categorias', id],
    queryFn: () => api.categorias.get(id ?? ''),
    enabled: isEditing,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoriaFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      categoria_padre_id: '',
    },
  })

  useEffect(() => {
    if (categoriaQuery.data) {
      const categoria = categoriaQuery.data.data
      reset({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion ?? '',
        categoria_padre_id: categoria.categoria_padre_id ? String(categoria.categoria_padre_id) : '',
      })
    }
  }, [categoriaQuery.data, reset])

  const saveMutation = useMutation({
    mutationFn: (payload: CategoriaPayload) =>
      isEditing && id ? api.categorias.update(id, payload) : api.categorias.create(payload),
    onSuccess: async (response) => {
      notify(response.message, 'success')
      await queryClient.invalidateQueries({ queryKey: ['categorias'] })
      navigate('/categorias')
    },
    onError: (error) => {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          setError(field as keyof CategoriaFormValues, { message: messages[0] })
        })
      }
      notify(error instanceof Error ? error.message : 'No se pudo guardar la categoria.', 'error')
    },
  })

  function toPayload(values: CategoriaFormValues): CategoriaPayload {
    return {
      nombre: values.nombre,
      descripcion: values.descripcion?.trim() ? values.descripcion.trim() : null,
      categoria_padre_id: values.categoria_padre_id ? Number(values.categoria_padre_id) : null,
    }
  }

  async function onSubmit(values: CategoriaFormValues) {
    await saveMutation.mutateAsync(toPayload(values))
  }

  return (
    <div className="space-y-5">
      <Link to="/categorias" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft size={16} />
        Volver a categorias
      </Link>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-md border border-slate-200 bg-white p-6 shadow-sm"
        noValidate
      >
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
            {isEditing ? 'Editar categoria' : 'Nueva categoria'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">La categoria padre se muestra por nombre en los listados.</p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Nombre" error={errors.nombre?.message}>
            <input className="field-input" {...register('nombre')} />
          </Field>
          <Field label="Categoria padre" error={errors.categoria_padre_id?.message}>
            <select className="field-input" {...register('categoria_padre_id')}>
              <option value="">Categoria raiz</option>
              {categoriasQuery.data?.data
                .filter((categoria) => String(categoria.id) !== id)
                .map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
            </select>
          </Field>
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

