import { motion } from 'motion/react'
import { useSystem } from '@/stores/system'
import { useWindows } from '@/stores/windows'
import { formatBytes } from '@/lib/format'
import { WidgetFrame } from './WidgetFrame'

export function MemoryWidget() {
  const memory = useSystem((s) => s.stats.memory)
  const open = useWindows((s) => s.open)
  const ratio = memory.total ? memory.used / memory.total : 0
  const r = 40
  const c = 2 * Math.PI * r
  return (
    <WidgetFrame label="Live Usage" onClick={() => open('live-usage')}>
      <div className="flex h-full items-center gap-4">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth="10" />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="white"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={false}
            animate={{ strokeDashoffset: c * (1 - ratio) }}
          />
        </svg>
        <div>
          <div className="text-[13px] font-medium text-white/60">Memory</div>
          <div className="text-2xl font-bold tracking-tight">{formatBytes(memory.used)}</div>
          <div className="text-xs text-white/50">of {formatBytes(memory.total)}</div>
        </div>
      </div>
    </WidgetFrame>
  )
}
