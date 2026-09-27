import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { dateLabel, timeLabel, useNow } from '../hooks'
import { WinWallpaper } from './Wallpaper'

export type SecurityScreen = 'options' | 'lock' | 'signin'

/** What Ctrl+Alt+Del brings up: a few options, a lock screen and a sign-in screen. */
export function Security({
  screen,
  onChange,
  onTasks,
  onSignOut,
}: {
  screen: SecurityScreen
  onChange: (s: SecurityScreen | null) => void
  onTasks: () => void
  onSignOut: () => void
}) {
  return (
    <motion.div
      className="absolute inset-0 z-[980] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute inset-0 scale-110 blur-xl">
        <WinWallpaper />
      </div>
      <div className="absolute inset-0 bg-black/45" />
      {screen === 'options' && <Options onChange={onChange} onTasks={onTasks} onSignOut={onSignOut} />}
      {screen === 'lock' && <Lock onUnlock={() => onChange('signin')} />}
      {screen === 'signin' && <SignIn onDone={() => onChange(null)} />}
    </motion.div>
  )
}

function Options({ onChange, onTasks, onSignOut }: { onChange: (s: SecurityScreen | null) => void; onTasks: () => void; onSignOut: () => void }) {
  const items: [string, () => void][] = [
    ['Lock', () => onChange('lock')],
    ['Sign out', onSignOut],
    ['Task list', onTasks],
  ]
  return (
    <div className="relative flex h-full flex-col items-center justify-center text-white">
      <div className="flex w-[260px] flex-col gap-1">
        {items.map(([label, fn]) => (
          <button
            key={label}
            type="button"
            onClick={fn}
            className="rounded-md px-4 py-2.5 text-left text-[17px] transition outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange(null)}
        className="absolute right-10 bottom-10 rounded-md bg-white/15 px-6 py-2 text-[13px] transition hover:bg-white/25"
      >
        Cancel
      </button>
    </div>
  )
}

function Lock({ onUnlock }: { onUnlock: () => void }) {
  const now = useNow(1000)
  useEffect(() => {
    const onKey = () => onUnlock()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onUnlock])
  return (
    <button type="button" onClick={onUnlock} className="relative flex h-full w-full flex-col items-center pt-28 text-white">
      <span className="text-[96px] leading-none font-semibold tracking-tight tabular-nums">{timeLabel(now).replace(/\s?[AP]M$/i, '')}</span>
      <span className="mt-3 text-[20px] text-white/85">{dateLabel(now, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      <span className="absolute bottom-10 text-[12px] text-white/60">Click or press any key to sign in</span>
    </button>
  )
}

function SignIn({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!busy) return
    const t = setTimeout(onDone, 900)
    return () => clearTimeout(t)
  }, [busy, onDone])
  return (
    <div className="relative flex h-full flex-col items-center justify-center text-white">
      <span className="flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-[44px] font-semibold shadow-2xl">
        G
      </span>
      <span className="mt-4 text-[22px] font-medium">Guest</span>
      {busy ? (
        <span className="mt-6 text-[13px] text-white/70">Welcome</span>
      ) : (
        <button
          type="button"
          onClick={() => setBusy(true)}
          className="mt-6 flex h-9 items-center gap-2 rounded-md bg-white/15 px-5 text-[13px] transition outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/60"
        >
          Sign in <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}
