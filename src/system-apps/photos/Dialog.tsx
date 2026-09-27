import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A centred modal. Escape closes it (and only it: the sheet underneath stays
 * open), focus is kept inside while it's open and restored afterwards.
 */
export function Dialog({
  open,
  onClose,
  label,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  className?: string
}) {
  const panel = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

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
            aria-label={label}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.16 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className={cn(
              'glass-dark relative max-h-[calc(100dvh-24px)] w-full max-w-[560px] overflow-y-auto rounded-[28px] text-white scrollbar-thin',
              className,
            )}
          >
            <IconButton label="Close (Esc)" onClick={onClose} className="absolute top-3.5 right-3.5 z-10 bg-white/[0.08]">
              <X size={17} />
            </IconButton>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-2.5 border-t border-white/[0.07] px-6 py-4 max-sm:flex-col-reverse max-sm:items-stretch sm:px-7',
        className,
      )}
    >
      {children}
    </div>
  )
}
