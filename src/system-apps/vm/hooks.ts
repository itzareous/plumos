import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type RefObject } from 'react'
import type { DeskBridge } from './types'

/** The current time, updated every `ms` (aligned to the second). */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      setNow(new Date())
      timer = setTimeout(tick, ms - (Date.now() % Math.min(ms, 1000)))
    }
    timer = setTimeout(tick, ms - (Date.now() % Math.min(ms, 1000)))
    return () => clearTimeout(timer)
  }, [ms])
  return now
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Content-box size of an element, kept up to date with a ResizeObserver. */
export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

/** Registers a window keydown listener in the capture phase (runs before the sheet's Escape handler). */
export function useCaptureKey(active: boolean, handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    if (!active) return
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [active, handler])
}

export const timeLabel = (d: Date, seconds = false) =>
  d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}) })

export const dateLabel = (d: Date, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric', year: 'numeric' }) =>
  d.toLocaleDateString(undefined, opts)

/** Lets the viewer (and the agent) reset the guest desktop. */
export function useBridge(bridge: RefObject<DeskBridge | null>, reset: () => void) {
  useEffect(() => {
    const handle = { reset }
    bridge.current = handle
    return () => {
      if (bridge.current === handle) bridge.current = null
    }
  }, [bridge, reset])
}
