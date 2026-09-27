import { useMemo } from 'react'
import { HardDrive } from 'lucide-react'
import { formatBytes } from '@/lib/format'
import { poolCapacity, useStorage, type Drive } from '@/stores/storage'
import type { Sample, SystemStats } from '@/stores/system'
import { StreamChart } from '../chart/StreamChart'
import { COLORS, STATUS } from '../lib/theme'
import { BigValue, StatCard, splitUnit } from './StatCard'

const HEALTH: Record<Drive['health'], string> = {
  healthy: STATUS.good,
  warning: STATUS.warning,
  failing: STATUS.critical,
}

export function StorageCard({ stats, history, times }: { stats: SystemStats; history: Sample[]; times: number[] }) {
  const drives = useStorage((s) => s.drives)
  const mode = useStorage((s) => s.poolMode)
  const pool = useMemo(() => drives.filter((d) => d.inPool), [drives])

  // Demo figures follow the simulated pool; live ones come from the real disk.
  const capacity = poolCapacity(drives, mode)
  const total = stats.source === 'demo' && capacity > 0 ? capacity : stats.storage.total
  const used = Math.min(stats.storage.used, total)
  const percent = total ? Math.round((used / total) * 100) : 0
  const poolLabel = pool.length
    ? `${mode === 'mirrored' ? 'Mirrored' : 'Combined'} pool · ${pool.length} ${pool.length === 1 ? 'drive' : 'drives'}`
    : 'No drives in the pool'

  const series = useMemo(
    () => [{ id: 'storage', label: 'Used', color: COLORS.storage, values: history.map((h) => h.storage) }],
    [history],
  )
  const [value, unit] = splitUnit(formatBytes(used))

  return (
    <StatCard
      icon={<HardDrive size={16} strokeWidth={2.2} />}
      title="Storage"
      color={COLORS.storage}
      aside={`${percent}% used`}
      chart={
        <StreamChart
          times={times}
          series={series}
          max={total || 1}
          format={(v) => formatBytes(v)}
          tickFormat={(v) => `${Math.round((v / (total || 1)) * 100)}%`}
          label="Storage used over the last few minutes"
        />
      }
    >
      <BigValue value={value} unit={unit} after={`of ${formatBytes(total)}`} className="pt-1" />
      <div className="mt-2.5 text-[13px] text-white/50">
        <span className="font-medium text-white/75 tabular-nums">{formatBytes(Math.max(0, total - used))}</span> free
      </div>
      <div className="mt-4">
        <div className="mb-2 text-[12px] font-medium text-white/45">{poolLabel}</div>
        <ul className="flex flex-wrap gap-1.5">
          {pool.map((d) => (
            <li
              key={d.id}
              className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/[0.06] pr-3 pl-2.5 text-[12px] ring-1 ring-white/[0.08] ring-inset"
              title={`${d.model} · ${d.health}`}
            >
              <span className="size-1.5 rounded-full" style={{ background: HEALTH[d.health] }} aria-hidden />
              <span className="font-medium text-white/80">{d.name}</span>
              <span className="text-white/45 tabular-nums">{formatBytes(d.size)}</span>
            </li>
          ))}
        </ul>
      </div>
    </StatCard>
  )
}
