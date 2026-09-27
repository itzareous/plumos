import { motion } from 'motion/react'
import type { PoolMode } from '@/stores/storage'

const FILES = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#a855f7', '#ef4444']

/**
 * Two drives and where the files go. Combined spreads different files across
 * them; mirrored puts the same files on both.
 */
export function ModeDiagram({ mode }: { mode: PoolMode }) {
  const drives = mode === 'combined' ? [FILES.slice(0, 3), FILES.slice(3)] : [FILES.slice(0, 3), FILES.slice(0, 3)]
  return (
    <div aria-hidden className="flex items-center justify-center gap-3">
      {drives.map((files, d) => (
        <div key={d} className="flex flex-col items-center gap-1.5">
          <div className="flex h-[74px] w-[64px] flex-col-reverse gap-1 rounded-xl bg-white/[0.06] p-1.5 ring-1 ring-inset ring-white/10">
            {files.map((color, i) => (
              <motion.span
                key={`${mode}-${d}-${i}`}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28, delay: d * 0.08 + i * 0.05 }}
                className="h-[18px] rounded-[5px]"
                style={{ background: color }}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-white/45">Drive {d + 1}</span>
        </div>
      ))}
    </div>
  )
}
