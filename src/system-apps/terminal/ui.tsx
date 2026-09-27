import { createContext, Fragment, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Width of the terminal in characters, measured by the view. */
export const TermCols = createContext(80)

/** The terminal's colour palette, as text classes. */
export const tone = {
  fg: 'text-[#e8e6f0]',
  dim: 'text-white/45',
  muted: 'text-white/65',
  green: 'text-[#6ee7a0]',
  blue: 'text-[#7cb8ff]',
  cyan: 'text-[#6fe0e6]',
  yellow: 'text-[#f5d06f]',
  red: 'text-[#ff7a8a]',
  plum: 'text-[#c9a4ff]',
  orange: 'text-[#f7a26b]',
} as const

export type Tone = keyof typeof tone

/** A colored run of text. */
export function C({ t, bold, children }: { t: Tone; bold?: boolean; children: ReactNode }) {
  return <span className={cn(tone[t], bold && 'font-semibold')}>{children}</span>
}

/** A plain output line that wraps like a terminal. */
export function Line({ children, className }: { children?: ReactNode; className?: string }) {
  return <div className={cn('min-h-[1.5em] break-words whitespace-pre-wrap', className)}>{children}</div>
}

/** A block that must not wrap (tables, art); scrolls sideways if the screen is narrow. */
export function Pre({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('scrollbar-none overflow-x-auto whitespace-pre', className)}>{children}</div>
}

export function ErrorLine({ children }: { children: ReactNode }) {
  return <Line className={tone.red}>{children}</Line>
}

const URL_RE = /(https?:\/\/[^\s'"<>)]+)/g

/** Turns URLs inside plain text into links that open in a new tab. */
export function Linkify({ text }: { text: string }) {
  const parts = text.split(URL_RE)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7cb8ff] underline decoration-[#7cb8ff]/40 underline-offset-2 hover:decoration-[#7cb8ff]"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

/**
 * A simple aligned table. Columns listed in `narrow` are hidden on phones;
 * `wrapLast` lets the final column wrap instead of scrolling sideways.
 */
export function Table({
  head,
  rows,
  align = [],
  narrow = [],
  gap = 3,
  wrapLast = false,
}: {
  head?: ReactNode[]
  rows: ReactNode[][]
  align?: ('left' | 'right')[]
  narrow?: number[]
  gap?: number
  wrapLast?: boolean
}) {
  const cols = head?.length ?? rows[0]?.length ?? 0
  const last = cols - 1
  const cell = (i: number, header = false) =>
    cn(
      align[i] === 'right' ? 'text-right' : 'text-left',
      narrow.includes(i) && 'max-sm:hidden',
      header && 'font-semibold text-white/55',
      wrapLast && i === last && 'min-w-0 break-words whitespace-pre-wrap',
    )
  const vars = wrapLast
    ? { '--cols': cols - 1, '--cols-sm': cols - 1 - narrow.length }
    : { '--cols': cols, '--cols-sm': cols - narrow.length }
  return (
    <Pre>
      <div
        className={cn(
          wrapLast
            ? 'grid [grid-template-columns:repeat(var(--cols),auto)_minmax(0,1fr)] max-sm:[grid-template-columns:repeat(var(--cols-sm),auto)_minmax(0,1fr)]'
            : 'inline-grid [grid-template-columns:repeat(var(--cols),auto)] max-sm:[grid-template-columns:repeat(var(--cols-sm),auto)]',
        )}
        style={{ ...vars, columnGap: `${gap}ch` } as CSSProperties}
        role="table"
      >
        {head?.map((h, i) => (
          <div key={`h${i}`} className={cell(i, true)} role="columnheader">
            {h}
          </div>
        ))}
        {rows.map((row, r) =>
          row.map((value, i) => (
            <div key={`${r}:${i}`} className={cell(i)} role="cell">
              {value}
            </div>
          )),
        )}
      </div>
    </Pre>
  )
}

/** `ls`-style columns that reflow with the terminal width. */
export function Columns({ items }: { items: { key: string; label: ReactNode; width: number }[] }) {
  const width = Math.max(4, ...items.map((i) => i.width))
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill, ${width}ch)`, columnGap: '2ch' }}>
      {items.map((i) => (
        <span key={i.key} className="truncate">
          {i.label}
        </span>
      ))}
    </div>
  )
}

/** A text progress bar: `[########........]`. */
export function bar(fraction: number, width: number, fill = '#', empty = '.') {
  const n = Math.round(Math.max(0, Math.min(1, fraction)) * width)
  return fill.repeat(n) + empty.repeat(width - n)
}
