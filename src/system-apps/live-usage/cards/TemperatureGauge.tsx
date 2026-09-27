import { motion } from 'motion/react'
import { STATUS, temperatureLevel } from '../lib/theme'
import { temperatureParts } from '../lib/format'

const MIN_C = 20
const MAX_C = 100
/** The arc opens at the bottom: 240° of sweep, from -120° to +120°. */
const SWEEP = 120

function point(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)]
}

interface TemperatureGaugeProps {
  celsius: number | null
  unit: 'c' | 'f'
  size?: number
}

/** CPU temperature on an arc, coloured and labelled by how hot it is. */
export function TemperatureGauge({ celsius, unit, size = 104 }: TemperatureGaugeProps) {
  const stroke = 8
  const c = size / 2
  const r = c - stroke / 2 - 1
  const [x0, y0] = point(c, c, r, -SWEEP)
  const [x1, y1] = point(c, c, r, SWEEP)
  const arc = `M${x0},${y0} A${r},${r} 0 1 1 ${x1},${y1}`

  const known = celsius !== null
  const fraction = known ? Math.max(0.02, Math.min(1, (celsius - MIN_C) / (MAX_C - MIN_C))) : 0
  const level = known ? temperatureLevel(celsius) : null
  const color = level ? STATUS[level.level] : 'transparent'
  const parts = known ? temperatureParts(celsius, unit) : null

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="meter"
      aria-label="CPU temperature"
      aria-valuemin={MIN_C}
      aria-valuemax={MAX_C}
      aria-valuenow={known ? Math.round(celsius) : undefined}
      aria-valuetext={parts ? `${parts.value}°${parts.unit}, ${level?.label}` : 'No temperature sensor'}
    >
      <svg width={size} height={size} className="block" aria-hidden>
        <path d={arc} fill="none" stroke="rgb(255 255 255 / 0.09)" strokeWidth={stroke} strokeLinecap="round" />
        {known && (
          <motion.path
            d={arc}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            initial={{ pathLength: 0, stroke: color }}
            animate={{ pathLength: fraction, stroke: color }}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        {parts ? (
          <span className="text-[24px] leading-none font-semibold tracking-tight text-white tabular-nums">
            {parts.value}°<span className="text-[13px] font-medium text-white/50">{parts.unit}</span>
          </span>
        ) : (
          <span className="text-[22px] leading-none font-semibold text-white/35">—</span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0.5 flex items-center justify-center gap-1.5 text-[11.5px] font-medium text-white/60">
        {level && <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />}
        {level ? level.label : 'No sensor'}
      </div>
    </div>
  )
}
