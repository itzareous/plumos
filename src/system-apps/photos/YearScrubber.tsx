import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { groupAtY, type GridLayout } from './layout'
import { shortMonth } from './format'
import type { Photo } from '@/lib/photos'

interface Props {
  layout: GridLayout
  items: Photo[]
  contentTop: number
  scrollTop: number
  maxScroll: number
  viewH: number
  compact: boolean
  onScrollTo: (top: number) => void
}

const TOP = 10
const BOTTOM = 108
const MIN_GAP = 17

/** The right-edge scrubber: year marks placed where they sit in the timeline, drag to fly through the years. */
export function YearScrubber({ layout, items, contentTop, scrollTop, maxScroll, viewH, compact, onScrollTo }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState(false)
  const [hoverY, setHoverY] = useState<number | null>(null)
  const [recent, setRecent] = useState(false)
  const trackH = Math.max(40, viewH - TOP - BOTTOM)

  // Show the handle for a moment whenever the grid scrolls.
  const last = useRef(scrollTop)
  useEffect(() => {
    if (Math.abs(last.current - scrollTop) < 2) return
    last.current = scrollTop
    setRecent(true)
    const t = setTimeout(() => setRecent(false), 1300)
    return () => clearTimeout(t)
  }, [scrollTop])

  const years = useMemo(() => {
    const out: { year: number; y: number; top: number }[] = []
    let lastY = -Infinity
    const seen = new Set<number>()
    for (const g of layout.groups) {
      if (seen.has(g.year)) continue
      seen.add(g.year)
      const top = Math.min(maxScroll, contentTop + g.start)
      const y = maxScroll > 0 ? (top / maxScroll) * trackH : 0
      if (y - lastY < MIN_GAP) continue
      out.push({ year: g.year, y, top })
      lastY = y
    }
    return out
  }, [layout, contentTop, maxScroll, trackH])

  if (layout.grouping !== 'month' || maxScroll < viewH * 1.2 || !layout.groups.length) return null

  const toScroll = (clientY: number) => {
    const rect = trackRef.current!.getBoundingClientRect()
    const t = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    return t * maxScroll
  }
  const labelAt = (top: number) => {
    const g = layout.groups[groupAtY(layout, top - contentTop)]
    return g ? shortMonth(items[g.index0].date) : ''
  }
  const thumbY = maxScroll > 0 ? (Math.min(scrollTop, maxScroll) / maxScroll) * trackH : 0
  const active = drag || hoverY !== null || recent
  const bubbleY = drag || hoverY === null ? thumbY : hoverY
  const bubbleTop = drag || hoverY === null ? scrollTop : (hoverY / trackH) * maxScroll

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag(true)
    onScrollTo(toScroll(e.clientY))
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = trackRef.current!.getBoundingClientRect()
    if (drag) onScrollTo(toScroll(e.clientY))
    else if (e.pointerType === 'mouse') setHoverY(Math.max(0, Math.min(trackH, e.clientY - rect.top)))
  }
  const current = groupAtY(layout, scrollTop - contentTop)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const g = layout.groups
    let target: number | null = null
    if (e.key === 'ArrowDown') target = g[Math.min(g.length - 1, current + 1)].start
    else if (e.key === 'ArrowUp') target = g[Math.max(0, current - (scrollTop - contentTop > g[current].start + 4 ? 0 : 1))].start
    else if (e.key === 'PageDown' || e.key === 'PageUp') {
      const year = g[current].year
      const found = e.key === 'PageDown' ? g.find((x) => x.year < year) : [...g].reverse().find((x) => x.year > year)
      target = found ? g.find((x) => x.year === found.year)!.start : null
    } else if (e.key === 'Home') target = 0
    else if (e.key === 'End') target = layout.total
    if (target === null) return
    e.preventDefault()
    onScrollTo(Math.min(maxScroll, contentTop + target))
  }

  return (
    <div
      className={cn(
        'absolute right-0 z-20 select-none',
        compact ? 'w-10' : 'w-14',
        compact && !active && 'pointer-events-none',
      )}
      style={{ top: TOP, height: trackH }}
    >
      <div
        ref={trackRef}
        role="scrollbar"
        aria-orientation="vertical"
        aria-label="Timeline"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={maxScroll ? Math.round((scrollTop / maxScroll) * 100) : 0}
        aria-valuetext={labelAt(scrollTop)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDrag(false)}
        onPointerCancel={() => setDrag(false)}
        onPointerLeave={() => setHoverY(null)}
        onKeyDown={onKeyDown}
        className="group/scrub absolute inset-0 cursor-ns-resize touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        {!compact &&
          years.map((y) => (
            <span
              key={y.year}
              className={cn(
                'pointer-events-none absolute right-[27px] -translate-y-1/2 text-[11px] font-semibold tabular-nums transition-colors',
                layout.groups[current]?.year === y.year
                  ? 'text-white'
                  : 'text-white/38 group-hover/scrub:text-white/60',
              )}
              style={{ top: y.y }}
            >
              {y.year}
            </span>
          ))}
        {compact && active && (
          <div className="pointer-events-none absolute inset-y-0 right-1.5 w-[3px] rounded-full bg-white/15" />
        )}
        <motion.div
          className={cn(
            'pointer-events-none absolute right-1 -translate-y-1/2',
            compact
              ? 'flex h-9 w-6 items-center justify-center rounded-full bg-white/90 shadow-lg'
              : 'h-[3px] w-5 rounded-full bg-white',
          )}
          style={{ top: thumbY }}
          animate={{ opacity: compact ? (active ? 1 : 0) : active ? 1 : 0.55, scale: drag ? 1.08 : 1 }}
          transition={{ duration: 0.18 }}
        >
          {compact && <span className="h-3 w-[2px] rounded-full bg-black/40 shadow-[4px_0_0_rgb(0_0_0/0.4)]" />}
        </motion.div>
        <AnimatePresence>
          {(drag || hoverY !== null) && (
            <motion.div
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.14 }}
              className="glass-dark pointer-events-none absolute right-full mr-1.5 -translate-y-1/2 rounded-full px-3 py-1 text-[12.5px] font-semibold whitespace-nowrap text-white tabular-nums"
              style={{ top: bubbleY }}
            >
              {labelAt(bubbleTop)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
