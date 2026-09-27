import { useMemo, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Network } from 'lucide-react'
import { formatBytes } from '@/lib/format'
import type { Sample, SystemStats } from '@/stores/system'
import { StreamChart } from '../chart/StreamChart'
import { formatRate } from '../lib/format'
import { COLORS } from '../lib/theme'
import { BigValue, StatCard, splitUnit } from './StatCard'

interface Direction {
  label: string
  now: number
  peak: number
  total: number
  color: string
  icon: ReactNode
}

function Rate({ label, now, peak, total, color, icon, period }: Direction & { period: string }) {
  const [num, unit] = splitUnit(formatRate(now))
  return (
    <div className="min-w-0">
      <BigValue value={num} unit={unit} />
      <div className="mt-2.5 flex items-center gap-2 text-[13px] text-white/55">
        <span className="h-[3px] w-3.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
        <span className="flex items-center gap-1">
          {icon}
          {label}
        </span>
      </div>
      <dl className="mt-4 space-y-1 border-t border-white/[0.06] pt-3 text-[12.5px]">
        <div className="flex justify-between gap-2">
          <dt className="text-white/45">Peak</dt>
          <dd className="font-medium text-white/80 tabular-nums">{formatRate(peak)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="truncate text-white/45">{period}</dt>
          <dd className="font-medium text-white/80 tabular-nums">{formatBytes(total)}</dd>
        </div>
      </dl>
    </div>
  )
}

/** Peak rate and bytes moved across the history. */
function summarize(history: Sample[], key: 'rx' | 'tx') {
  let peak = 0
  let total = 0
  history.forEach((s, i) => {
    peak = Math.max(peak, s[key])
    if (i > 0) total += s[key] * Math.min(10, (s.t - history[i - 1].t) / 1000)
  })
  return { peak, total }
}

export function NetworkCard({ stats, history, times }: { stats: SystemStats; history: Sample[]; times: number[] }) {
  const series = useMemo(
    () => [
      { id: 'rx', label: 'Download', color: COLORS.download, values: history.map((h) => h.rx) },
      { id: 'tx', label: 'Upload', color: COLORS.upload, values: history.map((h) => h.tx) },
    ],
    [history],
  )
  const rx = useMemo(() => summarize(history, 'rx'), [history])
  const tx = useMemo(() => summarize(history, 'tx'), [history])
  const span = history.length > 1 ? history[history.length - 1].t - history[0].t : 0
  const period = `Past ${Math.max(1, Math.round(span / 60e3))} min`
  const net = stats.network

  return (
    <StatCard
      icon={<Network size={16} strokeWidth={2.2} />}
      title="Network"
      color={COLORS.download}
      aside={net ? undefined : 'Unavailable'}
      chart={
        <StreamChart
          times={times}
          series={series}
          minMax={10e3}
          format={formatRate}
          label="Network download and upload speed over the last few minutes"
        />
      }
    >
      <div className="grid grid-cols-2 gap-5 pt-1 sm:gap-8">
        <Rate
          label="Download"
          now={net?.rx ?? 0}
          {...rx}
          color={COLORS.download}
          icon={<ArrowDown size={13} />}
          period={period}
        />
        <Rate
          label="Upload"
          now={net?.tx ?? 0}
          {...tx}
          color={COLORS.upload}
          icon={<ArrowUp size={13} />}
          period={period}
        />
      </div>
    </StatCard>
  )
}
