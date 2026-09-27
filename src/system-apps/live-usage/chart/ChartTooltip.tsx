import type { Ref } from 'react'
import { formatClock } from '../lib/format'
import type { ChartSeries } from './StreamChart'

interface ChartTooltipProps {
  ref?: Ref<HTMLDivElement>
  series: ChartSeries[]
  /** Sample index, or -1 when nothing is hovered. */
  index: number
  time: number | undefined
  format: (value: number) => string
}

/**
 * The hover readout. Always mounted so the chart can move it every frame
 * without React; the chart also controls its opacity.
 */
export function ChartTooltip({ ref, series, index, time, format }: ChartTooltipProps) {
  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-0 left-0 z-10 rounded-xl bg-[rgb(26_26_34/0.96)] px-3 py-2 opacity-0 shadow-[0_8px_24px_-6px_rgb(0_0_0/0.6)] ring-1 ring-white/10 transition-opacity duration-150 will-change-transform"
    >
      {index >= 0 && (
        <>
          {series.map((s) => (
            <div key={s.id} className="flex items-center gap-2 whitespace-nowrap">
              <span className="h-[3px] w-3 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
              <span className="text-[13px] font-semibold text-white tabular-nums">{format(s.values[index] ?? 0)}</span>
              <span className="text-[12px] text-white/55">{s.label}</span>
            </div>
          ))}
          {time !== undefined && <div className="mt-1 text-[11px] text-white/45 tabular-nums">{formatClock(time)}</div>}
        </>
      )}
    </div>
  )
}
