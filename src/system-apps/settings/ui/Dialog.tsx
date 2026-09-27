import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A centred dialog (a bottom card on phones). Escape closes only the dialog,
 * not the sheet underneath; focus stays inside and returns afterwards. When
 * `onSubmit` is given the body is a form, so Enter submits it.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  onSubmit,
  className,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  onSubmit?: () => void
  className?: string
}) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const raf = requestAnimationFrame(() => {
      const root = panel.current
      const el = root?.querySelector<HTMLElement>('[data-autofocus]') ?? root?.querySelector<HTMLElement>(FOCUSABLE)
      el?.focus({ preventScroll: true })
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCloseRef.current()
      } else if (e.key === 'Tab' && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey, { capture: true })
      previous?.focus?.({ preventScroll: true })
    }
  }, [open])

  const body = (
    <>
      <div className="px-6 pt-7 pb-6 sm:px-7">
        {icon && <div className="mb-4">{icon}</div>}
        <h2 id={titleId} className="pr-8 text-[19px] leading-tight font-semibold tracking-tight">
          {title}
        </h2>
        {description && <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/60">{description}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-white/[0.07] px-6 py-4 sm:px-7">
          {footer}
        </div>
      )}
    </>
  )

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.16 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className={cn(
              'glass-dark relative max-h-[calc(100dvh-24px)] w-full max-w-[440px] overflow-y-auto rounded-[26px] text-white scrollbar-thin',
              className,
            )}
          >
            {onSubmit ? (
              <form
                noValidate
                onSubmit={(e: FormEvent) => {
                  e.preventDefault()
                  onSubmit()
                }}
              >
                {body}
              </form>
            ) : (
              body
            )}
            {/* Last in tab order, so focus starts on the dialog's own controls. */}
            <IconButton label="Close (Esc)" onClick={onClose} className="absolute top-3.5 right-3.5 z-10 bg-white/[0.08]">
              <X size={17} />
            </IconButton>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** A yes/no question, e.g. before removing something. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  confirmLabel,
  danger = false,
  children,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  confirmLabel: string
  danger?: boolean
  children?: ReactNode
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      onSubmit={() => {
        onClose()
        onConfirm()
      }}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={danger ? 'danger' : 'primary'} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  )
}

/** A round coloured badge for the top of a dialog. */
export function DialogIcon({ children, color = 'var(--plumos-accent)' }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="flex size-12 items-center justify-center rounded-2xl text-white"
      style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${color} 80%, white), ${color})` }}
    >
      {children}
    </span>
  )
}
