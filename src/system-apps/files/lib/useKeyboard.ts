import { useEffect, useRef } from 'react'
import { overlayOpen } from '../components/Modal'
import { isTypingTarget } from './io'

export interface KeyActions {
  selectAll: () => void
  focusSearch: () => void
  newFolder: () => void
  remove: () => void
  rename: () => void
  open: () => void
  preview: () => void
  up: () => void
  back: () => void
  forward: () => void
  /** Arrow keys; returns the id that received focus. */
  move: (dx: number, dy: number, extend: boolean) => void
  enabled: boolean
}

/** Finder-style shortcuts for the file browser. */
export function useKeyboard(actions: KeyActions) {
  const ref = useRef(actions)
  useEffect(() => {
    ref.current = actions
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = ref.current
      if (e.defaultPrevented || !a.enabled || overlayOpen() || isTypingTarget(e.target)) return
      if (document.querySelector('[role="menu"]')) return
      const target = e.target as HTMLElement | null
      // Enter and Space belong to whatever button has focus.
      const onControl = Boolean(target?.closest?.('button, a, [role="menuitem"], video, audio')) && !target?.closest?.('[data-file-id]')
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key

      const run = (fn: () => void) => {
        e.preventDefault()
        fn()
      }

      if (mod && key === 'a') return run(a.selectAll)
      if (mod && key === 'f') return run(a.focusSearch)
      if (mod && e.shiftKey && key === 'n') return run(a.newFolder)
      if (mod && (key === '[' || key === 'ArrowLeft') && !e.shiftKey) return run(a.back)
      if (mod && (key === ']' || key === 'ArrowRight') && !e.shiftKey) return run(a.forward)
      if ((mod || e.altKey) && key === 'ArrowUp') return run(a.up)
      if (mod && key === 'ArrowDown') return run(a.open)
      if (key === 'Delete' || key === 'Backspace') return run(a.remove)
      if (key === 'F2') return run(a.rename)
      if (onControl) return
      if (key === 'Enter') return run(a.open)
      if (key === ' ') return run(a.preview)
      if (key === 'ArrowLeft') return run(() => a.move(-1, 0, e.shiftKey))
      if (key === 'ArrowRight') return run(() => a.move(1, 0, e.shiftKey))
      if (key === 'ArrowUp') return run(() => a.move(0, -1, e.shiftKey))
      if (key === 'ArrowDown') return run(() => a.move(0, 1, e.shiftKey))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
