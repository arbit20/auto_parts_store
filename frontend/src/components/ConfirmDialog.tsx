import { AlertDialog } from 'radix-ui'
import type { ReactNode } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

/**
 * Diálogo de confirmación accesible (reemplaza window.confirm).
 * Radix AlertDialog aporta role="alertdialog", aria-modal, trampa de foco,
 * cierre con Esc y restauración de foco al disparador.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-6 shadow-xl focus:outline-none">
          <AlertDialog.Title className="text-lg font-semibold text-slate-950">{title}</AlertDialog.Title>
          {description ? (
            <AlertDialog.Description className="mt-2 text-sm text-slate-600">{description}</AlertDialog.Description>
          ) : null}
          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              {cancelLabel}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={onConfirm}
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-950 hover:bg-slate-800'
              }`}
            >
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
