import { ChevronRight } from 'lucide-react'
import { catalog } from '@/apps/catalog'
import { AppCard, FeatureCard } from './AppCard'
import { CategoryPills } from './CategoryPills'
import { appsInCategory, categoryLabel, categoryMeta, categoryOrder, collections, homeShelves } from './data'
import { Hero } from './Hero'
import { useNav } from './nav'
import { SeeAll, Shelf } from './Shelf'

export function HomeView() {
  const nav = useNav()
  const fresh = collections.new
  return (
    <div>
      <Hero />
      <CategoryPills className="mt-6" />

      <div className="mt-8">
        <Shelf
          title={fresh.title}
          subtitle={fresh.subtitle}
          itemWidth="min(80vw, 320px)"
          action={<SeeAll onClick={() => nav.go({ view: 'collection', id: fresh.id })} />}
        >
          {fresh.apps.map((app) => (
            <FeatureCard key={app.id} app={app} />
          ))}
        </Shelf>

        {homeShelves.map((id) => {
          const col = collections[id]
          const cat = col.category
          return (
            <Shelf
              key={id}
              title={col.title}
              subtitle={col.subtitle}
              rows={2}
              action={
                <SeeAll onClick={() => nav.go(cat ? { view: 'category', category: cat } : { view: 'collection', id })} />
              }
            >
              {col.apps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </Shelf>
          )
        })}
      </div>

      <section className="mt-10">
        <h2 className="mb-3.5 text-[20px] font-bold tracking-[-0.02em] sm:text-[22px]">Browse by category</h2>
        <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categoryOrder.map((c) => {
            const meta = categoryMeta[c]
            return (
              <button
                key={c}
                type="button"
                onClick={() => nav.go({ view: 'category', category: c })}
                className="group flex items-center gap-3 rounded-[18px] bg-white/[0.045] p-3 text-left ring-1 ring-inset ring-white/[0.06] transition outline-none hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-[12px] text-white shadow-[0_6px_16px_-6px_rgb(0_0_0/0.5)]"
                  style={{ background: meta.tint }}
                >
                  <meta.icon size={19} strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold">{categoryLabel(c)}</span>
                  <span className="block text-[12.5px] text-white/45 tabular-nums">
                    {appsInCategory(c).length} apps
                  </span>
                </span>
                <ChevronRight size={17} className="text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/60" />
              </button>
            )
          })}
        </div>
        <p className="mt-8 text-center text-[12.5px] text-white/35 tabular-nums">
          {catalog.length} apps · all open source or free to self-host
        </p>
      </section>
    </div>
  )
}
