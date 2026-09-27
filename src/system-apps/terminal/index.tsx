import { useCallback, useEffect, useRef, useState } from 'react'
import { useWindows } from '@/stores/windows'
import type { SheetProps } from '../registry'
import { KeyBar } from './KeyBar'
import { Screen } from './Screen'
import { TitleBar } from './TitleBar'
import { useLineEditor } from './useLineEditor'
import { useIdentity, useShell } from './useShell'

const FONT_KEY = 'plumos:terminal-font'
const SIZES = [11, 12, 13, 13.5, 14, 15, 16, 18]

const CSS = `
.term-cursor { animation: plumos-term-blink 1.1s steps(1, end) infinite; }
@keyframes plumos-term-blink { 50% { background-color: transparent; color: inherit; } }
@media (prefers-reduced-motion: reduce) { .term-cursor { animation: none; } }
`

function readFont(): number | null {
  try {
    const n = Number(localStorage.getItem(FONT_KEY))
    return SIZES.includes(n) ? n : null
  } catch {
    return null
  }
}

/** A web terminal onto this Plumos: a small shell with a virtual filesystem and app commands. */
export default function Terminal(_: SheetProps) {
  const identity = useIdentity()
  const close = useWindows((s) => s.close)
  const cols = useRef(80)
  const inputRef = useRef<HTMLInputElement>(null)
  const shell = useShell(identity, cols, close)
  const editor = useLineEditor(shell, inputRef)
  const [fontSize, setFontSize] = useState<number | null>(readFont)
  const { running, interrupt, sendKey, clear } = shell

  // Focus the prompt on open. Phones wait for a tap, so the keyboard doesn't jump up uninvited.
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus({ preventScroll: true })
  }, [])

  // While a command runs, Escape and Ctrl+C stop it (and Escape doesn't close the sheet).
  useEffect(() => {
    if (!running) return
    const onKey = (e: KeyboardEvent) => {
      const ctrlC = e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'c'
      if (e.key === 'Escape' || (ctrlC && !window.getSelection()?.toString())) {
        e.preventDefault()
        interrupt()
      } else if (sendKey(e)) e.preventDefault()
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [running, interrupt, sendKey])

  const resize = useCallback((dir: -1 | 1) => {
    setFontSize((current) => {
      const base = current ?? (window.innerWidth < 640 ? 12 : 13.5)
      const i = SIZES.indexOf(base)
      const next = SIZES[Math.max(0, Math.min(SIZES.length - 1, (i < 0 ? 3 : i) + dir))]
      try {
        localStorage.setItem(FONT_KEY, String(next))
      } catch {
        // Not saved; still applies for this session.
      }
      return next
    })
  }, [])

  const size = fontSize ?? 13.5

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#08070d]/55 font-mono text-[12px] sm:text-[13.5px]">
      <style>{CSS}</style>
      <TitleBar
        title={`${identity.user}@${identity.host}.local`}
        onClear={() => {
          clear()
          inputRef.current?.focus({ preventScroll: true })
        }}
        onSmaller={size > SIZES[0] || fontSize === null ? () => resize(-1) : undefined}
        onLarger={size < SIZES[SIZES.length - 1] ? () => resize(1) : undefined}
      />
      <Screen shell={shell} editor={editor} identity={identity} inputRef={inputRef} cols={cols} fontSize={fontSize} />
      <KeyBar onKey={editor.press} running={running} />
    </div>
  )
}
