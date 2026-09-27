import { findApp } from '@/apps/catalog'
import { AppIcon } from '@/components/icons/AppIcon'
import { AppCard } from './AppCard'
import { categoryLabel, relatedApps } from './data'
import { DetailActions } from './DetailActions'
import { InfoStrip } from './InfoStrip'
import { useNav } from './nav'
import { Screenshot, screenshotKinds } from './screens'
import { Shelf } from './Shelf'
import { useIsWide } from './useMediaQuery'

export function DetailView({ appId }: { appId: string }) {
  const nav = useNav()
  const wide = useIsWide()
  const app = findApp(appId)

  if (!app) {
    return (
      <div className="pt-16 text-center">
        <h2 className="text-[20px] font-semibold">This app isn’t in the store</h2>
        <p className="mt-1.5 text-white/50">It may have been renamed or removed.</p>
      </div>
    )
  }

  const actions = <DetailActions app={app} />

  return (
    <article className="relative">
      <header className="relative flex items-center gap-5 sm:items-start sm:gap-8">
        <AppIcon icon={app.icon} size={wide ? 136 : 92} />
        <div className="min-w-0 flex-1 sm:pt-1.5">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[26px] leading-tight font-bold tracking-[-0.025em] sm:text-[38px]">{app.name}</h2>
            {app.isNew && (
              <span className="shrink-0 rounded-full bg-white/12 px-2 py-0.5 text-[10.5px] font-bold tracking-wider text-white/85 uppercase">
                New
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[15px] text-white/65 sm:mt-1 sm:text-[18px]">{app.tagline}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-white/45 sm:mt-2">
            <span>{app.developer}</span>
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={() => nav.go({ view: 'category', category: app.category })}
              className="rounded text-white/60 underline-offset-2 outline-none hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {categoryLabel(app.category)}
            </button>
          </p>
          {wide && <div className="mt-6">{actions}</div>}
        </div>
      </header>
      {!wide && <div className="relative mt-5">{actions}</div>}

      <div className="relative mt-8">
        <InfoStrip app={app} />
      </div>

      <div className="mt-9">
        <Shelf title="Screenshots" itemWidth="min(80vw, 460px)">
          {screenshotKinds(app).map((kind, i) => (
            <div
              key={kind}
              className="aspect-[16/10] overflow-hidden rounded-[18px] shadow-[0_18px_40px_-18px_rgb(0_0_0/0.7)] ring-1 ring-white/10"
            >
              <Screenshot app={app} kind={kind} index={i} />
            </div>
          ))}
        </Shelf>
      </div>

      <section className="mt-9 max-w-[760px]">
        <h2 className="mb-2.5 text-[20px] font-bold tracking-[-0.02em] sm:text-[22px]">About</h2>
        <p className="selectable text-[15px] leading-relaxed text-white/75">{app.description}</p>
        {app.keywords && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {app.keywords.map((k) => (
              <span key={k} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-white/60 ring-1 ring-inset ring-white/[0.06]">
                {k}
              </span>
            ))}
          </div>
        )}
      </section>

      <Shelf title="You might also like" rows={2}>
        {relatedApps(app).map((a) => (
          <AppCard key={a.id} app={a} />
        ))}
      </Shelf>
    </article>
  )
}
