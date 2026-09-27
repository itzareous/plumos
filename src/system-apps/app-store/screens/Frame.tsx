import type { ReactNode } from 'react'
import type { AppInfo } from '@/apps/types'
import type { AppColors } from '../colors'

export interface MockProps {
  app: AppInfo
  c: AppColors
  /** Seeded random numbers in [0, 1). */
  r: () => number
  /** Unique prefix for gradient ids. */
  id: string
}

export const W = 400
export const H = 250
export const TOP = 26

/** A rounded placeholder bar standing in for a line of text. */
export function Bar({
  x,
  y,
  w,
  h = 4,
  o = 0.2,
  fill = 'white',
}: {
  x: number
  y: number
  w: number
  h?: number
  o?: number
  fill?: string
}) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} fillOpacity={o} />
}

export function Label({
  x,
  y,
  children,
  size = 8,
  o = 0.85,
  weight = 600,
  anchor,
  mono,
  fill = 'white',
}: {
  x: number
  y: number
  children: ReactNode
  size?: number
  o?: number
  weight?: number
  anchor?: 'start' | 'middle' | 'end'
  mono?: boolean
  fill?: string
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight}
      fill={fill}
      fillOpacity={o}
      textAnchor={anchor}
      fontFamily={mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit'}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {children}
    </text>
  )
}

/** Window chrome shared by every mock: tinted backdrop, title bar and gradient defs. */
export function Frame({ app, c, id, children }: Omit<MockProps, 'r'> & { children: ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.from} />
          <stop offset="1" stopColor={c.to} />
        </linearGradient>
        <linearGradient id={`${id}-g2`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.to} />
          <stop offset="1" stopColor={c.accent} />
        </linearGradient>
        <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.accent} stopOpacity="0.45" />
          <stop offset="1" stopColor={c.accent} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.12" cy="0" r="1">
          <stop offset="0" stopColor={c.accent} stopOpacity="0.26" />
          <stop offset="0.6" stopColor={c.accent} stopOpacity="0.04" />
          <stop offset="1" stopColor={c.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="#0f1016" />
      <rect width={W} height={H} fill={`url(#${id}-glow)`} />
      <rect width={W} height={TOP} fill="white" fillOpacity="0.035" />
      <line x1="0" y1={TOP} x2={W} y2={TOP} stroke="white" strokeOpacity="0.07" />
      <rect x="10" y="7" width="12" height="12" rx="3.5" fill={`url(#${id}-g)`} />
      <Label x={28} y={16.5} size={8.5}>
        {app.name}
      </Label>
      <rect x="298" y="7.5" width="92" height="11" rx="5.5" fill="white" fillOpacity="0.07" />
      <circle cx="306" cy="13" r="2.4" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="1" />
      {children}
    </svg>
  )
}

/** A smooth-ish random series between 0 and 1. */
export function series(r: () => number, n: number, start = 0.5) {
  const out: number[] = []
  let v = start
  for (let i = 0; i < n; i++) {
    v = Math.min(0.95, Math.max(0.08, v + (r() - 0.45) * 0.28))
    out.push(v)
  }
  return out
}
