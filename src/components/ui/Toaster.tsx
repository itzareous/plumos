import { AnimatePresence, motion } from 'motion/react'
import { useToasts } from '@/stores/toasts'

export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[80] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            onClick={() => dismiss(t.id)}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="glass-dark pointer-events-auto flex items-center gap-3 rounded-2xl p-3 text-left"
          >
            {t.icon && <span className="shrink-0">{t.icon}</span>}
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{t.title}</span>
              {t.description && <span className="block text-[13px] text-white/60">{t.description}</span>}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
