export type ApiValidationErrors = Record<string, string[]>

export type User = {
  id: number
  name: string
  email: string
}

export type ApiCollection<T> = {
  data: T[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    links: Array<{
      url: string | null
      label: string
      active: boolean
    }>
    path: string
    per_page: number
    to: number | null
    total: number
  }
}

export type Categoria = {
  id: number
  nombre: string
  descripcion: string | null
  categoria_padre_id: number | null
  categoria_padre?: Pick<Categoria, 'id' | 'nombre'> | null
  hijos_count?: number
  productos_count?: number
}

export type Rol = {
  id: number
  nombre: string
  descripcion: string | null
}

export type UsuarioEstado = 'activo' | 'inactivo' | 'bloqueado'

export type Usuario = {
  id: number
  nombre: string
  apellido: string | null
  email: string
  telefono: string | null
  ci_nit?: string | null
  estado: UsuarioEstado
  creado_en: string | null
  roles?: Array<{ id: number; nombre: string }>
}

export type ProveedorTipo = 'empresa' | 'particular'

export type Proveedor = {
  id: number
  nombre: string
  tipo: ProveedorTipo
  pais: string | null
  contacto: string | null
  telefono: string | null
  email: string | null
  usuario_id: number | null
  usuario?: { id: number; nombre: string } | null
  ofertas_count?: number
}

export type Producto = {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  categoria_id: number
  marca_pieza_id: number | null
  peso_kg: string | null
  activo: boolean
  creado_en: string | null
  precio_desde?: string | number | null
  stock_total?: number
  categoria?: {
    id: number
    nombre: string
  } | null
  marca_pieza?: {
    id: number
    nombre: string
  } | null
  compatibilidades?: Array<{
    id: number
    anio_desde: number | null
    anio_hasta: number | null
    etiqueta: string
    modelo: {
      id: number
      nombre: string
      anio_inicio: number | null
      anio_fin: number | null
    } | null
    marca_vehiculo: {
      id: number
      nombre: string
    } | null
  }>
  imagenes?: Array<{
    id: number
    url: string
    es_principal: boolean
  }>
  ofertas?: Array<{
    id: number
    tipo_venta: string
    condicion: string
    origen: string
    precio: string
    moneda: string
    stock: number
    stock_minimo: number
    activo: boolean
    vendedor: {
      id: number | null
      nombre: string
    }
  }>
}
