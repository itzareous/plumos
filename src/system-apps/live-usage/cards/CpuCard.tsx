import { useMemo } from 'react'
import { Cpu } from 'lucide-react'
import { useSettings } from '@/stores/settings'
import type { Sample, SystemStats } from '@/stores/system'
import { StreamChart } from '../chart/StreamChart'
import { formatCpu } from '../lib/format'
import { COLORS } from '../lib/theme'
import { BigValue, StatCard } from './StatCard'
import { TemperatureGauge } from './TemperatureGauge'

/** "Intel(R) Xeon(R) CPU E5 @ 2.10GHz" → "Intel Xeon E5 @ 2.10GHz". */
const cleanModel = (model: string) =>
  model.replace(/\((R|TM|tm|r)\)/g, '').replace(/\bCPU\b/g, '').replace(/\s+/g, ' ').trim()

export function CpuCard({ stats, history, times }: { stats: SystemStats; history: Sample[]; times: number[] }) {
  const unit = useSettings((s) => s.temperatureUnit)
  const series = useMemo(
    () => [{ id: 'cpu', label: 'CPU', color: COLORS.cpu, values: history.map((h) => h.cpu) }],
    [history],
  )
  const { cpu } = stats
  const model = cleanModel(cpu.model)

  return (
    <StatCard
      icon={<Cpu size={16} strokeWidth={2.2} />}
      title="CPU"
      color={COLORS.cpu}
      aside={`${cpu.cores} ${cpu.cores === 1 ? 'core' : 'cores'}`}
      chart={
        <StreamChart
          times={times}
          series={series}
          max={100}
          format={formatCpu}
          tickFormat={(v) => `${v}%`}
          label="CPU usage over the last few minutes"
        />
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 pt-1">
          <BigValue value={String(Math.round(cpu.usage))} unit="%" />
          <div className="mt-2.5 text-[13px] text-white/50">Usage</div>
          <div className="mt-0.5 truncate text-[13px] font-medium text-white/75" title={cpu.model}>
            {model}
          </div>
        </div>
        <TemperatureGauge celsius={cpu.temperature} unit={unit} />
      </div>
    </StatCard>
  )
}
