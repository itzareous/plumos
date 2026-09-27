import { AnimatePresence, motion } from 'motion/react'
import { ImagePlus } from 'lucide-react'

/** Shown while photos are dragged over the window. */
export function DropOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-[rgb(14_14_20/0.7)] p-4 backdrop-blur-md sm:p-6"
        >
          <motion.div
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="flex h-full w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-white/35 bg-white/[0.03] text-center"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="flex size-20 items-center justify-center rounded-[24px] bg-accent text-white shadow-[0_20px_50px_-12px_var(--plumos-accent)]"
            >
              <ImagePlus size={36} strokeWidth={1.8} />
            </motion.div>
            <div className="mt-5 text-[22px] font-bold tracking-tight">Drop to add to your library</div>
            <div className="mt-1.5 text-[14px] text-white/55">Photos and videos show up under Today</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
