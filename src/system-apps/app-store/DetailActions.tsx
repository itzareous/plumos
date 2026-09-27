import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Download, Settings2, Trash2 } from 'lucide-react'
import type { AppInfo } from '@/apps/types'
import { AppIcon } from '@/components/icons/AppIcon'
import { Button, IconButton } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/controls'
import { formatBytes } from '@/lib/format'
import { launchApp } from '@/lib/launch'
import { useApps } from '@/stores/apps'
import { toast } from '@/stores/toasts'
import { useWindows } from '@/stores/windows'
import { appColors } from './colors'

const phaseText = {
  downloading: 'Downloading',
  installing: 'Installing',
  starting: 'Starting up',
} as const

function InstallProgress({ app, progress, phase }: { app: AppInfo; progress: number; phase: keyof typeof phaseText }) {
  const size = app.size ?? 0.5e9
  const detail =
    phase === 'downloading'
      ? `${formatBytes(size * progress)} of ${formatBytes(size)}`
      : phase === 'installing'
        ? 'Setting up storage and permissions'
        : `Opening ${app.name} for the first time`
  return (
    <div className="w-full max-w-[380px]" aria-live="polite">
      <div className="flex items-baseline justify-between text-[14px] font-medium">
        <span>{phaseText[phase]}…</span>
        <span className="text-white/60 tabular-nums">{Math.round(progress * 100)}%</span>
      </div>
      <ProgressBar value={progress} className="mt-2 h-2" color={appColors(app).accent} />
      <div className="mt-1.5 text-[12.5px] text-white/45 tabular-nums">{detail}</div>
    </div>
  )
}

/** Install / Open / Uninstall controls on an app's page. */
export function DetailActions({ app }: { app: AppInfo }) {
  const installed = useApps((s) => s.installed.includes(app.id))
  const job = useApps((s) => s.installing[app.id])
  const install = useApps((s) => s.install)
  const uninstall = useApps((s) => s.uninstall)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => setConfirming(false), [installed, app.id])

  // Escape backs out of the confirmation instead of closing the sheet.
  useEffect(() => {
    if (!confirming) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setConfirming(false)
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [confirming])

  const state = job ? 'installing' : installed ? (confirming ? 'confirm' : 'installed') : 'available'

  return (
    <div className="min-h-[52px]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="flex flex-wrap items-center gap-2.5"
        >
          {state === 'installing' && job && <InstallProgress app={app} progress={job.progress} phase={job.phase} />}
          {state === 'available' && (
            <>
              <Button variant="primary" size="lg" icon={<Download size={17} />} onClick={() => install(app.id)} className="min-w-[140px]">
                Install
              </Button>
              {app.size && <span className="text-[13px] text-white/45 tabular-nums">{formatBytes(app.size)} download</span>}
            </>
          )}
          {state === 'installed' && (
            <>
              <Button variant="primary" size="lg" onClick={() => launchApp(app)} className="min-w-[140px]">
                Open
              </Button>
              <Button variant="secondary" size="lg" icon={<Trash2 size={16} />} onClick={() => setConfirming(true)}>
                Uninstall
              </Button>
              <IconButton
                label={app.kind === 'vm' ? 'Machine settings' : 'Link and settings'}
                onClick={() => useWindows.getState().open('app-details', { appId: app.id })}
                className="size-12 bg-white/[0.07] ring-1 ring-inset ring-white/10"
              >
                <Settings2 size={18} />
              </IconButton>
            </>
          )}
          {state === 'confirm' && (
            <div className="flex w-full max-w-[460px] flex-wrap items-center gap-3 rounded-2xl bg-red-500/[0.09] p-3 pl-4 ring-1 ring-inset ring-red-400/25">
              <p className="min-w-[180px] flex-1 text-[13.5px] leading-snug text-white/80">
                Uninstall <b className="font-semibold text-white">{app.name}</b>? Its data on this server is removed too.
              </p>
              <div className="flex gap-2">
                <Button size="md" variant="ghost" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
                <Button
                  size="md"
                  variant="danger"
                  autoFocus
                  onClick={() => {
                    uninstall(app.id)
                    toast(`${app.name} was uninstalled`, { icon: <AppIcon icon={app.icon} size={36} /> })
                  }}
                >
                  Uninstall
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
