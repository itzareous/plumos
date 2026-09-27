import { useEffect, useState } from 'react'
import { Wifi } from 'lucide-react'
import { useNow } from '../hooks'
import { NAV_H, STATUS_H } from './phone'

/** Top status bar: live clock, signal, wifi and a slowly draining battery. */
export function StatusBar() {
  const now = useNow(1000)
  const [battery, setBattery] = useState(82)
  useEffect(() => {
    const t = setInterval(() => setBattery((b) => Math.max(12, b - 1)), 90_000)
    return () => clearInterval(t)
  }, [])
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[60] flex items-center justify-between px-5 text-[13px] font-medium text-white tabular-nums"
      style={{ height: STATUS_H }}
    >
      <span>{now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '')}</span>
      {/* Punch-hole camera. */}
      <span className="absolute top-[9px] left-1/2 size-[12px] -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />
      <span className="flex items-center gap-1.5">
        <Signal />
        <Wifi size={14} strokeWidth={2.4} />
        <Battery level={battery} />
        <span className="text-[12px]">{battery}%</span>
      </span>
    </div>
  )
}

function Signal() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 3.6} y={9 - i * 3} width="2.6" height={3 + i * 3} rx="0.8" fill="currentColor" opacity={i < 3 ? 1 : 0.4} />
      ))}
    </svg>
  )
}

function Battery({ level }: { level: number }) {
  return (
    <svg width="11" height="17" viewBox="0 0 11 17" aria-hidden>
      <rect x="3.5" y="0.5" width="4" height="2" rx="0.6" fill="currentColor" />
      <rect x="0.8" y="2.2" width="9.4" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.4" y={3.8 + 10.8 * (1 - level / 100)} width="6.2" height={10.8 * (level / 100)} rx="0.8" fill="currentColor" />
    </svg>
  )
}

/** Three-button navigation: back, home and recent apps, drawn as simple shapes. */
export function NavBar({ onBack, onHome, onRecents }: { onBack: () => void; onHome: () => void; onRecents: () => void }) {
  const btn = 'flex h-full w-20 items-center justify-center text-white/85 outline-none transition active:bg-white/10 rounded-full'
  return (
    <div className="absolute inset-x-0 bottom-0 z-[60] flex items-center justify-around bg-black/30 px-6 backdrop-blur-md" style={{ height: NAV_H }}>
      <button type="button" aria-label="Back" data-agent="nav.back" onClick={onBack} className={btn}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path d="M12.5 2.5v11L3 8z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </button>
      <button type="button" aria-label="Home" data-agent="nav.home" onClick={onHome} className={btn}>
        <span className="size-[17px] rounded-full border-[1.8px] border-current" />
      </button>
      <button type="button" aria-label="Recent apps" data-agent="nav.recents" onClick={onRecents} className={btn}>
        <span className="size-[15px] rounded-[3px] border-[1.8px] border-current" />
      </button>
    </div>
  )
}

/** An original phone wallpaper: soft colour fields and a couple of sweeping arcs. */
export function PhoneWallpaper() {
  return (
    <svg viewBox="0 0 360 780" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="vma-bg" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#0f3b3a" />
          <stop offset="0.5" stopColor="#123150" />
          <stop offset="1" stopColor="#1b1540" />
        </linearGradient>
        <radialGradient id="vma-a" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#34d399" stopOpacity="0.7" />
          <stop offset="1" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vma-b" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#818cf8" stopOpacity="0.65" />
          <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vma-arc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a7f3d0" stopOpacity="0.5" />
          <stop offset="1" stopColor="#c4b5fd" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect width="360" height="780" fill="url(#vma-bg)" />
      <circle cx="40" cy="190" r="230" fill="url(#vma-a)" />
      <circle cx="330" cy="560" r="260" fill="url(#vma-b)" />
      <path d="M-40 520C80 430 240 470 400 330" stroke="url(#vma-arc)" strokeWidth="46" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M-40 600C120 520 250 560 400 420" stroke="url(#vma-arc)" strokeWidth="18" fill="none" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}
