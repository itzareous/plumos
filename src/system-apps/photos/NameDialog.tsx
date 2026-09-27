import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/controls'
import { Dialog, DialogFooter } from './Dialog'

/** Asks for an album name: used for New Album and Rename. */
export function NameDialog({
  open,
  title,
  description,
  initial = '',
  confirmLabel,
  onSubmit,
  onClose,
}: {
  open: boolean
  title: string
  description?: string
  initial?: string
  confirmLabel: string
  onSubmit: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial)
  useEffect(() => {
    if (open) setName(initial)
  }, [open, initial])
  const submit = () => {
    if (!name.trim()) return
    onSubmit(name.trim())
    onClose()
  }
  return (
    <Dialog open={open} onClose={onClose} label={title} className="max-w-[440px]">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="px-6 pt-7 pb-6 sm:px-7">
          <h2 className="pr-10 text-[20px] font-bold tracking-tight">{title}</h2>
          {description && <p className="mt-1.5 text-[13.5px] text-white/55">{description}</p>}
          <Input
            data-autofocus
            className="mt-5"
            value={name}
            maxLength={60}
            placeholder="Album name"
            aria-label="Album name"
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!name.trim()}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
