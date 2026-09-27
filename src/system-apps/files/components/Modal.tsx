import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

// ---------- Escape layers ----------
// Overlays register here so Escape closes only the topmost one, and the sheet
// underneath doesn't close too (it ignores events that were default-prevented).

const layers: (() => void)[] = []
let listening = false

function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || !layers.length) return
  e.preventDefault()
  layers[layers.length - 1]()
}

export function useEscapeLayer(active: boolean, handler: () => void) {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })
  useEffect(() => {
    if (!active) return
    const fn = () => ref.current()
    layers.push(fn)
    if (!listening) {
      window.addEventListener('keydown', onKeyDown, { capture: true })
      listening = true
    }
    return () => {
      const i = layers.lastIndexOf(fn)
      if (i >= 0) layers.splice(i, 1)
    }
  }, [active])
}

/** True while any overlay (preview, dialog) is open. */
export const overlayOpen = () => layers.length > 0

// ---------- Modal ----------

export function Modal({
  open,
  onClose,
  label,
  children,
  className,
  onEnter,
}: {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  className?: string
  /** Called for Enter pressed outside a text field or button. */
  onEnter?: () => void
}) {
  useEscapeLayer(open, onClose)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const t = setTimeout(() => {
      const target = panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current
      target?.focus()
    }, 30)
    return () => {
      clearTimeout(t)
      previous?.focus?.()
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <div className="absolute inset-0 bg-black/45" onClick={onClose} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onKeyDown={(e) => {
              const tag = (e.target as HTMLElement).tagName
              if (e.key === 'Enter' && onEnter && tag !== 'BUTTON' && tag !== 'TEXTAREA') {
                e.preventDefault()
                onEnter()
              }
            }}
            className={cn(
              'glass-dark relative max-h-[calc(100dvh-32px)] w-full max-w-[440px] overflow-y-auto rounded-[26px] outline-none scrollbar-thin',
              className,
            )}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full bg-white/10 text-white/75 transition outline-none hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <X size={16} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
