import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import { formatBytes, formatTemperature } from '@/lib/format'
import { useSettings } from '@/stores/settings'
import type { Drive, PoolTask } from '@/stores/storage'
import { DriveGlyph } from './DriveGlyph'
import { HEALTH, KIND_LABEL } from './labels'
import { TaskProgress, taskLabel } from './TaskProgress'

export function DriveRow({ drive, task, actions }: { drive: Drive; task: PoolTask | null; actions: ReactNode }) {
  const unit = useSettings((s) => s.temperatureUnit)
  const busy = task?.driveId === drive.id ? task : null
  const isNew = drive.connectedAt !== undefined && !drive.inPool && drive.location === 'internal'
  const health = HEALTH[drive.health]

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="overflow-hidden [&+&]:border-t [&+&]:border-white/[0.06]"
    >
      <div className={cn('flex flex-wrap items-center gap-x-3.5 gap-y-3 px-4 py-3.5', isNew && !busy && 'bg-accent-soft/40')}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
          <DriveGlyph kind={drive.kind} size={36} />
        </span>
        <div className="min-w-0 flex-1 basis-[150px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold">{drive.name}</span>
            {isNew && <Badge className="bg-accent text-white">New</Badge>}
            {drive.inPool && (
              <Badge className="gap-1 bg-white/10 text-white/75">
                <Check size={11} strokeWidth={3} /> In pool
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-white/50">
            {drive.model} · {formatBytes(drive.size)} {KIND_LABEL[drive.kind]}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-white/50">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', health.className)}>
              <span className="size-1.5 rounded-full bg-current" />
              {health.label}
            </span>
            <span className="tabular-nums">{formatTemperature(drive.temperature, unit)}</span>
          </div>
        </div>
        {!busy && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <AnimatePresence initial={false}>
        {busy && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <TaskProgress task={busy} label={taskLabel(busy, drive.name)} className="px-4 pb-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
