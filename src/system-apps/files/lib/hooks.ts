import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { Loc } from './tree'

/** Back/forward history for the file browser. */
export function useHistoryNav(initial: Loc) {
  const [state, setState] = useState({ stack: [initial], index: 0 })
  const loc = state.stack[state.index]

  const go = useCallback(
    (next: Loc) =>
      setState((s) =>
        s.stack[s.index] === next ? s : { stack: [...s.stack.slice(0, s.index + 1), next].slice(-100), index: Math.min(s.index + 1, 99) },
      ),
    [],
  )
  const replace = useCallback(
    (next: Loc) =>
      setState((s) =>
        s.stack[s.index] === next ? s : { stack: s.stack.map((l, i) => (i === s.index ? next : l)), index: s.index },
      ),
    [],
  )
  const back = useCallback(() => setState((s) => (s.index > 0 ? { ...s, index: s.index - 1 } : s)), [])
  const forward = useCallback(() => setState((s) => (s.index < s.stack.length - 1 ? { ...s, index: s.index + 1 } : s)), [])

  const canBack = state.index > 0
  const canForward = state.index < state.stack.length - 1
  return useMemo(
    () => ({ loc, go, replace, back, forward, canBack, canForward }),
    [loc, go, replace, back, forward, canBack, canForward],
  )
}

interface Modifiers {
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
}

/** Finder-style selection: click, ⌘/Ctrl-click to toggle, Shift-click for a range. */
export function useSelection(order: string[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [focusId, setFocusId] = useState<string | null>(null)
  const anchor = useRef<string | null>(null)
  const orderRef = useRef(order)
  useEffect(() => {
    orderRef.current = order
  })

  // Forget items that are no longer on screen.
  const orderKey = order.join('|')
  useEffect(() => {
    const valid = new Set(orderRef.current)
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => valid.has(id)))
      return next.size === prev.size ? prev : next
    })
    setFocusId((f) => (f && valid.has(f) ? f : null))
  }, [orderKey])

  const range = (from: string, to: string) => {
    const list = orderRef.current
    const a = list.indexOf(from)
    const b = list.indexOf(to)
    if (a < 0 || b < 0) return [to]
    return list.slice(Math.min(a, b), Math.max(a, b) + 1)
  }

  const click = useCallback((id: string, e: Modifiers = {}) => {
    if (e.shiftKey && anchor.current) {
      const ids = range(anchor.current, id)
      setSelected((prev) => (e.metaKey || e.ctrlKey ? new Set([...prev, ...ids]) : new Set(ids)))
    } else if (e.metaKey || e.ctrlKey) {
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
      anchor.current = id
    } else {
      setSelected(new Set([id]))
      anchor.current = id
    }
    setFocusId(id)
  }, [])

  const selectOnly = useCallback((ids: string[]) => {
    setSelected(new Set(ids))
    anchor.current = ids[0] ?? null
    setFocusId(ids[ids.length - 1] ?? null)
  }, [])

  const selectAll = useCallback(() => {
    setSelected(new Set(orderRef.current))
    anchor.current = orderRef.current[0] ?? null
  }, [])

  const clear = useCallback(() => {
    setSelected((prev) => (prev.size ? new Set() : prev))
    anchor.current = null
  }, [])

  /** Arrow-key movement; Shift extends from the anchor. Returns the newly focused id. */
  const moveBy = useCallback(
    (delta: number, extend: boolean): string | null => {
      const list = orderRef.current
      if (!list.length) return null
      const current = focusId ?? anchor.current
      let index = current ? list.indexOf(current) : -1
      if (index < 0) index = delta > 0 ? -1 : list.length
      const next = list[Math.max(0, Math.min(list.length - 1, index + delta))]
      if (extend && anchor.current) setSelected(new Set(range(anchor.current, next)))
      else {
        setSelected(new Set([next]))
        anchor.current = next
      }
      setFocusId(next)
      return next
    },
    [focusId],
  )

  const ids = useMemo(() => order.filter((id) => selected.has(id)), [order, selected])

  return { selected, ids, focusId, click, selectOnly, selectAll, clear, moveBy }
}

export type Selection = ReturnType<typeof useSelection>

/** Tracks a CSS media query, e.g. `useMediaQuery('(max-width: 767px)')`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', notify)
      return () => mql.removeEventListener('change', notify)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

/** Phones get the compact layout (the sidebar turns into a strip of chips). */
export const usePhone = () => useMediaQuery('(max-width: 767px)')
