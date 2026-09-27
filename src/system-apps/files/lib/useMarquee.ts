import { useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'

export interface MarqueeRect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Rubber-band selection: drag on empty space to select everything the box
 * touches. `begin` is called when a drag starts and returns the function that
 * receives the ids under the box as it changes (so callers can keep the
 * selection they started with when ⌘ or Shift is held).
 */
export function useMarquee(ref: RefObject<HTMLDivElement | null>, begin: (additive: boolean) => (ids: string[]) => void) {
  const [rect, setRect] = useState<MarqueeRect | null>(null)
  const suppressClick = useRef(false)

  const onPointerDown = (e: ReactPointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse' || e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-file-id], button, input, a, [role="menu"]')) return
    const box = el.getBoundingClientRect()
    // Ignore the scrollbar.
    if (e.clientX > box.left + el.clientWidth) return
    const start = { x: e.clientX - box.left + el.scrollLeft, y: e.clientY - box.top + el.scrollTop }
    let update: ((ids: string[]) => void) | null = null
    let last = { x: e.clientX, y: e.clientY }
    let frame = 0

    const compute = () => {
      const b = el.getBoundingClientRect()
      const cur = { x: last.x - b.left + el.scrollLeft, y: last.y - b.top + el.scrollTop }
      if (!update && Math.hypot(cur.x - start.x, cur.y - start.y) < 5) return
      update ??= begin(e.shiftKey || e.metaKey || e.ctrlKey)
      const r = { x: Math.min(start.x, cur.x), y: Math.min(start.y, cur.y), w: Math.abs(cur.x - start.x), h: Math.abs(cur.y - start.y) }
      setRect(r)
      const left = r.x + b.left - el.scrollLeft
      const top = r.y + b.top - el.scrollTop
      const ids: string[] = []
      const hits = (ir: DOMRect) => ir.right > left && ir.left < left + r.w && ir.bottom > top && ir.top < top + r.h
      el.querySelectorAll<HTMLElement>('[data-file-id]').forEach((item) => {
        // Items can mark the parts that count (icon and name), like Finder.
        const parts = item.querySelectorAll<HTMLElement>('[data-hit]')
        const touched = parts.length ? Array.from(parts).some((part) => hits(part.getBoundingClientRect())) : hits(item.getBoundingClientRect())
        if (touched) ids.push(item.dataset.fileId!)
      })
      update(ids)
    }

    // Keep scrolling while the pointer is held near the top or bottom edge.
    const tick = () => {
      const b = el.getBoundingClientRect()
      const edge = 48
      let dy = 0
      if (last.y > b.bottom - edge) dy = Math.min(18, (last.y - (b.bottom - edge)) / 2)
      else if (last.y < b.top + edge) dy = -Math.min(18, (b.top + edge - last.y) / 2)
      if (dy && update) {
        el.scrollTop += dy
        compute()
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    const move = (ev: PointerEvent) => {
      last = { x: ev.clientX, y: ev.clientY }
      compute()
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      cancelAnimationFrame(frame)
      if (update) {
        // The click that follows the drag shouldn't clear what we just selected.
        suppressClick.current = true
        setTimeout(() => (suppressClick.current = false), 0)
      }
      setRect(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  return { rect, onPointerDown, suppressClick }
}
