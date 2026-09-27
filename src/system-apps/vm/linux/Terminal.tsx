import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useAgent } from '../agent/store'
import type { VmSpec } from '../types'
import { complete, promptPath, runCommand } from './shell'

interface Line {
  kind: 'in' | 'out'
  text: string
  cwd?: string
}

function Prompt({ cwd }: { cwd: string }) {
  return (
    <span className="whitespace-pre">
      <span className="font-semibold text-[#8ae68a]">guest@plumos-vm</span>
      <span className="text-white/80">:</span>
      <span className="font-semibold text-[#7fb4ff]">{promptPath(cwd)}</span>
      <span className="text-white/80">$ </span>
    </span>
  )
}

/** Colours directories blue in `ls` output. */
function Out({ text }: { text: string }) {
  if (!/\/(\s|$)/.test(text)) return <>{text || ' '}</>
  return (
    <>
      {text.split(/(\S+\/)(?=\s|$)/).map((part, i) =>
        part.endsWith('/') ? (
          <span key={i} className="font-semibold text-[#7fb4ff]">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

/** A terminal window running a small read-only shell. */
export function Terminal({ spec, bootAt, onExit }: { spec: VmSpec; bootAt: number; onExit: () => void }) {
  const [lines, setLines] = useState<Line[]>([
    { kind: 'out', text: 'Welcome to your Plumos virtual machine.' },
    { kind: 'out', text: "Type 'help' to see what you can do." },
    { kind: 'out', text: '' },
  ])
  const [cwd, setCwd] = useState('')
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [hIndex, setHIndex] = useState<number | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, input])

  // Ready to type when you open it (but don't steal focus while the agent drives).
  useEffect(() => {
    if (useAgent.getState().status !== 'running') field.current?.focus({ preventScroll: true })
  }, [])

  const submit = () => {
    const cmd = input.trim()
    const nextHistory = cmd ? [...history, cmd] : history
    const r = runCommand(cmd, cwd, spec, bootAt, nextHistory)
    setHistory(nextHistory)
    setHIndex(null)
    setInput('')
    if (r.clear) return setLines([])
    setLines((ls) => [...ls, { kind: 'in', text: input, cwd }, ...r.out.map((t) => ({ kind: 'out' as const, text: t }))])
    setCwd(r.cwd)
    if (r.exit) setTimeout(onExit, 300)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault()
      const i = hIndex === null ? history.length - 1 : Math.max(0, hIndex - 1)
      setHIndex(i)
      setInput(history[i])
    } else if (e.key === 'ArrowDown' && hIndex !== null) {
      e.preventDefault()
      const i = hIndex + 1
      setHIndex(i >= history.length ? null : i)
      setInput(i >= history.length ? '' : history[i])
    } else if (e.key === 'Tab') {
      e.preventDefault()
      setInput(complete(input, cwd))
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      setLines([])
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault()
      setLines((ls) => [...ls, { kind: 'in', text: input + '^C', cwd }])
      setInput('')
    }
  }

  return (
    <div
      ref={scroller}
      data-agent="term.scroll"
      className="scrollbar-thin h-full overflow-y-auto bg-[#17171c] px-3 py-2 font-mono text-[12.5px] leading-[19px] text-[#d6d6de] selection:bg-white/25"
      onClick={(e) => e.nativeEvent.isTrusted && !window.getSelection()?.toString() && field.current?.focus({ preventScroll: true })}
    >
      {lines.map((l, i) => (
        <div key={i} className="break-all whitespace-pre-wrap">
          {l.kind === 'in' ? (
            <>
              <Prompt cwd={l.cwd ?? ''} />
              {l.text}
            </>
          ) : (
            <Out text={l.text} />
          )}
        </div>
      ))}
      <div className="flex">
        <Prompt cwd={cwd} />
        <input
          ref={field}
          data-agent="term.input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          aria-label="Terminal input"
          className="min-w-0 flex-1 bg-transparent font-mono text-[12.5px] text-[#d6d6de] caret-[#8ae68a] outline-none"
        />
      </div>
    </div>
  )
}
