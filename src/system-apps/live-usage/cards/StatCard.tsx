import type { ReactNode } from 'react'
import { Card } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import { tint } from '../lib/theme'

interface StatCardProps {
  icon: ReactNode
  title: string
  color: string
  /** Small text on the right of the title row. */
  aside?: ReactNode
  children: ReactNode
  chart: ReactNode
}

/** A usage card: title row, headline figures, and a live chart pinned to the bottom. */
export function StatCard({ icon, title, color, aside, children, chart }: StatCardProps) {
  return (
    <Card className="flex flex-col p-5 sm:p-6">
      <header className="flex h-7 items-center gap-2.5">
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-[9px]"
          style={{ background: tint(color), color }}
          aria-hidden
        >
          {icon}
        </span>
        <h2 className="text-[14px] font-semibold text-white/85">{title}</h2>
        {aside && <div className="ml-auto text-[12.5px] font-medium text-white/50 tabular-nums">{aside}</div>}
      </header>
      <div className="mt-4 flex-1">{children}</div>
      <div className="mt-5">{chart}</div>
    </Card>
  )
}

/**
 * A headline figure like "5.8 GB", with the unit set smaller. Tabular digits
 * keep neighbours still while the number ticks.
 */
export function BigValue({
  value,
  unit,
  after,
  className,
}: {
  value: string
  unit?: string
  after?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-baseline gap-1.5 whitespace-nowrap', className)}>
      <span className="text-[34px] leading-none font-semibold tracking-tight text-white tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-[20px] font-medium tracking-normal text-white/55">{unit}</span>}
      </span>
      {after && <span className="text-[15px] font-medium text-white/40 tabular-nums">{after}</span>}
    </div>
  )
}

/** "5.8 GB" → ["5.8", "GB"] so the unit can be set smaller. */
export function splitUnit(text: string): [string, string] {
  const i = text.lastIndexOf(' ')
  return i < 0 ? [text, ''] : [text.slice(0, i), text.slice(i + 1)]
}
