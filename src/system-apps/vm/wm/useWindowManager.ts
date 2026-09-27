import { useCallback, useMemo, useRef, useState } from 'react'
import type { GuestApp } from '../apps/glyphs'

export interface AppDef {
  w: number
  h: number
}

export interface Win {
  id: string
  app: GuestApp
  x: number
  y: number
  w: number
  h: number
  z: number
  min: boolean
  max: boolean
  data?: Record<string, string>
}

/** The part of the guest screen windows may use. */
export interface WorkArea {
  /** Full screen size. */
  w: number
  h: number
  /** Space taken by panels along each edge. */
  top: number
  bottom: number
  left: number
}

export function maximizedRect(area: WorkArea) {
  return { x: area.left, y: area.top, w: area.w - area.left, h: area.h - area.top - area.bottom }
}

/** A tiny window manager: one instance per app, z-order, minimise, maximise and drag. */
export function useWindowManager(defs: Partial<Record<GuestApp, AppDef>>, area: WorkArea) {
  const [wins, setWins] = useState<Win[]>([])
  const zTop = useRef(1)
  const opened = useRef(0)

  const open = useCallback(
    (app: GuestApp, data?: Record<string, string>) =>
      setWins((ws) => {
        const existing = ws.find((w) => w.app === app)
        const z = ++zTop.current
        if (existing) {
          return ws.map((w) => (w.id === existing.id ? { ...w, min: false, z, data: data ?? w.data } : w))
        }
        const def = defs[app] ?? { w: 560, h: 400 }
        const n = opened.current++ % 5
        const usableW = area.w - area.left
        const usableH = area.h - area.top - area.bottom
        const w = Math.min(def.w, usableW - 40)
        const h = Math.min(def.h, usableH - 30)
        const x = area.left + Math.max(12, Math.round((usableW - w) / 2 - 80 + n * 34))
        const y = area.top + Math.max(10, Math.round((usableH - h) / 2 - 40 + n * 26))
        return [...ws, { id: `${app}-${Date.now().toString(36)}`, app, x, y, w, h, z, min: false, max: false, data }]
      }),
    [defs, area],
  )

  const update = useCallback((id: string, patch: (w: Win) => Partial<Win>) => {
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch(w) } : w)))
  }, [])

  const focus = useCallback(
    (id: string) =>
      setWins((ws) => {
        const target = ws.find((w) => w.id === id)
        if (!target) return ws
        const top = Math.max(...ws.map((w) => w.z))
        if (target.z === top && !target.min) return ws
        const z = ++zTop.current
        return ws.map((w) => (w.id === id ? { ...w, z, min: false } : w))
      }),
    [],
  )

  const close = useCallback((id: string) => setWins((ws) => ws.filter((w) => w.id !== id)), [])
  const closeApp = useCallback((app: GuestApp) => setWins((ws) => ws.filter((w) => w.app !== app)), [])
  const minimize = useCallback((id: string) => update(id, () => ({ min: true })), [update])
  const toggleMax = useCallback((id: string) => update(id, (w) => ({ max: !w.max })), [update])
  const move = useCallback((id: string, x: number, y: number) => update(id, () => ({ x, y })), [update])
  const reset = useCallback(() => setWins([]), [])

  const active = useMemo(() => {
    let best: Win | null = null
    for (const w of wins) if (!w.min && (!best || w.z > best.z)) best = w
    return best?.id ?? null
  }, [wins])

  /** Taskbar click: open, focus, or minimise when it's already in front. */
  const toggle = useCallback(
    (app: GuestApp) => {
      const w = wins.find((x) => x.app === app)
      if (!w) open(app)
      else if (w.id === active) minimize(w.id)
      else focus(w.id)
    },
    [wins, active, open, minimize, focus],
  )

  return { wins, active, open, focus, close, closeApp, minimize, toggleMax, move, reset, toggle }
}

export type WindowManager = ReturnType<typeof useWindowManager>
