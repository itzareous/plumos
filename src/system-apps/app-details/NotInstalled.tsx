import { Store } from 'lucide-react'
import type { AppInfo } from '@/apps/types'
import { AppIcon } from '@/components/icons/AppIcon'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/controls'
import { useApps } from '@/stores/apps'
import { useWindows } from '@/stores/windows'
import { appColors } from '../app-store/colors'

const phases = { downloading: 'Downloading', installing: 'Installing', starting: 'Starting up' } as const

/** Shown when the app isn't (yet) on this server. */
export function NotInstalled({ app }: { app: AppInfo }) {
  const job = useApps((s) => s.installing[app.id])
  return (
    <div className="flex flex-col items-center pt-6 text-center sm:pt-14">
      <AppIcon icon={app.icon} size={104} />
      <h1 className="mt-5 text-[26px] font-bold tracking-[-0.02em] sm:text-[30px]">{app.name}</h1>
      <p className="mt-1 max-w-[420px] text-[15px] text-white/60">{app.tagline}</p>
      {job ? (
        <div className="mt-7 w-full max-w-[320px] text-left" aria-live="polite">
          <div className="flex justify-between text-[13.5px] font-medium">
            <span>{phases[job.phase]}…</span>
            <span className="text-white/55 tabular-nums">{Math.round(job.progress * 100)}%</span>
          </div>
          <ProgressBar value={job.progress} className="mt-2 h-2" color={appColors(app).accent} />
        </div>
      ) : (
        <>
          <p className="mt-6 text-[14px] text-white/45">{app.name} isn’t installed on this server.</p>
          <Button
            variant="primary"
            size="lg"
            className="mt-4"
            icon={<Store size={17} />}
            onClick={() => useWindows.getState().open('app-store', { appId: app.id })}
          >
            View in App Store
          </Button>
        </>
      )}
    </div>
  )
}
