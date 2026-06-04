import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { FormField as Field } from '@/components/FormField'
import { useToast } from '@/components/Toast'
import { api, ApiError, type ProveedorPayload } from '@/lib/api'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.').max(150),
  tipo: z.enum(['empresa', 'particular']),
  pais: z.string().optional(),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.email('Correo electronico invalido.').optional().or(z.literal('')),
})

type ProveedorFormValues = z.infer<typeof schema>

export function ProveedorFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const proveedorQuery = useQuery({
    queryKey: ['proveedores', id],
    queryFn: () => api.proveedores.get(id ?? ''),
    enabled: isEditing,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProveedorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      tipo: 'empresa',
      pais: '',
      contacto: '',
      telefono: '',
      email: '',
    },
  })

  useEffect(() => {
    if (proveedorQuery.data) {
      const proveedor = proveedorQuery.data.data
      reset({
        nombre: proveedor.nombre,
        tipo: proveedor.tipo,
        pais: proveedor.pais ?? '',
        contacto: proveedor.contacto ?? '',
        telefono: proveedor.telefono ?? '',
        email: proveedor.email ?? '',
      })
    }
  }, [proveedorQuery.data, reset])

  const saveMutation = useMutation({
    mutationFn: (payload: ProveedorPayload) =>
      isEditing && id ? api.proveedores.update(id, payload) : api.proveedores.create(payload),
    onSuccess: async (response) => {
      notify(response.message, 'success')
      await queryClient.invalidateQueries({ queryKey: ['proveedores'] })
      navigate('/proveedores')
    },
    onError: (error) => {
      if (error instanceof ApiError && error.errors) {
        const allowed = new Set(Object.keys(schema.shape))
        Object.entries(error.errors).forEach(([field, messages]) => {
          const key = field.split('.')[0]
          if (allowed.has(key)) {
            setError(key as keyof ProveedorFormValues, { message: messages[0] })
          }
        })
      }
      notify(error instanceof Error ? error.message : 'No se pudo guardar el proveedor.', 'error')
    },
  })

  function toPayload(values: ProveedorFormValues): ProveedorPayload {
    return {
      nombre: values.nombre,
      tipo: values.tipo,
      pais: values.pais?.trim() ? values.pais.trim() : null,
      contacto: values.contacto?.trim() ? values.contacto.trim() : null,
      telefono: values.telefono?.trim() ? values.telefono.trim() : null,
      email: values.email?.trim() ? values.email.trim() : null,
    }
  }

  async function onSubmit(values: ProveedorFormValues) {
    await saveMutation.mutateAsync(toPayload(values))
  }

  return (
    <div className="space-y-5">
      <Link to="/proveedores" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft size={16} />
        Volver a proveedores
      </Link>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-md border border-slate-200 bg-white p-6 shadow-sm"
        noValidate
      >
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
            {isEditing ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Datos del proveedor o vendedor de ofertas.</p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Nombre" error={errors.nombre?.message}>
            <input className="field-input" {...register('nombre')} />
          </Field>
          <Field label="Tipo" error={errors.tipo?.message}>
            <select className="field-input" {...register('tipo')}>
              <option value="empresa">Empresa</option>
              <option value="particular">Particular</option>
            </select>
          </Field>
          <Field label="Pais" error={errors.pais?.message}>
            <input className="field-input" {...register('pais')} />
          </Field>
          <Field label="Contacto" error={errors.contacto?.message}>
            <input className="field-input" {...register('contacto')} />
          </Field>
          <Field label="Telefono" error={errors.telefono?.message}>
            <input className="field-input" {...register('telefono')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input className="field-input" type="email" {...register('email')} />
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
