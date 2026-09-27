import { motion } from 'motion/react'
import { formatBytes } from '@/lib/format'
import type { MemorySplit } from '../lib/demo'
import { COLORS } from '../lib/theme'

const FREE = 'rgb(255 255 255 / 0.08)'

/** Where the memory goes: a stacked bar of the whole capacity, with a legend. */
export function MemoryBar({ split, total }: { split: MemorySplit; total: number }) {
  const parts = [
    { id: 'apps', label: 'Apps', value: split.apps, color: COLORS.memory },
    { id: 'system', label: 'System', value: split.system, color: COLORS.memorySystem },
    { id: 'cache', label: 'Cache', value: split.cache, color: COLORS.memoryCache },
    { id: 'free', label: 'Free', value: split.free, color: FREE },
  ]
  return (
    <div>
      <div
        className="flex h-2.5 gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label={parts.map((p) => `${p.label} ${formatBytes(p.value)}`).join(', ')}
      >
        {parts.map((p) => (
          <motion.div
            key={p.id}
            className="h-full min-w-[3px] basis-0 rounded-[2px]"
            style={{ background: p.color }}
            initial={false}
            animate={{ flexGrow: total ? p.value / total : 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 24 }}
          />
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-1.5">
        {parts.map((p) => (
          <div key={p.id} className="flex min-w-0 items-center gap-2 text-[12.5px]">
            <span
              className="size-2 shrink-0 rounded-[3px]"
              style={{ background: p.id === 'free' ? 'rgb(255 255 255 / 0.18)' : p.color }}
              aria-hidden
            />
            <dt className="text-white/55">{p.label}</dt>
            <dd className="ml-auto font-medium text-white/85 tabular-nums">{formatBytes(p.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
