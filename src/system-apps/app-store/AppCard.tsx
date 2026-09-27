import type { AppInfo } from '@/apps/types'
import { AppIcon } from '@/components/icons/AppIcon'
import { cn } from '@/lib/cn'
import { appColors, withAlpha } from './colors'
import { GetButton } from './GetButton'
import { useNav } from './nav'
import { Screenshot, screenshotKinds } from './screens'

/** Invisible full-size button that opens the app's page; content sits on top with pointer-events off. */
function CardLink({ app, className }: { app: AppInfo; className?: string }) {
  const nav = useNav()
  return (
    <button
      type="button"
      aria-label={`${app.name}: ${app.tagline}`}
      onClick={() => nav.go({ view: 'app', appId: app.id })}
      className={cn('absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-white/60', className)}
    />
  )
}

/** Compact card: icon, name, tagline and a Get / Open button. */
export function AppCard({ app, className }: { app: AppInfo; className?: string }) {
  return (
    <div
      className={cn(
        'group relative flex min-w-0 items-center gap-3.5 rounded-[20px] bg-white/[0.045] p-3 ring-1 ring-inset ring-white/[0.06] transition-colors hover:bg-white/[0.075]',
        className,
      )}
    >
      <CardLink app={app} className="rounded-[20px]" />
      <AppIcon icon={app.icon} size={58} className="pointer-events-none" />
      <div className="pointer-events-none min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold tracking-[-0.01em]">{app.name}</div>
        <div className="mt-0.5 line-clamp-2 text-[13px] leading-[1.35] text-white/55">{app.tagline}</div>
      </div>
      <GetButton app={app} className="relative z-[1]" />
    </div>
  )
}

/** Borderless row for full lists (category pages and search results). */
export function AppListItem({ app }: { app: AppInfo }) {
  return (
    <div className="group relative flex min-w-0 items-center gap-3.5 rounded-2xl px-2 py-3 transition-colors hover:bg-white/[0.045]">
      <CardLink app={app} className="rounded-2xl" />
      <AppIcon icon={app.icon} size={60} className="pointer-events-none" />
      <div className="pointer-events-none min-w-0 flex-1 self-stretch border-b border-white/[0.07] pb-3 group-last:border-transparent sm:border-transparent sm:pb-0">
        <div className="flex h-full items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[15px] font-semibold tracking-[-0.01em]">{app.name}</span>
              {app.isNew && (
                <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-px text-[10px] font-bold tracking-wide text-white/75 uppercase">
                  New
                </span>
              )}
            </div>
            <div className="mt-0.5 line-clamp-2 text-[13px] leading-[1.35] text-white/55">{app.tagline}</div>
          </div>
        </div>
      </div>
      <GetButton app={app} className="relative z-[1]" />
    </div>
  )
}

/** Large card with a screenshot peek, used for the "New & noteworthy" shelf. */
export function FeatureCard({ app }: { app: AppInfo }) {
  const c = appColors(app)
  const kind = screenshotKinds(app)[0]
  return (
    <div
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/[0.08] transition-transform duration-300 ease-[var(--ease-spring)] hover:-translate-y-0.5"
      style={{ background: `linear-gradient(180deg, ${withAlpha(c.to, 0.32)}, rgb(255 255 255 / 0.04) 70%)` }}
    >
      <CardLink app={app} className="z-[2] rounded-[22px]" />
      <div className="pointer-events-none relative aspect-[16/9] overflow-hidden">
        <div className="absolute inset-x-4 top-4 -bottom-6 overflow-hidden rounded-t-xl shadow-[0_12px_40px_-8px_rgb(0_0_0/0.6)] ring-1 ring-white/10 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-1">
          <Screenshot app={app} kind={kind} />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[rgb(20_20_28/0.9)] to-transparent" />
      </div>
      <div className="pointer-events-none flex items-center gap-3 bg-[rgb(20_20_28/0.9)] px-4 pt-1 pb-4">
        <AppIcon icon={app.icon} size={48} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">{app.name}</div>
          <div className="truncate text-[12.5px] text-white/50">{app.tagline}</div>
        </div>
        <GetButton app={app} className="pointer-events-auto relative z-[3]" />
      </div>
    </div>
  )
}
