import { motion } from 'motion/react'
import type { PoolTask } from '@/stores/storage'
import { cn } from '@/lib/cn'

export function taskLabel(task: PoolTask, driveName?: string) {
  if (task.kind === 'expand') return 'Expanding storage…'
  if (task.kind === 'shrink') return `Moving files off ${driveName ?? 'the drive'}…`
  return task.mode === 'mirrored' ? 'Making a second copy of everything…' : 'Combining drives…'
}

/** A labelled progress bar with a moving sheen, for pool changes. */
export function TaskProgress({ task, label, className }: { task: PoolTask; label: string; className?: string }) {
  const pct = Math.round(task.progress * 100)
  return (
    <div className={cn('w-full', className)} role="status" aria-live="polite">
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[12.5px]">
        <span className="font-medium text-white/85">{task.progress >= 1 ? 'Finishing up…' : label}</span>
        <span className="text-white/50 tabular-nums">{pct}%</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/12">
        <motion.div
          className="relative h-full overflow-hidden rounded-full bg-accent"
          initial={false}
          animate={{ width: `${Math.max(2, pct)}%` }}
          transition={{ type: 'spring', stiffness: 140, damping: 26 }}
        >
          <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.45),transparent)] bg-[length:200%_100%]" />
        </motion.div>
      </div>
    </div>
  )
}
