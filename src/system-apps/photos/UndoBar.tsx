import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { RotateCcw } from 'lucide-react'

export interface UndoAction {
  id: number
  label: string
  undo: () => void
}

/**
 * The "Deleted 3 photos · Undo" toast. Lives above the dock and the viewer,
 * and ⌘Z / Ctrl+Z does the same as the button.
 */
export function UndoBar({ action, onDismiss }: { action: UndoAction | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!action) return
    const t = setTimeout(onDismiss, 6000)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const target = e.target as HTMLElement | null
        if (target?.closest('input, textarea')) return
        e.preventDefault()
        action.undo()
        onDismiss()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [action, onDismiss])

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-[100px] z-[85] flex justify-center px-4 sm:bottom-[108px]">
      <AnimatePresence>
        {action && (
          <motion.div
            key={action.id}
            role="status"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
            className="glass-dark pointer-events-auto flex items-center gap-3 rounded-full py-1.5 pr-1.5 pl-5 text-white"
          >
            <span className="text-[13.5px] font-medium whitespace-nowrap">{action.label}</span>
            <button
              type="button"
              onClick={() => {
                action.undo()
                onDismiss()
              }}
              className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-[13.5px] font-semibold text-white transition outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95"
            >
              <RotateCcw size={14} />
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
