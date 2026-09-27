import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogFooter } from './Dialog'

/** A short "are you sure?" for things that can't be undone. */
export function ConfirmDialog({
  open,
  title,
  body,
  icon,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  body: ReactNode
  icon?: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onClose={onClose} label={title} className="max-w-[420px]">
      <div className="px-6 pt-7 pb-6 sm:px-7">
        {icon && (
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-300 ring-1 ring-red-400/20 ring-inset">
            {icon}
          </div>
        )}
        <h2 className="pr-10 text-[20px] font-bold tracking-tight">{title}</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-white/60">{body}</p>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} data-autofocus>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
