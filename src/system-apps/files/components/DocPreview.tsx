import type { ReactNode } from 'react'
import type { FileNode } from '@/stores/files'
import { baseName, extensionOf, KIND_COLORS } from '../lib/kinds'
import { formatFileDate, hashString } from '../lib/tree'

/**
 * Quick Look for demo documents that have no real contents: a believable
 * page, spreadsheet or slide drawn from the file's name, so browsing the demo
 * feels like browsing real files. Deterministic per file.
 */

function rng(seed: number) {
  let a = seed || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SLIDES = new Set(['ppt', 'pptx', 'key', 'odp'])

/** True when we can draw something better than an icon for this demo file. */
export function hasDocPreview(node: FileNode): boolean {
  if (node.uploaded) return false
  return ['document', 'pdf', 'spreadsheet', 'text', 'code'].includes(node.kind)
}

export function DocPreview({ node }: { node: FileNode }) {
  const ext = extensionOf(node.name)
  if (node.kind === 'spreadsheet') return <SheetPreview node={node} />
  if (SLIDES.has(ext)) return <SlidePreview node={node} />
  if (node.kind === 'code') return <CodePreview node={node} />
  return <PagePreview node={node} />
}

/** A letter-sized sheet, as big as the window allows. */
function Paper({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[10px] bg-[#fbfbfd] text-[#1d1d24] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.75)] ring-1 ring-black/10"
      style={{ aspectRatio: '1 / 1.294', width: 'min(100%, calc((100dvh - 150px) / 1.294), 680px)' }}
    >
      {children}
    </div>
  )
}

/** Grey bars standing in for lines of text. */
function Lines({ r, count, color = '#dcdde3' }: { r: () => number; count: number; color?: string }) {
  return (
    <div className="flex flex-col gap-[1.1cqh]">
      {Array.from({ length: count }, (_, i) => {
        const last = i === count - 1
        return (
          <span
            key={i}
            className="block h-[1.05cqh] rounded-full"
            style={{ width: `${last ? 35 + r() * 30 : 86 + r() * 14}%`, background: color }}
          />
        )
      })}
    </div>
  )
}

function PagePreview({ node }: { node: FileNode }) {
  const r = rng(hashString(node.name))
  const [accent] = KIND_COLORS[node.kind]
  const title = baseName(node.name)
  const figure = node.kind === 'pdf' && r() > 0.35
  const paragraphs = 3 + Math.floor(r() * 2)
  return (
    <Paper>
      <div className="flex h-full flex-col px-[9%] pt-[10%] [container-type:size]">
        <span className="mb-[3cqh] block h-[0.9cqh] w-[14%] rounded-full" style={{ background: accent }} />
        <p className="text-[3.4cqh] leading-[1.15] font-bold tracking-tight break-words">{title}</p>
        <p className="mt-[1.2cqh] text-[1.6cqh] text-black/45">{formatFileDate(node.modified, false)}</p>
        <div className="mt-[4cqh] flex flex-col gap-[3cqh]">
          {Array.from({ length: paragraphs }, (_, i) => (
            <div key={i} className="flex flex-col gap-[2cqh]">
              {figure && i === 1 && (
                <div
                  className="h-[16cqh] w-full rounded-[0.8cqh]"
                  style={{ background: `linear-gradient(135deg, ${accent}33, ${accent}88)` }}
                />
              )}
              <Lines r={r} count={3 + Math.floor(r() * 3)} />
            </div>
          ))}
        </div>
        <p className="mt-auto pb-[4cqh] text-center text-[1.3cqh] text-black/30 tabular-nums">1</p>
      </div>
    </Paper>
  )
}

function SlidePreview({ node }: { node: FileNode }) {
  const r = rng(hashString(node.name))
  const hue = Math.floor(r() * 360)
  return (
    <div
      className="relative overflow-hidden rounded-[14px] text-white shadow-[0_30px_80px_-20px_rgb(0_0_0/0.75)] ring-1 ring-white/10 [container-type:size]"
      style={{
        aspectRatio: '16 / 9',
        width: 'min(100%, 920px, 150vh)',
        background: `linear-gradient(135deg, hsl(${hue} 55% 22%), hsl(${hue + 40} 60% 38%))`,
      }}
    >
      <div
        className="absolute -right-[8%] -bottom-[30%] size-[70cqh] rounded-full opacity-40"
        style={{ background: `radial-gradient(circle, hsl(${hue + 80} 90% 70%), transparent 70%)` }}
      />
      <div className="relative flex h-full flex-col justify-center px-[8%]">
        <span className="text-[3.6cqh] font-semibold tracking-[0.2em] text-white/60 uppercase">
          {new Date(node.modified).getFullYear()}
        </span>
        <p className="mt-[2cqh] max-w-[80%] text-[10cqh] leading-[1.05] font-bold tracking-tight">{baseName(node.name)}</p>
        <div className="mt-[6cqh] flex gap-[3%]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="block h-[2.2cqh] rounded-full bg-white/25" style={{ width: `${14 + r() * 12}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

const COLUMNS = ['A', 'B', 'C', 'D', 'E']

/** Row labels that suit the file, so a budget looks like a budget. */
const ROW_SETS: [RegExp, string][] = [
  [
    /budget|expense|statement/i,
    'Rent, Groceries, Electricity, Internet, Transport, Insurance, Dining out, Kids, Gifts, Health, Subscriptions, Savings, Other',
  ],
  [/garden|plant/i, 'Tomatoes, Basil, Peppers, Lettuce, Strawberries, Carrots, Mint, Beans, Zucchini, Rosemary, Kale, Onions, Squash'],
  [/meal|recipe/i, 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday, Snacks, Lunches, Breakfast, Baking, Pantry, Extras'],
  [/reading|book|school/i, Array.from({ length: 13 }, (_, i) => `Week ${i + 1}`).join(', ')],
  [
    /tax|deduction/i,
    'Charity, Childcare, Home office, Medical, Education, Pension, Mortgage interest, Union dues, Tools, Travel, Software, Other',
  ],
]

function SheetPreview({ node }: { node: FileNode }) {
  const r = rng(hashString(node.name))
  const [accent] = KIND_COLORS.spreadsheet
  const labels = ['Item', 'Jan', 'Feb', 'Mar', 'Total']
  const names = ROW_SETS.find(([re]) => re.test(node.name))?.[1].split(', ')
  const rows = Array.from({ length: 13 }, (_, i) => {
    const values = [0, 1, 2].map(() => Math.round(40 + r() * 960))
    return { name: names?.[i] ?? `Line ${i + 1}`, values, total: values.reduce((a, b) => a + b, 0) }
  })
  const cell = 'border-r border-b border-black/[0.07] px-2.5 py-1.5'
  return (
    <div className="selectable max-h-full w-full max-w-[760px] overflow-auto rounded-[12px] bg-white text-[12.5px] text-[#1d1d24] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.75)] ring-1 ring-black/10 scrollbar-thin">
      <table className="w-full border-collapse tabular-nums">
        <thead>
          <tr className="bg-[#f1f2f5] text-[11px] text-black/40">
            <th className={`${cell} w-8`} />
            {COLUMNS.map((c) => (
              <th key={c} className={`${cell} font-medium`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${cell} bg-[#f1f2f5] text-center text-[11px] text-black/40`}>1</td>
            {labels.map((l, i) => (
              <td key={l} className={`${cell} font-semibold ${i ? 'text-right' : ''}`} style={{ color: accent }}>
                {l}
              </td>
            ))}
          </tr>
          {rows.map((row, i) => (
            <tr key={row.name}>
              <td className={`${cell} bg-[#f1f2f5] text-center text-[11px] text-black/40`}>{i + 2}</td>
              <td className={cell}>{row.name}</td>
              {row.values.map((v, j) => (
                <td key={j} className={`${cell} text-right`}>
                  {v.toLocaleString()}
                </td>
              ))}
              <td className={`${cell} text-right font-medium`}>{row.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TOKEN_COLORS = ['#c792ea', '#82aaff', '#c3e88d', '#f78c6c', '#89ddff', '#a6accd']

function CodePreview({ node }: { node: FileNode }) {
  const r = rng(hashString(node.name))
  const lines = Array.from({ length: 22 }, () => {
    const indent = Math.floor(r() * 3)
    const tokens = r() > 0.12 ? 1 + Math.floor(r() * 4) : 0
    return { indent, tokens: Array.from({ length: tokens }, () => ({ w: 3 + r() * 11, c: TOKEN_COLORS[Math.floor(r() * TOKEN_COLORS.length)] })) }
  })
  return (
    <div className="w-full max-w-[780px] overflow-hidden rounded-2xl bg-[#15151c] py-5 shadow-2xl ring-1 ring-white/10">
      {lines.map((line, i) => (
        <div key={i} className="flex h-[22px] items-center gap-4 pr-6">
          <span className="w-10 shrink-0 text-right font-mono text-[11.5px] text-white/25 tabular-nums">{i + 1}</span>
          <span className="flex items-center gap-1.5" style={{ paddingLeft: line.indent * 20 }}>
            {line.tokens.map((t, j) => (
              <span key={j} className="block h-[7px] rounded-full opacity-80" style={{ width: `${t.w * 6}px`, background: t.c }} />
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}
