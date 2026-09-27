import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, Search, X } from 'lucide-react'
import { findApp } from '@/apps/catalog'
import type { AppCategory, AppInfo } from '@/apps/types'
import { categoryLabels } from '@/apps/types'
import { Input } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import type { SheetProps } from '../registry'
import { appColors, withAlpha } from './colors'
import { collections, searchApps } from './data'
import { DetailView } from './DetailView'
import { HomeView } from './HomeView'
import { CategoryView, CollectionView, SearchView } from './ListView'
import { NavContext, routeKey, type Nav, type Route } from './nav'
import { useInstallToasts } from './useInstallToasts'

type Entry = Route & { scroll?: number }

function initialStack(params: Record<string, string>): Entry[] {
  const home: Entry = { view: 'home' }
  if (params.appId && findApp(params.appId)) return [home, { view: 'app', appId: params.appId }]
  if (params.category && params.category in categoryLabels) {
    return [home, { view: 'category', category: params.category as AppCategory }]
  }
  return [home]
}

export default function AppStore({ params }: SheetProps) {
  const [stack, setStack] = useState<Entry[]>(() => initialStack(params))
  const [direction, setDirection] = useState(1)
  const [query, setQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  useInstallToasts()

  const current = stack[stack.length - 1]
  const searching = query.trim().length > 0
  const results = useMemo(() => searchApps(query), [query])

  const saveScroll = (s: Entry[]) => {
    const top = scroller.current?.scrollTop ?? 0
    return s.map((e, i) => (i === s.length - 1 ? { ...e, scroll: top } : e))
  }

  const nav = useMemo<Nav>(
    () => ({
      go: (route) => {
        setQuery('')
        setDirection(1)
        setStack((s) => {
          const top = s[s.length - 1]
          if (routeKey(top) === routeKey(route)) return s
          return [...saveScroll(s), route]
        })
      },
      back: () => {
        setDirection(-1)
        setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
      },
      home: () => {
        setQuery('')
        setDirection(-1)
        setStack((s) => [s[0]])
      },
    }),
    [],
  )

  // Restore the scroll position when returning to a page; start new pages at the top.
  const pageKey = searching ? 'search' : routeKey(current)
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollTop = searching ? 0 : (current.scroll ?? 0)
  }, [pageKey])

  // "/" jumps to search, like most catalogues on the web.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const canGoBack = stack.length > 1 && !searching
  const glowApp = !searching && current.view === 'app' ? findApp(current.appId) : undefined
  const backLabel = useBackLabel(stack)

  const page = searching ? (
    <SearchView query={query} results={results} />
  ) : current.view === 'app' ? (
    <DetailView appId={current.appId} />
  ) : current.view === 'category' ? (
    <CategoryView category={current.category} />
  ) : current.view === 'collection' ? (
    <CollectionView id={current.id} />
  ) : (
    <HomeView />
  )

  return (
    <NavContext.Provider value={nav}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <AnimatePresence>
          {glowApp && <AppGlow key={glowApp.id} app={glowApp} />}
        </AnimatePresence>
        <header
          className={cn(
            'relative z-10 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 px-5 pt-5 pb-4 sm:pt-8 sm:pr-20 sm:pb-5 sm:pl-10',
            'after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/[0.08] after:transition-opacity after:duration-300',
            scrolled ? 'after:opacity-100' : 'after:opacity-0',
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5 pr-12 sm:pr-0">
            <AnimatePresence initial={false}>
              {canGoBack && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, width: 0, marginRight: -6 }}
                  animate={{ opacity: 1, width: 'auto', marginRight: 0 }}
                  exit={{ opacity: 0, width: 0, marginRight: -6 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  onClick={nav.back}
                  aria-label={`Back to ${backLabel}`}
                  title={`Back to ${backLabel}`}
                  className="-ml-2 flex h-9 shrink-0 items-center overflow-hidden rounded-full pr-1 text-white/80 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <ChevronLeft size={26} strokeWidth={2.2} />
                </motion.button>
              )}
            </AnimatePresence>
            <h1 className="truncate text-[26px] leading-tight font-bold tracking-[-0.025em] sm:text-[32px]">
              <button
                type="button"
                onClick={nav.home}
                className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                App Store
              </button>
            </h1>
          </div>
          <div className="relative w-full sm:w-[300px]">
            <Input
              ref={searchRef}
              icon={<Search size={16} />}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && query) {
                  e.preventDefault()
                  setQuery('')
                }
              }}
              placeholder="Search apps"
              aria-label="Search apps"
              className="[&_input]:rounded-full [&_input]:pr-9 [&_input::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery('')
                  searchRef.current?.focus()
                }}
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white/80 outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <X size={13} strokeWidth={2.6} />
              </button>
            )}
          </div>
        </header>
        <div
          ref={scroller}
          data-store-scroller
          onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
          className="scrollbar-thin relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pb-28 sm:px-10 sm:pb-12"
        >
          <motion.div
            key={pageKey}
            initial={{ opacity: 0, x: searching ? 0 : direction * 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, opacity: { duration: 0.2 } }}
          >
            {page}
          </motion.div>
        </div>
      </div>
    </NavContext.Provider>
  )
}

/** A soft wash of the app's colours behind its page. */
function AppGlow({ app }: { app: AppInfo }) {
  const c = appColors(app)
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
      style={{
        background: `radial-gradient(55% 75% at 10% 12%, ${withAlpha(c.accent, 0.2)}, transparent 70%), radial-gradient(45% 60% at 55% 0%, ${withAlpha(c.to, 0.16)}, transparent 70%)`,
      }}
    />
  )
}

function useBackLabel(stack: Entry[]) {
  const prev = stack[stack.length - 2]
  if (!prev) return 'App Store'
  if (prev.view === 'category') return categoryLabels[prev.category]
  if (prev.view === 'collection') return collections[prev.id]?.title ?? 'App Store'
  if (prev.view === 'app') return findApp(prev.appId)?.name ?? 'App Store'
  return 'App Store'
}
