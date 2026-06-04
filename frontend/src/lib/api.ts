import type {
  ApiCollection,
  ApiValidationErrors,
  Categoria,
  Producto,
  Proveedor,
  Rol,
  Usuario,
  User,
} from '@/types'

const API_URL = import.meta.env.VITE_API_URL ?? ''

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  csrf?: boolean
}

export class ApiError extends Error {
  status: number
  errors?: ApiValidationErrors

  constructor(message: string, status: number, errors?: ApiValidationErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

function url(path: string) {
  return `${API_URL}${path}`
}

function getCookie(name: string) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]
}

async function csrfCookie() {
  await fetch(url('/sanctum/csrf-cookie'), {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (options.csrf) {
    await csrfCookie()
  }

  const xsrfToken = getCookie('XSRF-TOKEN')
  const response = await fetch(url(path), {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(xsrfToken ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrfToken) } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const message = payload?.message ?? 'No se pudo completar la solicitud.'
    throw new ApiError(message, response.status, payload?.errors)
  }

  if (payload === null && response.status !== 204) {
    throw new ApiError('Respuesta inesperada del servidor.', response.status)
  }

  return payload as T
}

function params(input: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  })

  const query = search.toString()
  return query ? `?${query}` : ''
}

export const api = {
  auth: {
    me: () => request<User>('/api/user'),
    login: (body: { email: string; password: string }) =>
      request<{ message: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body,
        csrf: true,
      }),
    register: (body: {
      name: string
      email: string
      password: string
      password_confirmation: string
    }) =>
      request<{ message: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body,
        csrf: true,
      }),
    logout: () =>
      request<{ message: string }>('/api/auth/logout', {
        method: 'POST',
        csrf: true,
      }),
  },
  productos: {
    list: (input: { search?: string; page?: number; per_page?: number }) =>
      request<ApiCollection<Producto>>(`/api/productos${params(input)}`),
    get: (id: string | number) => request<{ data: Producto }>(`/api/productos/${id}`),
    create: (body: ProductoPayload) =>
      request<{ data: Producto; message: string }>('/api/productos', {
        method: 'POST',
        body,
        csrf: true,
      }),
    update: (id: string | number, body: ProductoPayload) =>
      request<{ data: Producto; message: string }>(`/api/productos/${id}`, {
        method: 'PUT',
        body,
        csrf: true,
      }),
    delete: (id: string | number) =>
      request<{ message: string }>(`/api/productos/${id}`, {
        method: 'DELETE',
        csrf: true,
      }),
  },
  categorias: {
    list: (input: { search?: string; page?: number; per_page?: number }) =>
      request<ApiCollection<Categoria>>(`/api/categorias${params(input)}`),
    get: (id: string | number) => request<{ data: Categoria }>(`/api/categorias/${id}`),
    create: (body: CategoriaPayload) =>
      request<{ data: Categoria; message: string }>('/api/categorias', {
        method: 'POST',
        body,
        csrf: true,
      }),
    update: (id: string | number, body: CategoriaPayload) =>
      request<{ data: Categoria; message: string }>(`/api/categorias/${id}`, {
        method: 'PUT',
        body,
        csrf: true,
      }),
    delete: (id: string | number) =>
      request<{ message: string }>(`/api/categorias/${id}`, {
        method: 'DELETE',
        csrf: true,
      }),
  },
  proveedores: {
    list: (input: { search?: string; page?: number; per_page?: number }) =>
      request<ApiCollection<Proveedor>>(`/api/proveedores${params(input)}`),
    get: (id: string | number) => request<{ data: Proveedor }>(`/api/proveedores/${id}`),
    create: (body: ProveedorPayload) =>
      request<{ data: Proveedor; message: string }>('/api/proveedores', {
        method: 'POST',
        body,
        csrf: true,
      }),
    update: (id: string | number, body: ProveedorPayload) =>
      request<{ data: Proveedor; message: string }>(`/api/proveedores/${id}`, {
        method: 'PUT',
        body,
        csrf: true,
      }),
    delete: (id: string | number) =>
      request<{ message: string }>(`/api/proveedores/${id}`, {
        method: 'DELETE',
        csrf: true,
      }),
  },
  roles: {
    list: () => request<{ data: Rol[] }>('/api/roles'),
  },
  usuarios: {
    list: (input: { search?: string; page?: number; per_page?: number }) =>
      request<ApiCollection<Usuario>>(`/api/usuarios${params(input)}`),
    get: (id: string | number) => request<{ data: Usuario }>(`/api/usuarios/${id}`),
    create: (body: UsuarioPayload) =>
      request<{ data: Usuario; message: string }>('/api/usuarios', {
        method: 'POST',
        body,
        csrf: true,
      }),
    update: (id: string | number, body: UsuarioPayload) =>
      request<{ data: Usuario; message: string }>(`/api/usuarios/${id}`, {
        method: 'PUT',
        body,
        csrf: true,
      }),
    delete: (id: string | number) =>
      request<{ message: string }>(`/api/usuarios/${id}`, {
        method: 'DELETE',
        csrf: true,
      }),
  },
}

export type ProductoPayload = {
  codigo: string
  nombre: string
  descripcion: string | null
  categoria_id: number
  marca_pieza_id: number | null
  peso_kg: number | null
  activo: boolean
}

export type CategoriaPayload = {
  nombre: string
  descripcion: string | null
  categoria_padre_id: number | null
}

export type ProveedorPayload = {
  nombre: string
  tipo: 'empresa' | 'particular'
  pais: string | null
  contacto: string | null
  telefono: string | null
  email: string | null
}

export type UsuarioPayload = {
  nombre: string
  apellido: string | null
  email: string
  password?: string
  telefono: string | null
  ci_nit: string | null
  estado: 'activo' | 'inactivo' | 'bloqueado'
  roles: number[]
}
