import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BatteryMedium, LayoutGrid, LogOut, Power, Volume2, Wifi } from 'lucide-react'
import { cn } from '@/lib/cn'
import { AppGlyph, GLYPHS, type GuestApp } from '../apps/glyphs'
import { useNow } from '../hooks'
import { PeakMark } from '../screen/marks'
import type { WindowManager } from '../wm/useWindowManager'

export const PANEL_H = 30
export const DOCK_W = 68
export const DOCK_APPS: GuestApp[] = ['terminal', 'editor', 'files', 'browser', 'calc', 'settings']

/** Top panel: apps button, centred clock, status icons and a power menu. */
export function TopPanel({ onApps, onShutdown, onLogOut }: { onApps: () => void; onShutdown: () => void; onLogOut: () => void }) {
  const now = useNow(1000)
  const [menu, setMenu] = useState(false)
  return (
    <div
      className="absolute inset-x-0 top-0 z-[900] flex items-center justify-between bg-[#0c0c10]/85 px-2 text-[12.5px] font-medium text-white/90 backdrop-blur-xl"
      style={{ height: PANEL_H }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        data-agent="panel.apps"
        onClick={onApps}
        className="flex h-[22px] items-center gap-1.5 rounded-full px-2.5 transition outline-none hover:bg-white/10"
      >
        <PeakMark size={15} /> Apps
      </button>
      <span className="absolute left-1/2 -translate-x-1/2 tabular-nums">
        {now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
        {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
      </span>
      <div className="relative">
        <button
          type="button"
          aria-label="System menu"
          onClick={() => setMenu((m) => !m)}
          className={cn('flex h-[22px] items-center gap-2 rounded-full px-2.5 transition outline-none hover:bg-white/10', menu && 'bg-white/15')}
        >
          <Wifi size={13} />
          <Volume2 size={13} />
          <BatteryMedium size={15} />
          <Power size={13} />
        </button>
        <AnimatePresence>
          {menu && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute top-8 right-0 w-48 rounded-2xl bg-[#26262c] p-1.5 shadow-2xl ring-1 ring-white/10"
            >
              {[
                { label: 'Log out', icon: LogOut, fn: onLogOut },
                { label: 'Power off', icon: Power, fn: onShutdown },
              ].map((i) => (
                <button
                  key={i.label}
                  type="button"
                  onClick={() => {
                    setMenu(false)
                    i.fn()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition hover:bg-white/10"
                >
                  <i.icon size={14} className="text-white/70" /> {i.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** Left dock with favourite apps, running dots and an app grid button. */
export function Dock({ wm, onGrid }: { wm: WindowManager; onGrid: () => void }) {
  const activeApp = wm.wins.find((w) => w.id === wm.active)?.app
  return (
    <div
      className="absolute left-0 z-[890] flex flex-col items-center gap-1.5 bg-[#101015]/75 py-2.5 backdrop-blur-xl"
      style={{ top: PANEL_H, bottom: 0, width: DOCK_W }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {DOCK_APPS.map((app) => {
        const open = wm.wins.some((w) => w.app === app)
        return (
          <button
            key={app}
            type="button"
            title={GLYPHS[app].label}
            aria-label={GLYPHS[app].label}
            data-agent={`dock.${app}`}
            onClick={() => wm.toggle(app)}
            className={cn(
              'relative flex size-[54px] items-center justify-center rounded-xl transition outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50',
              activeApp === app && 'bg-white/[0.08]',
            )}
          >
            <AppGlyph app={app} size={40} shape="squircle" />
            {open && <span className="absolute left-0.5 size-[5px] rounded-full bg-orange-400" />}
          </button>
        )
      })}
      <span className="mt-auto" />
      <button
        type="button"
        aria-label="Show apps"
        data-agent="dock.apps"
        onClick={onGrid}
        className="flex size-[54px] items-center justify-center rounded-xl text-white/80 transition outline-none hover:bg-white/10"
      >
        <LayoutGrid size={22} />
      </button>
    </div>
  )
}

/** Full-screen app grid over a dimmed desktop. */
export function AppGrid({ onOpen, onClose }: { onOpen: (app: GuestApp) => void; onClose: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 z-[880] flex items-center justify-center bg-black/55 backdrop-blur-lg"
      style={{ paddingLeft: DOCK_W, paddingTop: PANEL_H }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={onClose}
    >
      <motion.div
        className="grid grid-cols-4 gap-x-10 gap-y-8"
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {DOCK_APPS.concat(['tasks']).map((app) => (
          <button
            key={app}
            type="button"
            onClick={() => onOpen(app)}
            className="flex w-24 flex-col items-center gap-2.5 rounded-2xl p-2 text-[13px] text-white/90 transition outline-none hover:bg-white/10"
          >
            <AppGlyph app={app} size={60} shape="squircle" />
            {GLYPHS[app].label}
          </button>
        ))}
      </motion.div>
    </motion.div>
  )
}

/** Dark hills under a warm glow, drawn for the Linux-style guest. */
export function LinuxWallpaper() {
  return (
    <svg viewBox="0 0 1152 720" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="vml-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1030" />
          <stop offset="0.55" stopColor="#4a1f4f" />
          <stop offset="1" stopColor="#c2553b" />
        </linearGradient>
        <radialGradient id="vml-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd08a" />
          <stop offset="0.4" stopColor="#ff9a5a" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ff9a5a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1152" height="720" fill="url(#vml-sky)" />
      <circle cx="760" cy="470" r="260" fill="url(#vml-sun)" />
      <circle cx="760" cy="470" r="62" fill="#ffe0ad" opacity="0.95" />
      <path d="M0 520 180 380 300 470 470 300 640 480 800 360 980 470 1152 330V720H0z" fill="#3a1840" opacity="0.9" />
      <path d="M0 590 150 500 330 580 520 450 700 570 880 480 1040 560 1152 500V720H0z" fill="#261030" />
      <path d="M0 660 220 590 420 650 640 570 860 650 1040 600 1152 640V720H0z" fill="#140a1c" />
      <path d="M470 300 520 360 490 352 470 380 452 350 430 355z" fill="#f8e1ff" opacity="0.35" />
    </svg>
  )
}
