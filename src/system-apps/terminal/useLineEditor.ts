import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import type { useShell } from './useShell'

type Shell = ReturnType<typeof useShell>

/** Keys the on-screen key bar can send on phones. */
export type SoftKey = 'Tab' | 'Up' | 'Down' | 'Left' | 'Right' | 'CtrlC' | 'CtrlL' | 'Enter'

/**
 * The prompt's line editor: the text, caret, history browsing, Tab
 * completion and the readline shortcuts people's fingers expect.
 */
export function useLineEditor(shell: Shell, inputRef: RefObject<HTMLInputElement | null>) {
  const [value, setValue] = useState('')
  const [caret, setCaret] = useState(0)
  const historyIndex = useRef<number | null>(null)
  const draft = useRef('')
  const pendingCaret = useRef<number | null>(null)
  const listedFor = useRef<string | null>(null)

  // Apply caret moves after React has updated the input's value.
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el || pendingCaret.current === null) return
    el.setSelectionRange(pendingCaret.current, pendingCaret.current)
    pendingCaret.current = null
  })

  const set = useCallback((next: string, at = next.length) => {
    setValue(next)
    setCaret(at)
    pendingCaret.current = at
  }, [])

  const submit = useCallback(async () => {
    const line = value
    historyIndex.current = null
    draft.current = ''
    set('')
    await shell.run(line)
  }, [set, shell, value])

  const browse = useCallback(
    (dir: -1 | 1) => {
      const list = shell.history
      if (!list.length) return
      let i = historyIndex.current
      if (dir === -1) {
        if (i === null) {
          draft.current = value
          i = list.length - 1
        } else i = Math.max(0, i - 1)
      } else {
        if (i === null) return
        i++
        if (i >= list.length) {
          historyIndex.current = null
          set(draft.current)
          return
        }
      }
      historyIndex.current = i
      set(list[i])
    },
    [set, shell.history, value],
  )

  const tab = useCallback(() => {
    const result = shell.completeInput(value, caret)
    if (!result) return
    if (!result.list) return set(result.value, result.caret)
    // Ambiguous: list the choices once; pressing Tab again on the same text doesn't repeat them.
    const key = `${caret}:${value}`
    if (listedFor.current === key) return
    listedFor.current = key
    shell.showCompletions(value, result.list)
  }, [caret, set, shell, value])

  const cancel = useCallback(() => {
    shell.cancelLine(value)
    historyIndex.current = null
    set('')
  }, [set, shell, value])

  /** The same actions, for the phone key bar. */
  const press = useCallback(
    (key: SoftKey) => {
      if (shell.running) {
        if (key === 'CtrlC') shell.interrupt()
        return
      }
      if (key === 'Tab') tab()
      else if (key === 'Up') browse(-1)
      else if (key === 'Down') browse(1)
      else if (key === 'Left') set(value, Math.max(0, caret - 1))
      else if (key === 'Right') set(value, Math.min(value.length, caret + 1))
      else if (key === 'CtrlC') cancel()
      else if (key === 'CtrlL') shell.clear()
      else if (key === 'Enter') void submit()
    },
    [browse, cancel, caret, set, shell, submit, tab, value],
  )

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // Already handled by the window listener for a running command (Ctrl+C, Escape, q…).
      if (e.defaultPrevented) return
      if (shell.running) {
        // Keys for a running command are handled by the window listener; don't type into the prompt.
        if (!e.metaKey && !(e.ctrlKey && e.key.toLowerCase() !== 'c')) e.preventDefault()
        return
      }
      if (e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase()
        if (k === 'c') cancel()
        else if (k === 'l') shell.clear()
        else if (k === 'u') set(value.slice(caret), 0)
        else if (k === 'k') set(value.slice(0, caret), caret)
        else if (k === 'a') set(value, 0)
        else if (k === 'e') set(value, value.length)
        else if (k === 'w') {
          const start = value.slice(0, caret).replace(/\S+\s*$/, '').length
          set(value.slice(0, start) + value.slice(caret), start)
        } else if (k === 'd' && !value) void shell.run('exit')
        else return
        e.preventDefault()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        void submit()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        browse(-1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        browse(1)
      } else if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        tab()
      }
    },
    [browse, cancel, caret, set, shell, submit, tab, value],
  )

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setCaret(e.target.selectionStart ?? e.target.value.length)
    historyIndex.current = null
  }, [])

  const onSelect = useCallback(() => {
    const el = inputRef.current
    if (el) setCaret(el.selectionStart ?? el.value.length)
  }, [inputRef])

  /** Multi-line pastes run line by line, like a real terminal. */
  const onPaste = useCallback(
    async (e: ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData('text')
      if (!/\r?\n/.test(text) || shell.running) return
      e.preventDefault()
      const lines = (value.slice(0, caret) + text + value.slice(caret)).split(/\r?\n/)
      const last = lines.pop() ?? ''
      set('')
      for (const line of lines) await shell.run(line)
      set(last)
    },
    [caret, set, shell, value],
  )

  return { value, caret, onKeyDown, onChange, onSelect, onPaste, press }
}
