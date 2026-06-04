import { cloneElement, isValidElement, useId } from 'react'
import type { ReactElement, ReactNode } from 'react'

type FormFieldProps = {
  label: string
  error?: string
  children: ReactNode
  className?: string
}

type InjectableProps = {
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/**
 * Campo de formulario accesible: asocia el label al control vía htmlFor/id,
 * marca aria-invalid y enlaza el mensaje de error con aria-describedby.
 * El error se anuncia con role="alert" y queda FUERA del <label> para no
 * contaminar el nombre accesible del control.
 */
export function FormField({ label, error, children, className = '' }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<InjectableProps>, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })
    : children

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {control}
      {error ? (
        <span id={errorId} role="alert" className="block text-sm text-red-700">
          {error}
        </span>
      ) : null}
    </div>
  )
}
