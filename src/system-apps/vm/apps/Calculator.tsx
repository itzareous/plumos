import { useState } from 'react'
import { cn } from '@/lib/cn'

type Op = 'add' | 'sub' | 'mul' | 'div'
type Key = `${number}` | 'dot' | Op | 'eq' | 'clear' | 'sign' | 'pct'

interface CalcState {
  display: string
  acc: number | null
  op: Op | null
  fresh: boolean
  expr: string
}

const SYMBOL: Record<Op, string> = { add: '+', sub: '−', mul: '×', div: '÷' }
const initial: CalcState = { display: '0', acc: null, op: null, fresh: true, expr: '' }

function apply(a: number, b: number, op: Op) {
  if (op === 'add') return a + b
  if (op === 'sub') return a - b
  if (op === 'mul') return a * b
  return b === 0 ? NaN : a / b
}

const show = (n: number) => (Number.isFinite(n) ? String(parseFloat(n.toPrecision(12))) : 'Error')

function press(s: CalcState, key: Key): CalcState {
  if (/^\d$/.test(key)) {
    if (s.fresh || s.display === '0') return { ...s, display: key, fresh: false }
    if (s.display.replace(/\D/g, '').length >= 12) return s
    return { ...s, display: s.display + key }
  }
  const cur = parseFloat(s.display)
  switch (key) {
    case 'dot':
      if (s.fresh) return { ...s, display: '0.', fresh: false }
      return s.display.includes('.') ? s : { ...s, display: s.display + '.' }
    case 'clear':
      return initial
    case 'sign':
      return { ...s, display: show(-cur) }
    case 'pct':
      return { ...s, display: show(cur / 100) }
    case 'eq': {
      if (s.op === null || s.acc === null) return s
      const r = apply(s.acc, cur, s.op)
      return { display: show(r), acc: null, op: null, fresh: true, expr: `${show(s.acc)} ${SYMBOL[s.op]} ${show(cur)} =` }
    }
    default: {
      const op = key as Op
      const acc = s.op !== null && s.acc !== null && !s.fresh ? apply(s.acc, cur, s.op) : s.acc !== null && s.fresh ? s.acc : cur
      return { display: show(acc), acc, op, fresh: true, expr: `${show(acc)} ${SYMBOL[op]}` }
    }
  }
}

const ROWS: { key: Key; label: string; kind?: 'op' | 'fn' | 'eq'; wide?: boolean }[][] = [
  [
    { key: 'clear', label: 'C', kind: 'fn' },
    { key: 'sign', label: '±', kind: 'fn' },
    { key: 'pct', label: '%', kind: 'fn' },
    { key: 'div', label: '÷', kind: 'op' },
  ],
  [{ key: '7', label: '7' }, { key: '8', label: '8' }, { key: '9', label: '9' }, { key: 'mul', label: '×', kind: 'op' }],
  [{ key: '4', label: '4' }, { key: '5', label: '5' }, { key: '6', label: '6' }, { key: 'sub', label: '−', kind: 'op' }],
  [{ key: '1', label: '1' }, { key: '2', label: '2' }, { key: '3', label: '3' }, { key: 'add', label: '+', kind: 'op' }],
  [{ key: '0', label: '0', wide: true }, { key: 'dot', label: '.' }, { key: 'eq', label: '=', kind: 'eq' }],
]

/** A working four-function calculator. */
export function Calculator({ layout }: { layout: 'desk' | 'phone' }) {
  const [s, setS] = useState(initial)
  const phone = layout === 'phone'
  const onKey = (e: React.KeyboardEvent) => {
    const map: Record<string, Key> = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', Enter: 'eq', '=': 'eq', '.': 'dot', Escape: 'clear', '%': 'pct' }
    const k = /^\d$/.test(e.key) ? (e.key as Key) : map[e.key]
    if (k) {
      e.preventDefault()
      setS((x) => press(x, k))
    }
  }
  return (
    <div
      tabIndex={0}
      onKeyDown={onKey}
      className={cn('flex h-full flex-col outline-none', phone ? 'bg-black px-4 pb-4' : 'bg-[#202228] p-3')}
    >
      <div className={cn('flex flex-1 flex-col items-end justify-end px-2', phone ? 'pb-5' : 'pb-3')}>
        <div className="h-5 text-[13px] text-white/40 tabular-nums">{s.expr}</div>
        <div
          data-agent="calc.display"
          className={cn('max-w-full truncate font-light text-white tabular-nums', phone ? 'text-[64px] leading-none' : 'text-[40px] leading-tight')}
        >
          {s.display}
        </div>
      </div>
      <div className={cn('grid grid-cols-4', phone ? 'gap-3' : 'gap-1.5')}>
        {ROWS.flat().map((b) => (
          <button
            key={b.key}
            type="button"
            data-agent={`calc.${b.key}`}
            onClick={() => setS((x) => press(x, b.key))}
            className={cn(
              'flex items-center justify-center font-medium transition outline-none select-none active:brightness-125 focus-visible:ring-2 focus-visible:ring-white/50',
              phone ? 'h-[62px] rounded-full text-[26px]' : 'h-11 rounded-md text-[17px]',
              b.wide && 'col-span-2',
              b.kind === 'op' || b.kind === 'eq'
                ? cn('bg-orange-400 text-white hover:bg-orange-300', s.op === b.key && s.fresh && 'bg-white text-orange-500')
                : b.kind === 'fn'
                  ? 'bg-white/25 text-white hover:bg-white/30'
                  : phone
                    ? 'bg-white/[0.14] text-white hover:bg-white/20'
                    : 'bg-white/[0.08] text-white hover:bg-white/[0.13]',
            )}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  )
}
