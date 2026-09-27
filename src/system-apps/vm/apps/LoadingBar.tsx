import { AnimatePresence, motion } from 'motion/react'

/** Thin page-load progress bar along the top edge of a browser view. */
export function LoadingBar({ active, loadKey }: { active: boolean; loadKey: number }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={loadKey}
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px] origin-left bg-gradient-to-r from-cyan-400 to-indigo-500"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.3, 0.7, 0.4, 1] }}
        />
      )}
    </AnimatePresence>
  )
}
