import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { cn } from '@/lib/cn'
import { curveAt, curvePath, niceCeil, tangents } from '../lib/curve'
import { SURFACE } from '../lib/theme'
import { prefersReducedMotion, useElementWidth } from '../lib/useElementWidth'
import { ChartTooltip } from './ChartTooltip'
import { TickLabel } from './TickLabel'

export interface ChartSeries {
  id: string
  label: string
  color: string
  /** One value per entry in `times`. */
  values: number[]
}

interface StreamChartProps {
  /** Sample timestamps, oldest first. */
  times: number[]
  series: ChartSeries[]
  /** Fixed top of the y-axis. Omit to scale to the data. */
  max?: number
  /** Smallest top for an auto-scaled axis, so a quiet line doesn't fill the chart. */
  minMax?: number
  height?: number
  /** Value in the tooltip. */
  format: (value: number) => string
  /** Axis labels. Defaults to `format`. */
  tickFormat?: (value: number) => string
  /** Accessible name, e.g. "CPU usage". */
  label: string
  className?: string
}

/** The store keeps 90 samples; showing 86 steps lets the oldest scroll out of view before it's dropped. */
const STEPS = 86
const PAD_TOP = 18
/** Room on the right for the live dot. */
const PAD_RIGHT = 6
/** Width of the fade on the left edge. */
const FADE = 48
/** Gridlines, as fractions of the axis. */
const TICKS = [0.5, 1]
/**
 * When a sample arrives the curve glides one step left, then rests until the
 * next one. Resting (rather than scrolling non-stop) matters: every redraw
 * inside the sheet also re-blurs the wallpaper behind it.
 */
const GLIDE_MS = 900
/** Redraw cap while gliding (~30 fps): at a few px per second it looks the same as 60. */
const GLIDE_FRAME_MS = 32

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

interface Motion {
  /** How many samples the drawing trails the data by. Eases to 0, so new points glide in from the right. */
  lag: number
  /** Lag when the current glide started, and when. */
  glideFrom: number
  glideStart: number
  /** The y-axis top currently drawn; eases towards the target when an auto axis rescales. */
  top: number
  pointerX: number | null
  /** Sample picked with the keyboard. */
  keyT: number | null
  /** Sample the tooltip shows. */
  hoverT: number | null
  raf: number
  last: number
  painted: number
  prevLastT: number | null
}

/**
 * A live area chart that glides smoothly as samples arrive: nothing is
 * re-mounted, the curve is redrawn imperatively on animation frames while it
 * moves, and the React tree only re-renders when the data or hovered sample
 * changes.
 */
export function StreamChart({
  times,
  series,
  max,
  minMax = 1,
  height = 132,
  format,
  tickFormat = format,
  label,
  className,
}: StreamChartProps) {
  const uid = useId().replace(/:/g, '')
  const [wrapRef, width] = useElementWidth<HTMLDivElement>()
  const [hoverT, setHoverT] = useState<number | null>(null)

  // The axis top: fixed, or the visible peak rounded up to a clean number.
  const top = useMemo(() => {
    if (max !== undefined) return max
    let peak = 0
    for (const s of series) for (const v of s.values.slice(-(STEPS + 2))) peak = Math.max(peak, v)
    return Math.max(minMax, niceCeil(peak * 1.12))
  }, [max, minMax, series])

  const data = useRef({ times, series, top, width, height })
  const motion = useRef<Motion>({
    lag: 0,
    glideFrom: 0,
    glideStart: 0,
    top,
    pointerX: null,
    keyT: null,
    hoverT: null,
    raf: 0,
    last: 0,
    painted: 0,
    prevLastT: null,
  })
  const lines = useRef<(SVGPathElement | null)[]>([])
  const areas = useRef<(SVGPathElement | null)[]>([])
  const ends = useRef<(SVGGElement | null)[]>([])
  const dots = useRef<(SVGCircleElement | null)[]>([])
  const crosshair = useRef<SVGGElement>(null)
  const fade = useRef<SVGLinearGradientElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const kick = useRef<() => void>(() => {})

  const geometry = useCallback(() => {
    const d = data.current
    const m = motion.current
    const pw = Math.max(1, d.width - PAD_RIGHT)
    const bottom = d.height - 1
    const n = d.times.length
    const step = pw / STEPS
    return {
      pw,
      bottom,
      n,
      x: (i: number) => pw - (n - 1 - i - m.lag) * step,
      y: (v: number) => bottom - Math.min(1, Math.max(0, (v || 0) / m.top)) * (bottom - PAD_TOP),
      /** Index of the sample under an x position. */
      indexAt: (px: number) => Math.round(n - 1 - m.lag + (px - pw) / step),
      firstVisible: Math.max(0, Math.ceil(n - 1 - m.lag - pw / step)),
    }
  }, [])

  const paint = useCallback(() => {
    const d = data.current
    const m = motion.current
    if (d.width <= 0 || !d.times.length) return
    const g = geometry()
    // One extra point past each edge keeps the curve's shape continuous as it scrolls.
    const first = Math.max(0, g.firstVisible - 1)
    const xs: number[] = []
    for (let i = first; i < g.n; i++) xs.push(g.x(i))
    const edge = Math.min(g.pw, xs[xs.length - 1])
    // Fade in from the oldest point, so a short history doesn't end in a hard edge.
    const fadeFrom = Math.max(0, xs[0])
    const fadeWidth = Math.max(1, Math.min(FADE, (edge - fadeFrom) * 0.35))
    fade.current?.setAttribute('x1', fadeFrom.toFixed(2))
    fade.current?.setAttribute('x2', (fadeFrom + fadeWidth).toFixed(2))

    d.series.forEach((s, k) => {
      const ys: number[] = []
      for (let i = first; i < g.n; i++) ys.push(g.y(s.values[i]))
      const tan = tangents(xs, ys)
      const line = curvePath(xs, ys, tan)
      lines.current[k]?.setAttribute('d', line)
      areas.current[k]?.setAttribute(
        'd',
        xs.length > 1 ? `${line}L${xs[xs.length - 1].toFixed(2)},${g.bottom}L${xs[0].toFixed(2)},${g.bottom}Z` : '',
      )
      const endY = curveAt(edge, xs, ys, tan)
      ends.current[k]?.setAttribute('transform', `translate(${edge.toFixed(2)},${endY.toFixed(2)})`)
    })

    // Hover / keyboard inspection.
    let hi = -1
    if (m.pointerX !== null) {
      hi = Math.max(0, Math.min(g.n - 1, g.indexAt(m.pointerX)))
      if (g.x(hi) > g.pw + 0.5) hi -= 1
      if (hi >= 0 && g.x(hi) < 0) hi += 1
    } else if (m.keyT !== null) {
      hi = d.times.lastIndexOf(m.keyT)
      if (hi < 0 || g.x(hi) < 0) {
        hi = Math.min(g.n - 1, g.firstVisible)
        m.keyT = d.times[hi]
      }
    }

    const cross = crosshair.current
    const tipEl = tip.current
    if (hi >= 0 && hi < g.n) {
      // The newest sample may still be gliding in from past the edge.
      const x = Math.min(g.pw, g.x(hi))
      cross?.setAttribute('transform', `translate(${x.toFixed(2)},0)`)
      cross?.style.setProperty('opacity', '1')
      d.series.forEach((s, k) => dots.current[k]?.setAttribute('cy', g.y(s.values[hi]).toFixed(2)))
      if (tipEl) {
        const tw = tipEl.offsetWidth
        let left = x + 14
        if (left + tw > d.width) left = x - 14 - tw
        tipEl.style.transform = `translate3d(${Math.max(0, left).toFixed(1)}px,0,0)`
        tipEl.style.opacity = '1'
      }
      if (m.hoverT !== d.times[hi]) {
        m.hoverT = d.times[hi]
        setHoverT(m.hoverT)
      }
    } else {
      cross?.style.setProperty('opacity', '0')
      if (tipEl) tipEl.style.opacity = '0'
      if (m.hoverT !== null) {
        m.hoverT = null
        setHoverT(null)
      }
    }
  }, [geometry])

  // Animation loop: runs while the curve is gliding or rescaling, then sleeps.
  useEffect(() => {
    const m = motion.current
    const frame = (now: number) => {
      // rAF timestamps can predate the kick slightly; never step backwards.
      const dt = Math.max(0, Math.min(64, now - m.last))
      m.last = now
      const target = data.current.top
      if (m.lag > 0) {
        const t = Math.max(0, Math.min(1, (now - m.glideStart) / GLIDE_MS))
        m.lag = t >= 1 ? 0 : m.glideFrom * (1 - easeInOut(t))
      }
      const diff = target - m.top
      m.top = Math.abs(diff) <= target * 0.002 ? target : m.top + diff * (1 - Math.exp(-dt / 160))
      const moving = m.lag > 0 || m.top !== target
      if (!moving || now - m.painted >= GLIDE_FRAME_MS) {
        paint()
        m.painted = now
      }
      m.raf = moving ? requestAnimationFrame(frame) : 0
    }
    kick.current = () => {
      if (m.raf) return
      m.last = performance.now()
      m.raf = requestAnimationFrame(frame)
    }
    kick.current()
    return () => {
      cancelAnimationFrame(m.raf)
      m.raf = 0
    }
  }, [paint])

  // New data: note how many samples arrived so the curve can glide over to them.
  useLayoutEffect(() => {
    const m = motion.current
    const lastT = times.length ? times[times.length - 1] : null
    if (m.prevLastT !== null && lastT !== null && lastT !== m.prevLastT) {
      if (prefersReducedMotion()) m.lag = 0
      else {
        // Several at once (e.g. after a hidden tab) glide over together.
        const idx = times.lastIndexOf(m.prevLastT)
        m.lag = m.glideFrom = Math.min(3, m.lag + (idx >= 0 ? times.length - 1 - idx : 1))
        m.glideStart = performance.now()
      }
    }
    m.prevLastT = lastT
    if (prefersReducedMotion()) m.top = top
    data.current = { times, series, top, width, height }
    paint()
    kick.current()
  }, [times, series, top, width, height, paint])

  // The tooltip's content (and so its width) changed: place it again.
  useLayoutEffect(() => paint(), [hoverT, paint])

  const onPointer = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    motion.current.pointerX = e.clientX - rect.left
    kick.current()
    paint()
  }
  const onPointerLeave = () => {
    motion.current.pointerX = null
    paint()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const m = motion.current
    const n = data.current.times.length
    if (!n) return
    const { firstVisible } = geometry()
    const cur = m.keyT !== null ? data.current.times.lastIndexOf(m.keyT) : -1
    let next: number
    if (e.key === 'ArrowLeft') next = cur < 0 ? n - 1 : Math.max(firstVisible, cur - 1)
    else if (e.key === 'ArrowRight') next = cur < 0 ? n - 1 : Math.min(n - 1, cur + 1)
    else if (e.key === 'Home') next = firstVisible
    else if (e.key === 'End') next = n - 1
    else if (e.key === 'Escape' && m.keyT !== null) {
      // Clear the inspection instead of closing the sheet.
      e.preventDefault()
      m.keyT = null
      paint()
      return
    } else return
    e.preventDefault()
    m.keyT = data.current.times[next]
    m.pointerX = null
    paint()
  }
  const onBlur = () => {
    motion.current.keyT = null
    paint()
  }

  const bottom = height - 1
  const pw = Math.max(1, width - PAD_RIGHT)
  const yOf = (f: number) => bottom - f * (bottom - PAD_TOP)
  const hoverIndex = hoverT === null ? -1 : times.lastIndexOf(hoverT)
  const multi = series.length > 1

  return (
    <div
      ref={wrapRef}
      role="group"
      aria-roledescription="chart"
      aria-label={`${label}. Use the arrow keys to inspect earlier values.`}
      tabIndex={0}
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      className={cn(
        'relative cursor-crosshair rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/50',
        className,
      )}
      style={{ height, touchAction: 'pan-y' }}
    >
      {width > 0 && (
        <svg width={width} height={height} className="absolute inset-0 block overflow-visible" aria-hidden>
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.id}
                id={`${uid}-fill-${s.id}`}
                x1="0"
                x2="0"
                y1={PAD_TOP}
                y2={bottom}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor={s.color} stopOpacity={multi ? 0.24 : 0.34} />
                <stop offset="1" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
            <linearGradient ref={fade} id={`${uid}-fade`} y1="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#fff" stopOpacity="1" />
            </linearGradient>
            <mask id={`${uid}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
              <rect x="0" y="0" width={pw} height={height} fill={`url(#${uid}-fade)`} />
            </mask>
          </defs>

          {TICKS.map((f) => (
            <line
              key={f}
              x1="0"
              x2={pw}
              y1={yOf(f)}
              y2={yOf(f)}
              stroke="rgb(255 255 255 / 0.07)"
              shapeRendering="crispEdges"
            />
          ))}
          <line x1="0" x2={pw} y1={bottom} y2={bottom} stroke="rgb(255 255 255 / 0.14)" shapeRendering="crispEdges" />

          <g mask={`url(#${uid}-mask)`}>
            {series.map((s, k) => (
              <path key={s.id} ref={(el) => void (areas.current[k] = el)} fill={`url(#${uid}-fill-${s.id})`} />
            ))}
            {series.map((s, k) => (
              <path
                key={s.id}
                ref={(el) => void (lines.current[k] = el)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </g>

          <g ref={crosshair} style={{ opacity: 0 }} className="transition-opacity duration-150">
            <line
              x1="0"
              x2="0"
              y1={PAD_TOP - 4}
              y2={bottom}
              stroke="rgb(255 255 255 / 0.4)"
              shapeRendering="crispEdges"
            />
            {series.map((s, k) => (
              <circle
                key={s.id}
                ref={(el) => void (dots.current[k] = el)}
                cx="0"
                r="4.5"
                fill={s.color}
                stroke={SURFACE}
                strokeWidth="2"
              />
            ))}
          </g>

          {series.map((s, k) => (
            <g key={s.id} ref={(el) => void (ends.current[k] = el)}>
              <circle r="8" fill={s.color} opacity="0.18" />
              <circle r="3.5" fill={s.color} stroke={SURFACE} strokeWidth="2" />
            </g>
          ))}
        </svg>
      )}

      {TICKS.map((f) => (
        <TickLabel key={f} top={yOf(f) - 15} text={tickFormat(top * f)} />
      ))}

      <ChartTooltip ref={tip} series={series} index={hoverIndex} time={times[hoverIndex]} format={format} />
    </div>
  )
}
