import { useMemo } from 'react'
import { MemoryStick } from 'lucide-react'
import { formatBytes } from '@/lib/format'
import type { Sample, SystemStats } from '@/stores/system'
import { StreamChart } from '../chart/StreamChart'
import { memorySplit } from '../lib/demo'
import { COLORS } from '../lib/theme'
import { MemoryBar } from './MemoryBar'
import { BigValue, StatCard, splitUnit } from './StatCard'

export function MemoryCard({ stats, history, times }: { stats: SystemStats; history: Sample[]; times: number[] }) {
  const { used, total } = stats.memory
  const series = useMemo(
    () => [{ id: 'memory', label: 'Used', color: COLORS.memory, values: history.map((h) => h.memory) }],
    [history],
  )
  const split = memorySplit(used, total, stats.timestamp)
  const [value, unit] = splitUnit(formatBytes(used))
  const percent = total ? Math.round((used / total) * 100) : 0

  return (
    <StatCard
      icon={<MemoryStick size={16} strokeWidth={2.2} />}
      title="Memory"
      color={COLORS.memory}
      aside={`${percent}% used`}
      chart={
        <StreamChart
          times={times}
          series={series}
          max={total || 1}
          format={(v) => formatBytes(v)}
          tickFormat={(v) => `${Math.round((v / (total || 1)) * 100)}%`}
          label="Memory in use over the last few minutes"
        />
      }
    >
      <BigValue value={value} unit={unit} after={`of ${formatBytes(total)}`} className="pt-1" />
      <div className="mt-5">
        <MemoryBar split={split} total={total} />
      </div>
    </StatCard>
  )
}
