import { useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from 'react'
import { cn } from '@/lib/cn'
import { PromptLine } from './PromptLine'
import type { Identity } from './types'
import { TermCols, tone } from './ui'
import type { useLineEditor } from './useLineEditor'
import type { useShell } from './useShell'

type Shell = ReturnType<typeof useShell>
type Editor = ReturnType<typeof useLineEditor>

/**
 * Scrollback plus the live prompt. Stays pinned to the bottom as output
 * arrives unless you've scrolled up to read something.
 */
export function Screen({
  shell,
  editor,
  identity,
  inputRef,
  cols,
  fontSize,
}: {
  shell: Shell
  editor: Editor
  identity: Identity
  inputRef: RefObject<HTMLInputElement | null>
  cols: RefObject<number>
  fontSize: number | null
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const probe = useRef<HTMLSpanElement>(null)
  const stick = useRef(true)
  const [width, setWidth] = useState(80)
  const [focused, setFocused] = useState(false)

  useLayoutEffect(() => {
    const el = scroller.current
    const inner = content.current
    if (!el || !inner) return
    const measure = () => {
      if (stick.current) el.scrollTop = el.scrollHeight
      const charWidth = (probe.current?.getBoundingClientRect().width ?? 160) / 20
      const next = Math.max(24, Math.floor(inner.clientWidth / charWidth))
      cols.current = next
      setWidth(next)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(inner)
    observer.observe(el)
    measure()
    return () => observer.disconnect()
  }, [cols, fontSize])

  const onScroll = () => {
    const el = scroller.current
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }

  // Click anywhere to type, unless you were selecting text or clicked a link.
  const focusInput = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return
    if (window.getSelection()?.toString()) return
    inputRef.current?.focus({ preventScroll: true })
  }

  const pin = () => {
    stick.current = true
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }

  return (
    <TermCols.Provider value={width}>
      <div
        ref={scroller}
        onScroll={onScroll}
        onMouseUp={focusInput}
        onKeyDownCapture={pin}
        className={cn(
          'scrollbar-thin relative min-h-0 flex-1 cursor-text overscroll-contain px-4 pt-3 pb-3 sm:px-6 sm:pt-4 sm:pb-5',
          shell.screen ? 'overflow-hidden' : 'overflow-y-auto',
        )}
        style={fontSize ? { fontSize } : undefined}
      >
        <span ref={probe} className="pointer-events-none invisible absolute whitespace-pre" aria-hidden>
          {'M'.repeat(20)}
        </span>
        <div
          ref={content}
          className={cn('selectable leading-[1.5]', tone.fg, Boolean(shell.screen) && 'h-full')}
          role="log"
          aria-live={shell.screen ? 'off' : 'polite'}
          aria-label="Terminal output"
        >
          {shell.screen ? (
            <div className="h-full">{shell.screen}</div>
          ) : (
            shell.entries.map((entry) => <div key={entry.id}>{entry.node}</div>)
          )}
          <PromptLine
            identity={identity}
            cwd={shell.cwd}
            editor={editor}
            inputRef={inputRef}
            hidden={shell.running}
            focused={focused}
            onFocusChange={setFocused}
          />
        </div>
      </div>
    </TermCols.Provider>
  )
}
