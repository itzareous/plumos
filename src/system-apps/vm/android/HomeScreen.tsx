import { CalendarClock, Mic, Search } from 'lucide-react'
import { AppGlyph, GLYPHS } from '../apps/glyphs'
import { useNow } from '../hooks'
import { NAV_H, STATUS_H, type PhoneApp } from './phone'

const GRID: PhoneApp[] = ['clock', 'calendar', 'photos', 'weather', 'notes', 'calc', 'music', 'settings']
const DOCK: PhoneApp[] = ['phone', 'messages', 'browser', 'camera']

/** Home screen: clock, an at-a-glance card, the app grid, a search pill and the dock. */
export function HomeScreen({ onLaunch }: { onLaunch: (app: PhoneApp) => void }) {
  const now = useNow(1000)
  return (
    <div className="absolute inset-x-0 flex flex-col px-5" style={{ top: STATUS_H, bottom: NAV_H }}>
      <div className="pt-10 text-center">
        <div className="text-[68px] leading-none font-extralight tracking-tight tabular-nums">
          {now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '')}
        </div>
        <div className="mt-2 text-[14px] text-white/80">
          {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} · 18° Partly cloudy
        </div>
      </div>

      <div className="mx-1 mt-8 flex items-center gap-3 rounded-3xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur-md">
        <span className="flex size-9 items-center justify-center rounded-full bg-emerald-300/20 text-emerald-200">
          <CalendarClock size={18} />
        </span>
        <div className="min-w-0 text-[13px]">
          <div className="font-medium">Dentist at 3:30 PM</div>
          <div className="text-white/60">Leave by 3:05 · 12 min drive</div>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-4 gap-y-5">
        {GRID.map((app) => (
          <AppButton key={app} app={app} onLaunch={onLaunch} label />
        ))}
      </div>

      <button
        type="button"
        data-agent="home.search"
        onClick={() => onLaunch('browser')}
        className="mt-7 flex h-12 items-center gap-3 rounded-full bg-white/[0.16] px-4 text-left text-[15px] text-white/75 ring-1 ring-white/10 backdrop-blur-md transition outline-none active:bg-white/25"
      >
        <Search size={19} className="text-white/85" />
        <span className="flex-1">Search</span>
        <Mic size={18} className="text-white/70" />
      </button>

      <div className="mt-5 mb-4 grid grid-cols-4">
        {DOCK.map((app) => (
          <AppButton key={app} app={app} onLaunch={onLaunch} />
        ))}
      </div>
    </div>
  )
}

function AppButton({ app, onLaunch, label }: { app: PhoneApp; onLaunch: (app: PhoneApp) => void; label?: boolean }) {
  return (
    <button
      type="button"
      data-agent={`home.${app}`}
      aria-label={GLYPHS[app].label}
      onClick={() => onLaunch(app)}
      className="flex flex-col items-center gap-1.5 outline-none active:scale-95 transition-transform"
    >
      <AppGlyph app={app} size={54} shape="circle" />
      {label && <span className="text-[12px] text-white/90 [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">{GLYPHS[app].label}</span>}
    </button>
  )
}
