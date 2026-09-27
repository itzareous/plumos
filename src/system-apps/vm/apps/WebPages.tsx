import { useState } from 'react'
import { CloudSun, Map as MapIcon, Newspaper, Search, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/cn'
import { article, results, type WebPage } from './webData'

/** Our made-up search engine's wordmark. */
export function Wordmark({ size = 40 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-[0.18em] font-bold tracking-tight text-[#1b2140]" style={{ fontSize: size }}>
      <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id="vm-wander" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14" fill="url(#vm-wander)" />
        <path d="M9 19c3-6 6-9 14-10-3 6-6 10-14 10z" fill="#fff" opacity="0.95" />
      </svg>
      wander
    </span>
  )
}

function SearchBox({ initial = '', onSearch, compact }: { initial?: string; onSearch: (q: string) => void; compact?: boolean }) {
  const [q, setQ] = useState(initial)
  return (
    <label
      className={cn(
        'flex w-full items-center gap-2.5 rounded-full bg-white px-4 text-[#1b2140] shadow-[0_2px_10px_rgb(20_30_80/0.1)] ring-1 ring-[#dfe3ef] transition focus-within:ring-2 focus-within:ring-[#6366f1]/50',
        compact ? 'h-10' : 'h-12',
      )}
    >
      <Search size={compact ? 16 : 18} className="shrink-0 text-[#6b7394]" />
      <input
        data-agent="web.search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && q.trim() && onSearch(q.trim())}
        placeholder="Search the web"
        aria-label="Search the web"
        className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9aa1bb]"
      />
    </label>
  )
}

const SHORTCUTS = [
  { label: 'Recipes', icon: UtensilsCrossed, q: 'easy lentil soup recipe', bg: '#fff1e6', fg: '#ea580c' },
  { label: 'Weather', icon: CloudSun, q: 'weather this weekend', bg: '#e0f2fe', fg: '#0284c7' },
  { label: 'News', icon: Newspaper, q: 'local news today', bg: '#ede9fe', fg: '#7c3aed' },
  { label: 'Maps', icon: MapIcon, q: 'weekend trip to the coast', bg: '#dcfce7', fg: '#16a34a' },
]

export function SearchHome({ onGo, compact }: { onGo: (p: WebPage) => void; compact?: boolean }) {
  return (
    <div className={cn('flex min-h-full flex-col items-center bg-[#f7f8fc] px-6', compact ? 'pt-16' : 'justify-center pb-16')}>
      <Wordmark size={compact ? 34 : 46} />
      <div className={cn('mt-6 w-full', compact ? '' : 'max-w-[520px]')}>
        <SearchBox onSearch={(q) => onGo({ kind: 'results', q })} compact={compact} />
      </div>
      <div className={cn('mt-8 grid gap-3', compact ? 'grid-cols-4 gap-2' : 'grid-cols-4')}>
        {SHORTCUTS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onGo({ kind: 'results', q: s.q })}
            className="flex flex-col items-center gap-2 rounded-2xl p-2 text-[12px] text-[#3b4263] transition outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-[#6366f1]/50"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl" style={{ background: s.bg, color: s.fg }}>
              <s.icon size={20} />
            </span>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ResultsView({ q, onGo, compact }: { q: string; onGo: (p: WebPage) => void; compact?: boolean }) {
  const list = results(q)
  return (
    <div className="min-h-full bg-white text-[#1b2140]">
      <div className={cn('sticky top-0 z-10 border-b border-[#eceef5] bg-white/95 backdrop-blur', compact ? 'px-4 pt-3' : 'px-8 pt-4')}>
        <div className="flex items-center gap-5">
          {!compact && <Wordmark size={24} />}
          <div className="max-w-[520px] flex-1">
            <SearchBox key={q} initial={q} onSearch={(nq) => onGo({ kind: 'results', q: nq })} compact />
          </div>
        </div>
        <div className={cn('mt-3 flex gap-5 text-[13px] text-[#6b7394]', !compact && 'pl-[118px]')}>
          {['All', 'Images', 'News', 'Maps'].map((t, i) => (
            <span key={t} className={cn('border-b-2 pb-2', i === 0 ? 'border-[#6366f1] font-medium text-[#1b2140]' : 'border-transparent')}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className={cn('space-y-6', compact ? 'px-4 py-4' : 'max-w-[640px] py-5 pr-8 pl-[150px]')}>
        <p className="text-[12px] text-[#8a91ad]">Top results for “{q}”</p>
        {list.map((r, i) => (
          <article key={i}>
            <div className="flex items-center gap-2 text-[12px] text-[#4b5374]">
              <span className="flex size-6 items-center justify-center rounded-full bg-[#eef0f7] text-[10px] font-bold uppercase text-[#6366f1]">
                {r.site[0]}
              </span>
              <span className="min-w-0">
                <span className="block leading-tight">{r.site.replace('.example', '')}</span>
                <span className="block truncate text-[11px] leading-tight text-[#8a91ad]">{r.url}</span>
              </span>
            </div>
            <button
              type="button"
              data-agent={`web.result.${i}`}
              onClick={() => onGo({ kind: 'article', q, i })}
              className="mt-1 text-left text-[17px] leading-snug font-medium text-[#3730a3] outline-none hover:underline focus-visible:underline"
            >
              {r.title}
            </button>
            <p className="mt-1 text-[13px] leading-relaxed text-[#4b5374]">{r.snippet}</p>
          </article>
        ))}
        <div>
          <p className="mb-2 text-[13px] font-medium">People also search for</p>
          <div className="flex flex-wrap gap-2">
            {['quick', 'healthy', 'for kids', 'near me'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onGo({ kind: 'results', q: `${q} ${s}` })}
                className="rounded-full bg-[#f1f3f9] px-3 py-1.5 text-[12px] text-[#3b4263] transition hover:bg-[#e6e9f3]"
              >
                {q} {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ArticleView({ q, i, compact }: { q: string; i: number; compact?: boolean }) {
  const a = article(q, i)
  return (
    <div className="min-h-full bg-[#fbfaf7] text-[#23232b]">
      <header className={cn('flex items-center gap-2 border-b border-black/[0.06] bg-white', compact ? 'h-11 px-4' : 'h-14 px-10')}>
        <span className="size-3 rounded-full bg-gradient-to-br from-orange-400 to-rose-500" />
        <span className="text-[14px] font-semibold tracking-tight">{a.site.replace('.example', '')}</span>
        {!compact && (
          <nav className="ml-auto flex gap-6 text-[13px] text-black/50">
            <span>Recipes</span>
            <span>Guides</span>
            <span>About</span>
          </nav>
        )}
      </header>
      <div className={cn('mx-auto', compact ? 'px-4 py-5' : 'max-w-[640px] px-8 py-8')}>
        <h1 className={cn('font-bold tracking-tight', compact ? 'text-[22px] leading-tight' : 'text-[30px] leading-[1.15]')}>{a.title}</h1>
        <p className="mt-2 text-[12px] text-black/45">{a.byline}</p>
        <Hero seed={i} className={cn('mt-5 w-full rounded-2xl', compact ? 'h-36' : 'h-52')} />
        <p className="mt-5 text-[15px] leading-relaxed text-black/75">{a.intro}</p>
        <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-black/[0.06]">
          <h2 className="text-[14px] font-semibold">{a.listTitle}</h2>
          <ul className="mt-2 space-y-1.5 text-[14px] text-black/70">
            {a.list.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        {a.sections.map((s) => (
          <section key={s.heading} className="mt-6">
            <h2 className="text-[17px] font-semibold">{s.heading}</h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-black/70">{s.body}</p>
          </section>
        ))}
        <p className="mt-10 border-t border-black/[0.06] pt-4 text-[12px] text-black/35">Made-up page for the Plumos demo.</p>
      </div>
    </div>
  )
}

/** An abstract illustration in place of a photo. */
function Hero({ seed, className }: { seed: number; className?: string }) {
  const palettes = [
    ['#fde68a', '#fb923c', '#e11d48'],
    ['#a7f3d0', '#34d399', '#0f766e'],
    ['#c7d2fe', '#818cf8', '#4338ca'],
    ['#fecdd3', '#fb7185', '#9f1239'],
    ['#bae6fd', '#38bdf8', '#0369a1'],
  ]
  const [a, b, c] = palettes[seed % palettes.length]
  return (
    <svg viewBox="0 0 600 240" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <rect width="600" height="240" fill={a} />
      <circle cx="420" cy="70" r="46" fill="#fff" opacity="0.55" />
      <path d="M0 170C120 120 220 190 340 150S520 90 600 130V240H0z" fill={b} />
      <path d="M0 205C140 170 260 230 400 195S540 170 600 185V240H0z" fill={c} opacity="0.9" />
    </svg>
  )
}

export function WebPageView({ page, onGo, compact }: { page: WebPage; onGo: (p: WebPage) => void; compact?: boolean }) {
  if (page.kind === 'home') return <SearchHome onGo={onGo} compact={compact} />
  if (page.kind === 'results') return <ResultsView q={page.q} onGo={onGo} compact={compact} />
  return <ArticleView q={page.q} i={page.i} compact={compact} />
}
