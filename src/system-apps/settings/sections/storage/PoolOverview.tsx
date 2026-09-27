import { AnimatePresence, motion } from 'motion/react'
import { Card } from '@/components/ui/controls'
import { formatBytes } from '@/lib/format'
import { TaskProgress, taskLabel } from './TaskProgress'
import { usePool } from './usePool'

/** Capacity bar for the pool, with drive boundaries marked in combined mode. */
export function PoolOverview() {
  const { members, mode, task, used, capacity, free, drives } = usePool()
  const ratio = capacity ? Math.min(1, used / capacity) : 0
  const total = members.reduce((s, d) => s + d.size, 0)
  const taskDrive = drives.find((d) => d.id === task?.driveId)

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div>
          <p className="text-[13px] font-medium text-white/55">Storage pool</p>
          <p className="mt-1 text-[30px] leading-none font-bold tracking-tight tabular-nums">
            {formatBytes(used)}
            <span className="text-[17px] font-semibold text-white/45"> of {formatBytes(capacity)} used</span>
          </p>
        </div>
        <p className="text-[13px] text-white/55 tabular-nums">{formatBytes(free)} available</p>
      </div>

      <div className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/12">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={false}
          animate={{ width: `${Math.max(ratio * 100, used ? 1 : 0)}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        />
        {mode === 'combined' &&
          members.slice(0, -1).map((d, i) => {
            const at = members.slice(0, i + 1).reduce((s, x) => s + x.size, 0) / (total || 1)
            return <span key={d.id} className="absolute inset-y-0 w-[2px] bg-[#1c1b24]" style={{ left: `calc(${at * 100}% - 1px)` }} />
          })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-white/50">
        <span>
          {members.length} {members.length === 1 ? 'drive' : 'drives'} · {formatBytes(total)} raw
        </span>
        <span>{mode === 'mirrored' && members.length > 1 ? 'Mirrored — every file is on two drives' : 'Combined — space adds up'}</span>
      </div>

      <AnimatePresence initial={false}>
        {task && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <TaskProgress task={task} label={taskLabel(task, taskDrive?.name)} className="mt-5 border-t border-white/[0.07] pt-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
