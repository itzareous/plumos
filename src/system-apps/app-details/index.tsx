import { ChevronRight, ExternalLink, SearchX, SquareTerminal, Store } from 'lucide-react'
import { findApp } from '@/apps/catalog'
import type { AppInfo } from '@/apps/types'
import { AppIcon } from '@/components/icons/AppIcon'
import { Button } from '@/components/ui/Button'
import { Card, Row } from '@/components/ui/controls'
import { launchApp } from '@/lib/launch'
import { useApps } from '@/stores/apps'
import { useWindows } from '@/stores/windows'
import { appColors, withAlpha } from '../app-store/colors'
import { useIsWide } from '../app-store/useMediaQuery'
import type { SheetProps } from '../registry'
import { AboutCard } from './AboutCard'
import { LinkEditor } from './LinkEditor'
import { NotInstalled } from './NotInstalled'
import { UninstallCard } from './UninstallCard'
import { VmResources } from './VmResources'

export default function AppDetails({ params }: SheetProps) {
  const app = params.appId ? findApp(params.appId) : undefined
  const installed = useApps((s) => (app ? s.installed.includes(app.id) : false))

  if (!app) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-[20px] bg-white/[0.06] text-white/50">
          <SearchX size={28} />
        </span>
        <h1 className="mt-5 text-[22px] font-semibold">App not found</h1>
        <p className="mt-1.5 text-white/50">There’s no app called “{params.appId ?? ''}” on this server.</p>
      </div>
    )
  }

  const c = appColors(app)
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px]"
        style={{
          background: `radial-gradient(50% 70% at 50% 0%, ${withAlpha(c.accent, 0.2)}, transparent 70%)`,
        }}
      />
      <div className="scrollbar-thin relative min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-28 sm:px-10 sm:pt-10 sm:pb-12">
        <div className="mx-auto max-w-[640px]">
          {installed ? <Installed app={app} editLink={params.edit === 'link'} /> : <NotInstalled app={app} />}
        </div>
      </div>
    </div>
  )
}

function Installed({ app, editLink }: { app: AppInfo; editLink: boolean }) {
  const wide = useIsWide()
  const isVm = app.kind === 'vm'
  const openButton = (
    <Button
      variant="primary"
      size="lg"
      icon={isVm ? <SquareTerminal size={17} /> : <ExternalLink size={17} />}
      onClick={() => (isVm ? useWindows.getState().open('vm', { appId: app.id }) : launchApp(app))}
      className={wide ? undefined : 'w-full'}
    >
      {isVm ? 'Open console' : 'Open'}
    </Button>
  )

  return (
    <div className="flex flex-col gap-7">
      <div>
        <header className="flex items-center gap-4 pr-12 sm:gap-5 sm:pr-14">
          <AppIcon icon={app.icon} size={wide ? 84 : 68} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[24px] leading-tight font-bold tracking-[-0.02em] sm:text-[30px]">{app.name}</h1>
            <p className="mt-0.5 line-clamp-2 text-[14px] text-white/55 sm:text-[15px]">{app.tagline}</p>
          </div>
          {wide && openButton}
        </header>
        {!wide && <div className="mt-4">{openButton}</div>}
      </div>

      {isVm ? <VmResources app={app} /> : <LinkEditor app={app} autoFocus={editLink} />}
      <AboutCard app={app} />

      <section className="flex flex-col gap-3">
        <Card>
          <Row
            icon={<Store size={16} />}
            title="View in App Store"
            description="Screenshots, description and similar apps"
            onClick={() => useWindows.getState().open('app-store', { appId: app.id })}
          >
            <ChevronRight size={17} className="text-white/35" />
          </Row>
        </Card>
        <UninstallCard app={app} />
      </section>
    </div>
  )
}
