import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

/**
 * Error boundary global: captura errores de render del árbol y muestra una
 * pantalla amable en lugar de una pantalla en blanco. Es un componente de
 * clase porque React aún no expone getDerivedStateFromError en componentes
 * de función.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary capturó un error de render:', error, info.componentStack)
  }

  handleReload = (): void => {
    window.location.assign('/')
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-slate-950">Algo salio mal</h1>
            <p className="mt-2 text-sm text-slate-600">
              Ocurrio un error inesperado en la aplicacion. Puedes volver al inicio e intentar de nuevo.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 inline-flex items-center justify-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
