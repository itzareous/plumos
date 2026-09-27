import { useEffect, useRef } from 'react'
import { MonitorSmartphone } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Loc } from '../lib/tree'
import type { NavEntry } from './navEntries'

/** On phones the sidebar becomes a strip of chips under the title. */
export function PhoneNav({
  entries,
  active,
  onNavigate,
  onConnect,
}: {
  entries: NavEntry[]
  active: Loc
  onNavigate: (loc: Loc) => void
  onConnect: () => void
}) {
  const strip = useRef<HTMLDivElement>(null)

  // Keep the active chip in view.
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>('[aria-current="page"]')
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [active])

  return (
    <div
      ref={strip}
      className="scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:hidden"
      role="navigation"
      aria-label="Places"
    >
      {entries.map((e) => {
        const Icon = e.icon
        const on = e.loc === active
        return (
          <button
            key={e.loc}
            type="button"
            onClick={() => onNavigate(e.loc)}
            aria-current={on ? 'page' : undefined}
            className={cn(
              'flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95',
              on ? 'bg-white text-black' : 'bg-white/[0.08] text-white/80 ring-1 ring-inset ring-white/10',
            )}
          >
            <Icon size={15} className={on ? 'text-black/70' : 'text-accent'} />
            {e.label}
            {e.count ? <span className={cn('tabular-nums', on ? 'text-black/50' : 'text-white/40')}>{e.count}</span> : null}
          </button>
        )
      })}
      <button
        type="button"
        onClick={onConnect}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white/80 ring-1 ring-inset ring-white/10 transition outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95"
      >
        <MonitorSmartphone size={15} className="text-accent" />
        Connect
      </button>
    </div>
  )
}
