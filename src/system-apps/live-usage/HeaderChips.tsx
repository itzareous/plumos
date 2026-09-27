import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Activity, Clock3 } from 'lucide-react'
import { formatDuration } from '@/lib/format'
import type { SystemStats } from '@/stores/system'
import { cn } from '@/lib/cn'

function Chip({ children, title, className }: { children: ReactNode; title?: string; className?: string }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium whitespace-nowrap text-white/75 ring-1 ring-white/10 ring-inset tabular-nums',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Where the numbers come from, plus uptime and load average. */
export function HeaderChips({ stats, className }: { stats: SystemStats; className?: string }) {
  const live = stats.source === 'live'
  const load = stats.cpu.load.slice(0, 3)
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Chip
        title={live ? `Reading real stats from ${stats.hostname}` : 'No Plumos server found, showing simulated numbers'}
        className={live ? 'text-white/90' : undefined}
      >
        <span className="relative flex size-2" aria-hidden>
          {/* One pulse per reading, so the dot beats with the data rather than on a loop. */}
          {live && (
            <motion.span
              key={stats.timestamp}
              className="absolute inset-0 rounded-full bg-emerald-400"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 2.6, opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            />
          )}
          <span className={cn('relative size-2 rounded-full', live ? 'bg-emerald-400' : 'bg-amber-400')} />
        </span>
        {live ? (
          <span className="max-w-[16ch] truncate">
            Live from <span className="text-white">{stats.hostname}</span>
          </span>
        ) : (
          'Demo data'
        )}
      </Chip>
      <Chip title="Time since the server started">
        <Clock3 size={14} className="text-white/50" aria-hidden />
        Up {formatDuration(stats.uptime)}
      </Chip>
      {load.length > 0 && (
        <Chip title="Load average over the last 1, 5 and 15 minutes">
          <Activity size={14} className="text-white/50" aria-hidden />
          <span className="sr-only">Load average</span>
          {load.map((l, i) => (
            <span key={i} className={i ? 'text-white/45' : undefined}>
              {l.toFixed(2)}
            </span>
          ))}
        </Chip>
      )}
    </div>
  )
}
