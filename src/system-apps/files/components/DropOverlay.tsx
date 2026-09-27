import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import { FolderIcon } from '@/components/icons/FolderIcon'

/** Shown while files from the computer are dragged over the window. */
export function DropOverlay({ open, target }: { open: boolean; target: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="drop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-4"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0.97 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="absolute inset-3 rounded-[24px] border-2 border-dashed border-accent/80 bg-[rgb(14_14_20/0.55)] backdrop-blur-md sm:inset-4"
            style={{ boxShadow: 'inset 0 0 120px -20px var(--color-accent-soft)' }}
          />
          <div className="relative flex flex-col items-center px-6 text-center">
            <div className="relative h-[120px] w-[220px]">
              <motion.div
                initial={{ x: 0, rotate: 0, opacity: 0 }}
                animate={{ x: -58, rotate: -14, opacity: 0.75 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
                className="absolute top-[18px] left-[62px]"
              >
                <FolderIcon size={96} tint={['#9ad2ff', '#4f8df7']} />
              </motion.div>
              <motion.div
                initial={{ x: 0, rotate: 0, opacity: 0 }}
                animate={{ x: 58, rotate: 14, opacity: 0.75 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
                className="absolute top-[18px] left-[62px]"
              >
                <FolderIcon size={96} tint={['#b7f0c8', '#34c77b']} />
              </motion.div>
              <FolderIcon size={124} className="absolute top-0 left-[48px] drop-shadow-[0_18px_40px_rgb(255_140_50/0.35)]" />
              <motion.span
                className="absolute top-[58px] left-1/2 flex size-10 -translate-x-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowDown size={20} strokeWidth={2.6} />
              </motion.span>
            </div>
            <p className="mt-5 text-[20px] font-semibold tracking-tight">
              Drop to upload to <span className="text-accent">{target}</span>
            </p>
            <p className="mt-1 text-[14px] text-white/60">Files and entire folders — everything keeps its place.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
