import { AnimatePresence, motion } from 'motion/react'
import type { AppInfo } from '@/apps/types'
import { launchApp } from '@/lib/launch'
import { cn } from '@/lib/cn'
import { useApps } from '@/stores/apps'

/** A thin circular progress indicator with a stop mark in the middle. */
export function ProgressRing({ value, size = 30, label }: { value: number; size?: number; label: string }) {
  const stroke = 3
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.round(value * 100)
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      title={`${label} ${pct}%`}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.16)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.max(0.03, value)) }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        />
      </svg>
      <span className="absolute size-[9px] rounded-[2.5px] bg-white" />
    </span>
  )
}

const fade = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { type: 'spring' as const, stiffness: 500, damping: 32 },
}

/** The Get / progress / Open control shown on every app card. */
export function GetButton({ app, className }: { app: AppInfo; className?: string }) {
  const installed = useApps((s) => s.installed.includes(app.id))
  const progress = useApps((s) => s.installing[app.id]?.progress)
  const install = useApps((s) => s.install)
  const state = progress !== undefined ? 'installing' : installed ? 'installed' : 'available'

  return (
    <span className={cn('relative inline-flex h-8 w-[68px] shrink-0 items-center justify-center', className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {state === 'installing' ? (
          <motion.span key="ring" {...fade} className="flex">
            <ProgressRing value={progress ?? 0} label={`Installing ${app.name}`} />
          </motion.span>
        ) : (
          <motion.button
            key={state}
            {...fade}
            type="button"
            aria-label={state === 'installed' ? `Open ${app.name}` : `Get ${app.name}`}
            onClick={(e) => {
              e.stopPropagation()
              if (state === 'installed') launchApp(app)
              else install(app.id)
            }}
            className={cn(
              'h-8 w-full rounded-full text-[13px] font-semibold tracking-wide outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70 active:scale-95',
              state === 'installed'
                ? 'bg-white/[0.1] text-white/90 hover:bg-white/[0.16]'
                : 'bg-white text-black hover:bg-white/90',
            )}
          >
            {state === 'installed' ? 'Open' : 'Get'}
          </motion.button>
        )}
      </AnimatePresence>
    </span>
  )
}
