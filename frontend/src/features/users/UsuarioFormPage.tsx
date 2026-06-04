import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { FormField as Field } from '@/components/FormField'
import { useToast } from '@/components/Toast'
import { api, ApiError, type UsuarioPayload } from '@/lib/api'

function buildSchema(isEditing: boolean) {
  const password = isEditing
    ? z.string().optional().refine((v) => !v || v.length >= 6, { message: 'Minimo 6 caracteres.' })
    : z.string().min(6, 'La contrasena debe tener al menos 6 caracteres.')

  return z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio.').max(100),
    apellido: z.string().optional(),
    email: z.string().min(1, 'El email es obligatorio.').email('Correo electronico invalido.'),
    password,
    telefono: z.string().optional(),
    ci_nit: z.string().optional(),
    estado: z.enum(['activo', 'inactivo', 'bloqueado']),
    roles: z.array(z.string()).optional(),
  })
}

type UsuarioFormValues = z.infer<ReturnType<typeof buildSchema>>

export function UsuarioFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const schema = useMemo(() => buildSchema(isEditing), [isEditing])

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.roles.list(),
  })

  const usuarioQuery = useQuery({
    queryKey: ['usuarios', id],
    queryFn: () => api.usuarios.get(id ?? ''),
    enabled: isEditing,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      telefono: '',
      ci_nit: '',
      estado: 'activo',
      roles: [],
    },
  })

  useEffect(() => {
    if (usuarioQuery.data) {
      const usuario = usuarioQuery.data.data
      reset({
        nombre: usuario.nombre,
        apellido: usuario.apellido ?? '',
        email: usuario.email,
        password: '',
        telefono: usuario.telefono ?? '',
        ci_nit: usuario.ci_nit ?? '',
        estado: usuario.estado,
        roles: usuario.roles?.map((rol) => String(rol.id)) ?? [],
      })
    }
  }, [usuarioQuery.data, reset])

  const saveMutation = useMutation({
    mutationFn: (payload: UsuarioPayload) =>
      isEditing && id ? api.usuarios.update(id, payload) : api.usuarios.create(payload),
    onSuccess: async (response) => {
      notify(response.message, 'success')
      await queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      navigate('/usuarios')
    },
    onError: (error) => {
      if (error instanceof ApiError && error.errors) {
        const allowed = new Set(Object.keys(schema.shape))
        Object.entries(error.errors).forEach(([field, messages]) => {
          const key = field.split('.')[0]
          if (allowed.has(key)) {
            setError(key as keyof UsuarioFormValues, { message: messages[0] })
          }
        })
      }
      notify(error instanceof Error ? error.message : 'No se pudo guardar el usuario.', 'error')
    },
  })

  function toPayload(values: UsuarioFormValues): UsuarioPayload {
    const payload: UsuarioPayload = {
      nombre: values.nombre,
      apellido: values.apellido?.trim() ? values.apellido.trim() : null,
      email: values.email,
      telefono: values.telefono?.trim() ? values.telefono.trim() : null,
      ci_nit: values.ci_nit?.trim() ? values.ci_nit.trim() : null,
      estado: values.estado,
      roles: (values.roles ?? []).map((rolId) => Number(rolId)),
    }
    if (values.password?.trim()) {
      payload.password = values.password
    }
    return payload
  }

  async function onSubmit(values: UsuarioFormValues) {
    await saveMutation.mutateAsync(toPayload(values))
  }

  return (
    <div className="space-y-5">
      <Link to="/usuarios" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950">
        <ArrowLeft size={16} />
        Volver a usuarios
      </Link>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-md border border-slate-200 bg-white p-6 shadow-sm"
        noValidate
      >
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
            {isEditing ? 'Editar usuario' : 'Nuevo usuario'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Asigna uno o varios roles (relacion muchos-a-muchos).</p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Nombre" error={errors.nombre?.message}>
            <input className="field-input" {...register('nombre')} />
          </Field>
          <Field label="Apellido" error={errors.apellido?.message}>
            <input className="field-input" {...register('apellido')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input className="field-input" type="email" {...register('email')} />
          </Field>
          <Field
            label={isEditing ? 'Contrasena (dejar vacio para mantener)' : 'Contrasena'}
            error={errors.password?.message}
          >
            <input className="field-input" type="password" autoComplete="new-password" {...register('password')} />
          </Field>
          <Field label="Telefono" error={errors.telefono?.message}>
            <input className="field-input" {...register('telefono')} />
          </Field>
          <Field label="CI / NIT" error={errors.ci_nit?.message}>
            <input className="field-input" {...register('ci_nit')} />
          </Field>
          <Field label="Estado" error={errors.estado?.message}>
            <select className="field-input" {...register('estado')}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </Field>
        </div>

        <fieldset className="mt-6" aria-describedby={errors.roles?.message ? 'roles-error' : undefined}>
          <legend className="text-sm font-medium text-slate-700">Roles</legend>
          {errors.roles?.message ? (
            <span id="roles-error" role="alert" className="mt-1 block text-sm text-red-700">
              {errors.roles.message}
            </span>
          ) : null}
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rolesQuery.isLoading ? (
              <p className="text-sm text-slate-500">Cargando roles...</p>
            ) : (
              rolesQuery.data?.data.map((rol) => (
                <label
                  key={rol.id}
                  className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    value={String(rol.id)}
                    className="size-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950/20"
                    {...register('roles')}
                  />
                  <span className="capitalize text-slate-700">{rol.nombre}</span>
                </label>
              ))
            )}
          </div>
        </fieldset>

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

