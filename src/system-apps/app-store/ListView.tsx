import { SearchX, Sparkles } from 'lucide-react'
import type { AppCategory, AppInfo } from '@/apps/types'
import { AppListItem } from './AppCard'
import { CategoryPills } from './CategoryPills'
import { appsInCategory, categoryLabel, categoryMeta, collections } from './data'

function AppGrid({ apps }: { apps: AppInfo[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
      {apps.map((app) => (
        <AppListItem key={app.id} app={app} />
      ))}
    </div>
  )
}

export function CategoryView({ category }: { category: AppCategory }) {
  const meta = categoryMeta[category]
  const apps = appsInCategory(category)
  return (
    <div>
      <CategoryPills active={category} />
      <header className="mt-6 mb-4 flex items-center gap-4">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-[17px] text-white shadow-[0_10px_30px_-10px_rgb(0_0_0/0.6)]"
          style={{ background: meta.tint }}
        >
          <meta.icon size={26} strokeWidth={2.1} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[24px] leading-tight font-bold tracking-[-0.02em] sm:text-[28px]">{categoryLabel(category)}</h2>
          <p className="mt-0.5 text-[14px] text-white/55">
            {meta.blurb} <span className="text-white/35 tabular-nums">· {apps.length} apps</span>
          </p>
        </div>
      </header>
      <AppGrid apps={apps} />
    </div>
  )
}

export function CollectionView({ id }: { id: string }) {
  const col = collections[id]
  if (!col) return null
  return (
    <div>
      <header className="mb-4 flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-[17px] bg-[linear-gradient(150deg,#f0abfc,#6366f1)] text-white shadow-[0_10px_30px_-10px_rgb(0_0_0/0.6)]">
          <Sparkles size={26} strokeWidth={2.1} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[24px] leading-tight font-bold tracking-[-0.02em] sm:text-[28px]">{col.title}</h2>
          <p className="mt-0.5 text-[14px] text-white/55">
            {col.subtitle} <span className="text-white/35 tabular-nums">· {col.apps.length} apps</span>
          </p>
        </div>
      </header>
      <AppGrid apps={col.apps} />
    </div>
  )
}

export function SearchView({ query, results }: { query: string; results: AppInfo[] }) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center pt-10 text-center sm:pt-16">
        <span className="flex size-16 items-center justify-center rounded-[20px] bg-white/[0.06] text-white/50 ring-1 ring-inset ring-white/[0.08]">
          <SearchX size={28} />
        </span>
        <h2 className="mt-5 text-[20px] font-semibold tracking-[-0.01em]">No apps match “{query.trim()}”</h2>
        <p className="mt-1.5 max-w-[340px] text-[14px] text-white/50">
          Check the spelling, try something broader like “photos” or “vpn”, or browse a category.
        </p>
        <CategoryPills wrap className="mt-6 max-w-[720px]" />
      </div>
    )
  }
  return (
    <div>
      <p className="mb-3 px-1 text-[13px] font-medium text-white/50 tabular-nums">
        {results.length} {results.length === 1 ? 'result' : 'results'} for “{query.trim()}”
      </p>
      <AppGrid apps={results} />
    </div>
  )
}
