import { useId, useMemo } from 'react'
import { cn } from '@/lib/cn'
import { curvePath, tangents } from '../lib/curve'

interface SparklineProps {
  values: number[]
  color: string
  /** Size it with CSS; the drawing stretches to fit while the stroke stays 1.5px. */
  className?: string
  /** Smallest top of the scale, so a near-idle app draws a calm, low line. */
  floor?: number
}

const W = 100
const H = 24

/** A tiny trend line with a soft fill, for table rows. */
export function Sparkline({ values, color, className, floor = 0 }: SparklineProps) {
  const id = useId().replace(/:/g, '')
  const { line, area } = useMemo(() => {
    if (values.length < 2) return { line: '', area: '' }
    const top = Math.max(floor, ...values) * 1.15 || 1
    const pad = 2
    const step = W / (values.length - 1)
    const xs = values.map((_, i) => i * step)
    const ys = values.map((v) => H - pad - (v / top) * (H - pad * 2))
    const path = curvePath(xs, ys, tangents(xs, ys))
    return { line: path, area: `${path}L${W},${H}L0,${H}Z` }
  }, [values, floor])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn('block h-6 shrink-0 overflow-visible', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
