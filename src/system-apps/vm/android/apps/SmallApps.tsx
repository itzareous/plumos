import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  BatteryMedium,
  Bluetooth,
  Cloud,
  CloudRain,
  CloudSun,
  Delete,
  Monitor,
  Pause,
  Phone,
  Play,
  SkipBack,
  SkipForward,
  Smartphone,
  Sun,
  Volume2,
  Wifi,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useNow } from '../../hooks'
import type { VmSpec } from '../../types'
import { AppHeader } from '../phone'

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn('relative h-7 w-12 rounded-full transition-colors', on ? 'bg-sky-300' : 'bg-white/20')}
    >
      <span className={cn('absolute top-1 size-5 rounded-full transition-all', on ? 'left-6 bg-sky-950' : 'left-1 bg-white/70')} />
    </button>
  )
}

export function ClockApp() {
  const now = useNow(1000)
  const [alarms, setAlarms] = useState([
    { t: '6:45', d: 'Weekdays', on: true },
    { t: '8:30', d: 'Sat, Sun', on: false },
    { t: '21:00', d: 'Put the bins out', on: true },
  ])
  return (
    <div className="flex h-full flex-col bg-[#101318]">
      <AppHeader title="Clock" />
      <div className="py-8 text-center">
        <div className="text-[56px] font-extralight tabular-nums">{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        <div className="text-[14px] text-white/55">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </div>
      <div className="space-y-2.5 px-4">
        {alarms.map((a, i) => (
          <div key={a.t} className="flex items-center justify-between rounded-3xl bg-white/[0.06] px-5 py-4">
            <div>
              <div className={cn('text-[30px] font-light tabular-nums', !a.on && 'text-white/45')}>{a.t}</div>
              <div className="text-[13px] text-white/55">{a.d}</div>
            </div>
            <Toggle on={a.on} label={`Alarm ${a.t}`} onChange={(on) => setAlarms((as) => as.map((x, j) => (j === i ? { ...x, on } : x)))} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function CalendarApp() {
  const now = useNow(60_000)
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7
  const events = [
    { t: '15:30', title: 'Dentist', color: '#f87171' },
    { t: '19:00', title: 'Dinner at Sam’s', color: '#fbbf24' },
  ]
  return (
    <div className="flex h-full flex-col bg-[#121317]">
      <AppHeader title={now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} />
      <div className="grid grid-cols-7 gap-y-1 px-3 text-center text-[13px]">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="pb-2 text-white/40">
            {d}
          </div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => (
          <div key={i} className="flex justify-center">
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-full tabular-nums',
                i + 1 === now.getDate() ? 'bg-rose-400 font-semibold text-rose-950' : 'text-white/85',
              )}
            >
              {i + 1}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 border-t border-white/10 px-4 pt-4">
        <div className="text-[13px] text-white/50">Today</div>
        {events.map((e) => (
          <div key={e.t} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3">
            <span className="h-9 w-1 rounded-full" style={{ background: e.color }} />
            <div>
              <div className="text-[15px] font-medium">{e.title}</div>
              <div className="text-[13px] text-white/50 tabular-nums">{e.t}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PhotosApp() {
  const tiles = Array.from({ length: 21 }, (_, i) => i)
  return (
    <div className="flex h-full flex-col bg-[#0f1013]">
      <AppHeader title="Photos" />
      <div className="px-4 pb-2 text-[13px] text-white/50">This week</div>
      <div className="scrollbar-none grid grid-cols-3 gap-0.5 overflow-y-auto">
        {tiles.map((i) => {
          const h = (i * 47) % 360
          return (
            <div
              key={i}
              className="aspect-square"
              style={{
                background: `linear-gradient(${(i * 40) % 360}deg, hsl(${h} 65% 60%), hsl(${(h + 60) % 360} 55% 30%))`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export function WeatherApp() {
  const hours = [
    ['Now', CloudSun, 18],
    ['14', Sun, 19],
    ['15', Sun, 20],
    ['16', CloudSun, 19],
    ['17', Cloud, 17],
    ['18', CloudRain, 15],
  ] as const
  const days = [
    ['Today', CloudSun, 20, 11],
    ['Mon', Sun, 22, 12],
    ['Tue', CloudRain, 16, 10],
    ['Wed', Cloud, 17, 9],
    ['Thu', CloudSun, 19, 11],
  ] as const
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#2b6cb0] to-[#1a365d]">
      <AppHeader title="Home" sub="Updated just now" />
      <div className="px-6 pt-4">
        <div className="text-[84px] leading-none font-extralight">18°</div>
        <div className="mt-2 text-[17px]">Partly cloudy</div>
        <div className="text-[14px] text-white/65">High 20° · Low 11°</div>
      </div>
      <div className="mx-4 mt-6 flex justify-between rounded-3xl bg-white/10 px-4 py-4">
        {hours.map(([t, Icon, deg]) => (
          <div key={t} className="flex flex-col items-center gap-2 text-[13px]">
            <span className="text-white/70">{t}</span>
            <Icon size={20} />
            <span className="tabular-nums">{deg}°</span>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-3 rounded-3xl bg-white/10 px-4 py-2">
        {days.map(([d, Icon, hi, lo]) => (
          <div key={d} className="flex items-center justify-between py-2 text-[14px]">
            <span className="w-14">{d}</span>
            <Icon size={18} />
            <span className="w-16 text-right tabular-nums">
              {hi}° <span className="text-white/55">{lo}°</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MusicApp() {
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(48)
  const total = 214
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setPos((p) => (p + 1) % total), 1000)
    return () => clearInterval(t)
  }, [playing])
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#4a1d2e] to-[#141016]">
      <AppHeader title="Now playing" />
      <div className="px-8 pt-4">
        <motion.div
          className="aspect-square overflow-hidden rounded-3xl shadow-2xl"
          animate={{ scale: playing ? 1 : 0.92 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <rect width="100" height="100" fill="#fb7185" />
            <circle cx="70" cy="32" r="16" fill="#fde68a" />
            <path d="M0 70q25-18 50 0t50 0v30H0z" fill="#9f1239" />
            <path d="M0 80q25-12 50 0t50 0v20H0z" fill="#4c0519" />
          </svg>
        </motion.div>
        <div className="mt-6 text-[20px] font-semibold">Low Tide Radio</div>
        <div className="text-[14px] text-white/60">Hollow Pines</div>
        <div className="mt-5 h-1 rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: `${(pos / total) * 100}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[12px] text-white/50 tabular-nums">
          <span>{fmt(pos)}</span>
          <span>{fmt(total)}</span>
        </div>
        <div className="mt-4 flex items-center justify-center gap-8">
          <SkipBack size={26} />
          <button
            type="button"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={() => setPlaying((p) => !p)}
            className="flex size-16 items-center justify-center rounded-full bg-white text-[#4a1d2e]"
          >
            {playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>
          <SkipForward size={26} />
        </div>
      </div>
    </div>
  )
}

export function SettingsApp({ spec }: { spec: VmSpec }) {
  const rows = [
    [Wifi, 'Network & internet', 'plumos-home'],
    [Bluetooth, 'Connected devices', 'Bluetooth off'],
    [BatteryMedium, 'Battery', '82% · about 1 day left'],
    [Monitor, 'Display', 'Dark theme, auto-rotate'],
    [Volume2, 'Sound', 'Ring, 80%'],
  ] as const
  return (
    <div className="flex h-full flex-col bg-[#121317]">
      <AppHeader title="Settings" />
      <div className="scrollbar-none flex-1 overflow-y-auto px-4 pb-6">
        <div className="rounded-3xl bg-emerald-300/10 p-4 ring-1 ring-emerald-300/20">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-emerald-300/20 text-emerald-200">
              <Smartphone size={20} />
            </span>
            <div>
              <div className="text-[15px] font-medium">Plumos virtual phone</div>
              <div className="text-[12px] text-white/55">Runs on your home server</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]">
            {[
              [`${spec.cpus}`, 'CPU cores'],
              [`${spec.memoryGb} GB`, 'Memory'],
              [`${spec.diskGb} GB`, 'Storage'],
            ].map(([v, k]) => (
              <div key={k} className="rounded-2xl bg-black/20 py-2">
                <div className="text-[15px] font-semibold tabular-nums">{v}</div>
                <div className="text-white/50">{k}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3">
          {rows.map(([Icon, title, sub]) => (
            <div key={title} className="flex items-center gap-4 px-2 py-3.5">
              <Icon size={20} className="text-white/70" />
              <div>
                <div className="text-[15px]">{title}</div>
                <div className="text-[13px] text-white/50">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DialerApp() {
  const [num, setNum] = useState('')
  const [calling, setCalling] = useState(false)
  useEffect(() => {
    if (!calling) return
    const t = setTimeout(() => setCalling(false), 2600)
    return () => clearTimeout(t)
  }, [calling])
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']
  return (
    <div className="flex h-full flex-col bg-[#101114]">
      <AppHeader title="Phone" />
      <div className="flex h-24 items-center justify-center px-6 text-[34px] font-light tracking-wider tabular-nums">
        <AnimatePresence mode="wait">
          {calling ? (
            <motion.span key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-[15px] text-white/70">
              This virtual phone has no SIM card.
            </motion.span>
          ) : (
            <motion.span key="n" className="truncate">
              {num || ' '}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="mx-auto mt-auto grid w-[270px] grid-cols-3 gap-4 pb-6">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setNum((n) => (n + k).slice(0, 14))}
            className="flex size-[74px] items-center justify-center justify-self-center rounded-full bg-white/[0.08] text-[28px] transition active:bg-white/20"
          >
            {k}
          </button>
        ))}
        <span />
        <button
          type="button"
          aria-label="Call"
          onClick={() => num && setCalling(true)}
          className="flex size-[74px] items-center justify-center justify-self-center rounded-full bg-emerald-400 text-emerald-950"
        >
          <Phone size={28} fill="currentColor" />
        </button>
        <button type="button" aria-label="Delete" onClick={() => setNum((n) => n.slice(0, -1))} className="flex items-center justify-center text-white/70">
          <Delete size={24} />
        </button>
      </div>
    </div>
  )
}

export function CameraApp() {
  const [shots, setShots] = useState(0)
  return (
    <div className="relative flex h-full flex-col bg-black">
      <div className="relative m-0 flex-1 overflow-hidden">
        <motion.div
          className="absolute inset-[-20%]"
          style={{ background: 'radial-gradient(circle at 30% 40%, #fbbf24, transparent 40%), radial-gradient(circle at 70% 60%, #34d399, transparent 45%), linear-gradient(160deg,#1e3a8a,#0f172a)' }}
          animate={{ x: [0, 18, -12, 0], y: [0, -10, 14, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="border-[0.5px] border-white/15" />
          ))}
        </div>
        <AnimatePresence>
          {shots > 0 && (
            <motion.div key={shots} className="absolute inset-0 bg-white" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }} />
          )}
        </AnimatePresence>
      </div>
      <div className="flex h-36 items-center justify-around">
        <span className="size-12 rounded-xl bg-gradient-to-br from-amber-300 to-emerald-500 ring-2 ring-white/40" style={{ opacity: shots ? 1 : 0.3 }} />
        <button
          type="button"
          aria-label="Take photo"
          onClick={() => setShots((n) => n + 1)}
          className="size-[72px] rounded-full border-4 border-white bg-white/90 transition active:scale-90"
        />
        <span className="w-12 text-center text-[12px] text-white/60 tabular-nums">{shots ? `${shots} shot${shots > 1 ? 's' : ''}` : 'Photo'}</span>
      </div>
    </div>
  )
}
