import { AnimatePresence, motion } from 'motion/react'

/** A y-axis label that cross-fades when the axis rescales. */
export function TickLabel({ top, text }: { top: number; text: string }) {
  return (
    <div
      className="pointer-events-none absolute left-0 h-3.5 text-[10.5px] leading-[14px] font-medium text-white/45 tabular-nums [text-shadow:0_1px_3px_rgb(0_0_0/0.7)]"
      style={{ top }}
      aria-hidden
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={text}
          className="block whitespace-nowrap"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}
