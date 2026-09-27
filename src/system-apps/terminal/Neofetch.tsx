import type { ReactNode } from 'react'
import { formatBytes } from '@/lib/format'
import type { SystemStats } from '@/stores/system'
import { cn } from '@/lib/cn'
import { tone } from './ui'

/**
 * The Plumos mark as ASCII art: a shaded plum with its seam, a stem and a
 * leaf. `INK` colours each character: l leaf, s stem, m seam, a–f the body
 * from highlight to shadow.
 */
const ART = [
  '                     :-====-:',
  '                / =#########*',
  '               /-#########*:',
  '              /   .--=--:',
  '             /',
  '      .-+##:.|##%*+-',
  '    -####- .#########*-',
  '  :#####-.-#############:',
  ' =#####%.:###############-',
  ':######:.%################:',
  '#######:.#################*',
  '#######-.##################',
  '######## :#################',
  '+#########################=',
  ' #########################',
  '  *#####################*',
  '   -###################:',
  '     :+%############+:',
  '         :-=+++=-:',
]

const INK = [
  '                     llllllll',
  '                s lllllllllll',
  '               sllllllllllll',
  '              s   lllllll',
  '             s',
  '      aaaaammsaabbbb',
  '    aaaaammmaabbbbbbccc',
  '  aaaaaammmbbbbbbccccccdd',
  ' aaaaaaammbbbbccccccdddddd',
  'aaaaaabmmbbbccccccddddddeee',
  'aaabbbbmmccccccddddddeeeeee',
  'bbbbbbcmmcccddddddeeeeeeeff',
  'bbbbccccmmddddddeeeeeefffff',
  'bccccccddddddeeeeeeffffffff',
  ' cccdddddddeeeeeefffffffff',
  '  ddddddeeeeeefffffffffff',
  '   ddeeeeeefffffffffffff',
  '     eeeefffffffffffff',
  '         fffffffff',
]

const INKS: Record<string, string> = {
  l: '#62d68f',
  s: '#d09a62',
  m: '#f6ecff',
  a: '#efdfff',
  b: '#d9b8ff',
  c: '#bd92f7',
  d: '#a172ea',
  e: '#8656d3',
  f: '#6c3fb8',
}

/** Groups runs of the same ink into spans. */
function artRow(text: string, ink: string) {
  const runs: { color: string; text: string }[] = []
  for (let i = 0; i < text.length; i++) {
    const color = INKS[ink[i]] ?? 'transparent'
    const last = runs[runs.length - 1]
    if (last && last.color === color) last.text += text[i]
    else runs.push({ color, text: text[i] })
  }
  return runs.map((r, i) => (
    <span key={i} style={{ color: r.color }}>
      {r.text}
    </span>
  ))
}

/** The logo on its own, for the welcome banner and `neofetch`. */
export function PlumArt({ className }: { className?: string }) {
  return (
    <div className={cn('font-semibold whitespace-pre leading-[1.22]', className)} aria-label="Plumos logo" role="img">
      {ART.map((row, i) => (
        <div key={i}>{artRow(row, INK[i])}</div>
      ))}
    </div>
  )
}

function duration(seconds: number) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`
  return [d && part(d, 'day'), h && part(h, 'hour'), part(m, 'min')].filter(Boolean).join(', ')
}

const pct = (a: number, b: number) => Math.round((a / b) * 100)

const PALETTE = [
  ['#2b2935', '#ff7a8a', '#6ee7a0', '#f5d06f', '#7cb8ff', '#c9a4ff', '#6fe0e6', '#d9d6e2'],
  ['#55526a', '#ffa3ae', '#a3f2c2', '#fae3a1', '#aad1ff', '#e0c9ff', '#a4eef1', '#ffffff'],
]

export function Neofetch({
  user,
  host,
  stats,
  apps,
}: {
  user: string
  host: string
  stats: SystemStats
  apps: number
}) {
  const arch = stats.arch === 'arm64' ? 'aarch64' : 'x86_64'
  const rx = stats.network ? formatBytes(stats.network.rx) + '/s' : '—'
  const tx = stats.network ? formatBytes(stats.network.tx) + '/s' : '—'
  const info: [string, ReactNode][] = [
    ['OS', `${stats.os} ${arch}`],
    ['Host', `${host}.local`],
    // A live server reports its own OS; only the demo claims our kernel.
    ...(stats.source === 'demo' ? [['Kernel', '6.12.43-plumos'] as [string, ReactNode]] : []),
    ['Uptime', duration(stats.uptime)],
    ['Apps', `${apps} installed`],
    ['Shell', 'plush 1.0'],
    ['CPU', `${stats.cpu.model} (${stats.cpu.cores}) · ${Math.round(stats.cpu.usage)}% busy`],
    [
      'Memory',
      `${formatBytes(stats.memory.used)} / ${formatBytes(stats.memory.total, 0)} (${pct(stats.memory.used, stats.memory.total)}%)`,
    ],
    [
      'Storage',
      `${formatBytes(stats.storage.used)} / ${formatBytes(stats.storage.total, 0)} (${pct(stats.storage.used, stats.storage.total)}%)`,
    ],
    ['Network', `↓ ${rx}  ↑ ${tx}`],
  ]
  const title = `${user}@${host}`

  return (
    <div className="flex flex-wrap items-start gap-x-[4ch] gap-y-4 py-1.5">
      <PlumArt />
      <div className="min-w-0 pt-0.5">
        <div>
          <span className={cn(tone.green, 'font-semibold')}>{user}</span>
          <span className={tone.dim}>@</span>
          <span className={cn(tone.plum, 'font-semibold')}>{host}</span>
        </div>
        <div className={tone.dim}>{'─'.repeat(title.length)}</div>
        {info.map(([label, value]) => (
          <div key={label} className="break-words">
            <span className={cn(tone.plum, 'font-semibold')}>{label}</span>
            <span className={tone.dim}>: </span>
            <span className="tabular-nums">{value}</span>
          </div>
        ))}
        <div className="mt-[1.5em] flex flex-col" aria-hidden>
          {PALETTE.map((row, r) => (
            <div key={r} className="flex">
              {row.map((color) => (
                <span key={color} className="inline-block h-[1.5em] w-[3ch]" style={{ background: color }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
