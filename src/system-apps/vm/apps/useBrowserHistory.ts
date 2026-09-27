import { useCallback, useEffect, useRef, useState } from 'react'
import type { WebPage } from './webData'

/** Back/forward history for the guest browsers, plus a short fake loading bar. */
export function useBrowserHistory(initial: WebPage = { kind: 'home' }) {
  const [state, setState] = useState({ stack: [initial], idx: 0 })
  const [loading, setLoading] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const kick = useCallback(() => {
    setLoading((n) => n + 1)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setLoading(0), 520)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  const go = useCallback(
    (page: WebPage) => {
      setState((s) => ({ stack: [...s.stack.slice(0, s.idx + 1), page], idx: s.idx + 1 }))
      kick()
    },
    [kick],
  )
  const back = useCallback(() => {
    setState((s) => ({ ...s, idx: Math.max(0, s.idx - 1) }))
    kick()
  }, [kick])
  const forward = useCallback(() => {
    setState((s) => ({ ...s, idx: Math.min(s.stack.length - 1, s.idx + 1) }))
    kick()
  }, [kick])

  return {
    page: state.stack[state.idx],
    /** Changes on every navigation; handy as a key. */
    navKey: `${state.idx}:${state.stack.length}`,
    canBack: state.idx > 0,
    canForward: state.idx < state.stack.length - 1,
    loading: loading > 0,
    loadKey: loading,
    go,
    back,
    forward,
    reload: kick,
  }
}
