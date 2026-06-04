import { zodResolver } from '@hookform/resolvers/zod'
import { Boxes } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/auth/AuthContext'
import { ApiError } from '@/lib/api'
import { useToast } from '@/components/Toast'

const schema = z.object({
  email: z.string().email('Ingresa un email valido.'),
  password: z.string().min(1, 'Ingresa tu password.'),
})

type LoginValues = z.infer<typeof schema>

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { notify } = useToast()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: 'test@example.com',
      password: 'password',
    },
  })

  if (user) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(values: LoginValues) {
    try {
      await login(values.email, values.password)
      notify('Sesion iniciada correctamente.', 'success')
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          setError(field as keyof LoginValues, { message: messages[0] })
        })
      }
      notify(error instanceof Error ? error.message : 'No se pudo iniciar sesion.', 'error')
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-950 text-white lg:grid-cols-[1fr_30rem]">
      <section className="flex min-h-[40vh] flex-col justify-between bg-[linear-gradient(135deg,#0f172a,#1e293b_55%,#713f12)] p-8 lg:min-h-screen">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-white text-slate-950">
            <Boxes size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold">BAGG</p>
            <p className="text-xs text-white/65">Auto Parts Store</p>
          </div>
        </div>
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-amber-200">Panel administrativo</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">
            Catalogo de repuestos con datos reales para la defensa.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
            Productos, categorias y relaciones visibles desde Laravel, MariaDB y React.
          </p>
        </div>
      </section>

      <section className="flex items-center bg-white p-6 text-slate-950">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mx-auto w-full max-w-sm space-y-5"
          noValidate
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-normal">Iniciar sesion</h2>
            <p className="mt-2 text-sm text-slate-600">Usa el usuario de demo sembrado por Laravel.</p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              {...register('email')}
            />
            {errors.email ? <span className="text-sm text-red-700">{errors.email.message}</span> : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              {...register('password')}
            />
            {errors.password ? (
              <span className="text-sm text-red-700">{errors.password.message}</span>
            ) : null}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}
