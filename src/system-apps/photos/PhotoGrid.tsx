import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import type { Photo } from '@/lib/photos'
import { cn } from '@/lib/cn'
import { Tile } from './Tile'
import { GroupHeader, StickyHeader } from './GroupHeader'
import { YearScrubber } from './YearScrubber'
import { ScrollRootContext } from './scrollRoot'
import { HEADER_H, computeLayout, groupAtY, tilePosition, verticalNeighbour, type Group, type Grouping } from './layout'

export interface GridHandle {
  /** Screen rect of a photo's tile, scrolling it into view first if needed. */
  rectOf: (id: string) => DOMRect | null
  scrollToTop: () => void
}

export interface PhotoGridProps {
  items: Photo[]
  grouping: Grouping
  density: number
  selecting: boolean
  selected: ReadonlySet<string>
  hiddenId: string | null
  /** Scrolls with the grid, above the photos. */
  header?: ReactNode
  empty?: ReactNode
  badge?: (p: Photo) => ReactNode
  showFavorite?: boolean
  /** Remembers the scroll position per view. */
  scrollKey: string
  onOpen: (photo: Photo, rect: DOMRect, list: Photo[]) => void
  onSelect: (photo: Photo, index: number, opts: { shift: boolean }) => void
  onSelectMany: (ids: string[], select: boolean) => void
  onMenu: (photo: Photo, e: MouseEvent<HTMLElement>) => void
  onZoom: (delta: 1 | -1) => void
}

const scrollMemory = new Map<string, number>()
const OVERSCAN = 600

export const PhotoGrid = forwardRef<GridHandle, PhotoGridProps>(function PhotoGrid(props, ref) {
  const { items, grouping, density, selecting, selected, hiddenId, header, empty, badge, showFavorite = true, scrollKey } = props
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [viewH, setViewH] = useState(0)
  const [contentTop, setContentTop] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [compact, setCompact] = useState(false)

  const layout = useMemo(() => computeLayout(items, grouping, width, density), [items, grouping, width, density])
  const latest = useRef({ props, layout, contentTop, viewH })
  latest.current = { props, layout, contentTop, viewH }

  // Measure the viewport, the content width and the header above the grid.
  useLayoutEffect(() => {
    const el = scrollEl
    const content = contentRef.current
    if (!el || !content) return
    const measure = () => {
      setWidth(content.clientWidth)
      setViewH(el.clientHeight)
      setContentTop(content.offsetTop)
      setCompact(el.clientWidth < 640)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    ro.observe(content)
    if (headerRef.current) ro.observe(headerRef.current)
    return () => ro.disconnect()
  }, [scrollEl])

  // Restore the scroll position once the layout is known.
  const restored = useRef(false)
  useLayoutEffect(() => {
    if (restored.current || !scrollEl || !width) return
    restored.current = true
    const top = scrollMemory.get(scrollKey) ?? 0
    scrollEl.scrollTop = top
    setScrollTop(scrollEl.scrollTop)
  }, [scrollEl, width, scrollKey])

  useEffect(() => {
    if (!scrollEl) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setScrollTop(scrollEl.scrollTop)
        scrollMemory.set(scrollKey, scrollEl.scrollTop)
      })
    }
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scrollEl.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [scrollEl, scrollKey])

  // Keep the photo at the top of the screen in place when the zoom level changes.
  const anchor = useRef<{ id: string; offset: number } | null>(null)
  const prevCols = useRef(layout.cols)
  useLayoutEffect(() => {
    if (!scrollEl) return
    if (prevCols.current !== layout.cols && anchor.current) {
      const i = items.findIndex((p) => p.id === anchor.current!.id)
      const pos = i >= 0 ? tilePosition(layout, i) : null
      if (pos) {
        scrollEl.scrollTop = Math.max(0, contentTop + pos.y - anchor.current.offset)
        setScrollTop(scrollEl.scrollTop)
      }
    }
    prevCols.current = layout.cols
  }, [layout, scrollEl, contentTop, items])
  useEffect(() => {
    const y = scrollTop - contentTop
    // At the very top there's nothing to hold in place: stay at the top.
    if (y <= 0 || !items.length) {
      anchor.current = null
      return
    }
    const g = layout.groups[groupAtY(layout, y)]
    if (!g) return
    const row = Math.max(0, Math.floor((y - g.top) / layout.stride))
    const i = Math.min(g.index0 + g.count - 1, g.index0 + row * layout.cols)
    const pos = tilePosition(layout, i)
    if (pos) anchor.current = { id: items[i].id, offset: contentTop + pos.y - scrollTop }
  }, [scrollTop, contentTop, layout, items])

  // Ctrl/⌘ + wheel (and trackpad pinch) zooms the grid.
  useEffect(() => {
    if (!scrollEl) return
    let acc = 0
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      acc += e.deltaY
      if (Math.abs(acc) > 60) {
        latest.current.props.onZoom(acc < 0 ? 1 : -1)
        acc = 0
      }
    }
    scrollEl.addEventListener('wheel', onWheel, { passive: false })
    return () => scrollEl.removeEventListener('wheel', onWheel)
  }, [scrollEl])

  // Two-finger pinch on touch screens steps through the zoom levels too.
  useEffect(() => {
    if (!scrollEl) return
    let base = 0
    const spread = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) base = spread(e.touches)
    }
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !base) return
      e.preventDefault()
      const ratio = spread(e.touches) / base
      if (ratio > 1.3 || ratio < 0.77) {
        latest.current.props.onZoom(ratio > 1 ? 1 : -1)
        base = spread(e.touches)
      }
    }
    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) base = 0
    }
    scrollEl.addEventListener('touchstart', onStart, { passive: true })
    scrollEl.addEventListener('touchmove', onMove, { passive: false })
    scrollEl.addEventListener('touchend', onEnd, { passive: true })
    scrollEl.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      scrollEl.removeEventListener('touchstart', onStart)
      scrollEl.removeEventListener('touchmove', onMove)
      scrollEl.removeEventListener('touchend', onEnd)
      scrollEl.removeEventListener('touchcancel', onEnd)
    }
  }, [scrollEl])

  // Tiles glide along for a moment after photos arrive or leave (not when zooming).
  const itemsChangedAt = useMemo(() => Date.now(), [items]) // eslint-disable-line react-hooks/exhaustive-deps
  const flowing = Date.now() - itemsChangedAt < 900

  const scrollTo = useCallback(
    (top: number) => {
      if (!scrollEl) return
      scrollEl.scrollTop = top
      setScrollTop(scrollEl.scrollTop)
    },
    [scrollEl],
  )

  const pendingFocus = useRef<number | null>(null)
  useEffect(() => {
    if (pendingFocus.current === null) return
    const btn = contentRef.current?.querySelector<HTMLButtonElement>(`button[data-index="${pendingFocus.current}"]`)
    if (btn) {
      btn.focus({ preventScroll: true })
      pendingFocus.current = null
    }
  })

  const bringIntoView = useCallback(
    (index: number, center = false) => {
      const { layout: l, contentTop: ct, viewH: vh } = latest.current
      const pos = tilePosition(l, index)
      if (!pos || !scrollEl) return null
      const top = ct + pos.y
      const stickyH = l.grouping === 'month' ? HEADER_H : 0
      let next = scrollEl.scrollTop
      if (center && (top < next + stickyH || top + l.size > next + vh - 100)) next = top - vh / 2 + l.size / 2
      else if (top < next + stickyH) next = top - stickyH - 6
      else if (top + l.size > next + vh - 100) next = top + l.size - vh + 106
      if (next !== scrollEl.scrollTop) scrollTo(Math.max(0, next))
      return pos
    },
    [scrollEl, scrollTo],
  )

  useImperativeHandle(
    ref,
    () => ({
      rectOf: (id) => {
        const { props: p, layout: l } = latest.current
        const i = p.items.findIndex((x) => x.id === id)
        if (i < 0 || !contentRef.current) return null
        const pos = bringIntoView(i, true)
        if (!pos) return null
        const box = contentRef.current.getBoundingClientRect()
        return new DOMRect(box.left + pos.x, box.top + pos.y, l.size, l.size)
      },
      scrollToTop: () => scrollEl?.scrollTo({ top: 0, behavior: 'smooth' }),
    }),
    [bringIntoView, scrollEl],
  )

  const onActivate = useCallback((index: number, e: MouseEvent<HTMLElement>) => {
    const p = latest.current.props
    const photo = p.items[index]
    if (!photo) return
    if (p.selecting || e.metaKey || e.ctrlKey || e.shiftKey) {
      p.onSelect(photo, index, { shift: e.shiftKey })
      return
    }
    const rect = (e.currentTarget.parentElement ?? e.currentTarget).getBoundingClientRect()
    p.onOpen(photo, rect, p.items)
  }, [])

  const onCheck = useCallback((index: number, e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    const p = latest.current.props
    if (p.items[index]) p.onSelect(p.items[index], index, { shift: e.shiftKey })
  }, [])

  const onMenu = useCallback((index: number, e: MouseEvent<HTMLElement>) => {
    const p = latest.current.props
    if (p.items[index]) p.onMenu(p.items[index], e)
  }, [])

  const onKey = useCallback(
    (index: number, e: KeyboardEvent<HTMLElement>) => {
      const { props: p, layout: l } = latest.current
      let next: number | null = null
      if (e.key === 'ArrowRight') next = Math.min(p.items.length - 1, index + 1)
      else if (e.key === 'ArrowLeft') next = Math.max(0, index - 1)
      else if (e.key === 'ArrowDown') next = verticalNeighbour(l, index, 1)
      else if (e.key === 'ArrowUp') next = verticalNeighbour(l, index, -1)
      else if (e.key === ' ' && p.selecting) {
        e.preventDefault()
        p.onSelect(p.items[index], index, { shift: e.shiftKey })
        return
      }
      if (next === null || next === index) return
      e.preventDefault()
      pendingFocus.current = next
      bringIntoView(next)
      if (e.shiftKey && p.selecting) p.onSelect(p.items[next], next, { shift: true })
      const btn = contentRef.current?.querySelector<HTMLButtonElement>(`button[data-index="${next}"]`)
      if (btn) {
        btn.focus({ preventScroll: true })
        pendingFocus.current = null
      }
    },
    [bringIntoView],
  )

  const onSelectGroup = useCallback((g: Group, select: boolean) => {
    const p = latest.current.props
    p.onSelectMany(
      p.items.slice(g.index0, g.index0 + g.count).map((x) => x.id),
      select,
    )
  }, [])

  const isAllSelected = useCallback(
    (g: Group) => {
      for (let i = g.index0; i < g.index0 + g.count; i++) if (!selected.has(items[i].id)) return false
      return true
    },
    [items, selected],
  )

  // Only tiles near the viewport are mounted.
  const y0 = scrollTop - contentTop - OVERSCAN
  const y1 = scrollTop - contentTop + (viewH || 900) + OVERSCAN
  const headers: ReactNode[] = []
  const tiles: ReactNode[] = []
  if (width > 0) {
    const radius = density >= 2 ? 4 : 0
    for (let gi = groupAtY(layout, Math.max(0, y0)); gi < layout.groups.length; gi++) {
      const g = layout.groups[gi]
      if (g.start > y1) break
      if (grouping === 'month' && g.start + HEADER_H >= y0) {
        headers.push(
          <GroupHeader key={g.key} group={g} selecting={selecting} allSelected={selecting && isAllSelected(g)} onSelectGroup={onSelectGroup} />,
        )
      }
      const r0 = Math.max(0, Math.floor((y0 - g.top) / layout.stride))
      const r1 = Math.min(g.rows - 1, Math.floor((y1 - g.top) / layout.stride))
      for (let row = r0; row <= r1; row++) {
        for (let col = 0; col < layout.cols; col++) {
          const i = g.index0 + row * layout.cols + col
          if (i >= g.index0 + g.count) break
          const photo = items[i]
          tiles.push(
            <Tile
              key={photo.id}
              photo={photo}
              index={i}
              x={col * layout.stride}
              y={g.top + row * layout.stride}
              size={layout.size}
              radius={radius}
              selecting={selecting}
              selected={selected.has(photo.id)}
              hidden={hiddenId === photo.id}
              flowing={flowing}
              showFavorite={showFavorite}
              badge={badge}
              onActivate={onActivate}
              onCheck={onCheck}
              onMenu={onMenu}
              onKey={onKey}
            />,
          )
        }
      }
    }
  }

  const maxScroll = scrollEl ? Math.max(0, contentTop + layout.total - viewH) : 0

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <div
        ref={setScrollEl}
        className="scrollbar-none absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain"
        role="region"
        aria-label="Photos"
      >
        <div ref={headerRef}>{header}</div>
        <ScrollRootContext.Provider value={scrollEl}>
          <div
            ref={contentRef}
            className={cn('relative mx-4 sm:mr-16 sm:ml-8', !items.length && 'hidden')}
            style={{ height: items.length ? layout.total : 0 }}
          >
            {headers}
            {tiles}
          </div>
        </ScrollRootContext.Provider>
        {!items.length && empty}
      </div>
      {items.length > 0 && (
        <>
          <StickyHeader
            layout={layout}
            y={scrollTop - contentTop}
            selecting={selecting}
            isAllSelected={isAllSelected}
            onSelectGroup={onSelectGroup}
            className="right-4 left-4 sm:right-16 sm:left-8"
          />
          <YearScrubber
            layout={layout}
            items={items}
            contentTop={contentTop}
            scrollTop={scrollTop}
            maxScroll={maxScroll}
            viewH={viewH}
            compact={compact}
            onScrollTo={scrollTo}
          />
        </>
      )}
    </div>
  )
})
