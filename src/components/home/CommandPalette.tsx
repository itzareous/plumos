import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Download, Image, Search, UserRound } from 'lucide-react'
import { catalog } from '@/apps/catalog'
import { AppIcon } from '@/components/icons/AppIcon'
import { iconArt } from '@/components/icons/art'
import { sheetRegistry } from '@/system-apps/registry'
import { useApps } from '@/stores/apps'
import { useWindows, type SheetId } from '@/stores/windows'
import { launchApp } from '@/lib/launch'
import { cn } from '@/lib/cn'

interface Result {
  id: string
  group: string
  title: string
  subtitle?: string
  icon: ReactNode
  keywords?: string
  run: () => void
}

const artIcon = (art: string) => (
  <svg viewBox="0 0 100 100" className="size-8 rounded-[24%]" style={{ clipPath: 'inset(0 round 24%)' }}>
    {iconArt[art]}
  </svg>
)

/** Global search, opened with ⌘K / Ctrl+K or the Search button. */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, open } = useWindows()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(!useWindows.getState().paletteOpen)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPaletteOpen])

  return (
    <AnimatePresence>
      {paletteOpen && <Palette onClose={() => setPaletteOpen(false)} openSheet={open} />}
    </AnimatePresence>
  )
}

function Palette({ onClose, openSheet }: { onClose: () => void; openSheet: (id: SheetId, p?: Record<string, string>) => void }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const installed = useApps((s) => s.installed)
  const install = useApps((s) => s.install)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const all = useMemo<Result[]>(() => {
    const installedApps = installed
      .map((id) => catalog.find((a) => a.id === id))
      .filter((a) => a !== undefined)
      .map<Result>((app) => ({
        id: `app:${app.id}`,
        group: 'Apps',
        title: app.name,
        subtitle: app.tagline,
        icon: <AppIcon icon={app.icon} size={32} />,
        keywords: `${app.category} ${app.developer}`,
        run: () => launchApp(app),
      }))
    const system = (Object.entries(sheetRegistry) as [SheetId, (typeof sheetRegistry)[SheetId]][])
      .filter(([, e]) => e.dock)
      .map<Result>(([id, e]) => ({
        id: `sys:${id}`,
        group: 'Built-in',
        title: e.name,
        icon: artIcon(e.art),
        run: () => openSheet(id),
      }))
    const actions: Result[] = [
      {
        id: 'act:wallpaper',
        group: 'Actions',
        title: 'Change wallpaper',
        icon: <ActionIcon><Image size={16} /></ActionIcon>,
        keywords: 'background theme appearance',
        run: () => openSheet('settings', { section: 'appearance' }),
      },
      {
        id: 'act:account',
        group: 'Actions',
        title: 'Change your name',
        icon: <ActionIcon><UserRound size={16} /></ActionIcon>,
        keywords: 'account profile user',
        run: () => openSheet('settings', { section: 'account' }),
      },
    ]
    const store = catalog
      .filter((a) => !installed.includes(a.id))
      .map<Result>((app) => ({
        id: `store:${app.id}`,
        group: 'App Store',
        title: app.name,
        subtitle: app.tagline,
        icon: <AppIcon icon={app.icon} size={32} />,
        keywords: `${app.category} ${app.developer} install`,
        run: () => openSheet('app-store', { appId: app.id }),
      }))
    return [...installedApps, ...system, ...actions, ...store]
  }, [installed, openSheet])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all.filter((r) => r.group !== 'App Store').slice(0, 14)
    return all
      .map((r) => {
        const title = r.title.toLowerCase()
        const score = title.startsWith(q) ? 3 : title.includes(q) ? 2 : `${r.subtitle ?? ''} ${r.keywords ?? ''}`.toLowerCase().includes(q) ? 1 : 0
        return { r, score }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.r)
      .slice(0, 20)
  }, [all, query])

  useEffect(() => setSelected(0), [query])
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${selected}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const run = (r: Result | undefined) => {
    if (!r) return
    onClose()
    r.run()
  }

  let lastGroup = ''
  return (
    <motion.div className="fixed inset-0 z-[60] flex justify-center px-4 pt-[12vh]" onMouseDown={onClose}>
      <motion.div
        className="absolute inset-0 bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        role="dialog"
        aria-label="Search"
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -6, transition: { duration: 0.12 } }}
        transition={{ type: 'spring', stiffness: 500, damping: 36 }}
        onMouseDown={(e) => e.stopPropagation()}
        className="glass-dark relative flex h-fit max-h-[70vh] w-full max-w-[600px] flex-col overflow-hidden rounded-[22px]"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4">
          <Search size={18} className="shrink-0 text-white/50" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelected((s) => Math.min(results.length - 1, s + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelected((s) => Math.max(0, s - 1))
              } else if (e.key === 'Enter') {
                run(results[selected])
              } else if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
              }
            }}
            placeholder="Search apps, settings and the App Store"
            className="h-14 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/35"
          />
          <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-white/50">esc</kbd>
        </div>
        <div ref={listRef} className="scrollbar-thin overflow-y-auto p-2">
          {results.length === 0 && <div className="px-3 py-10 text-center text-sm text-white/45">No results for “{query}”</div>}
          {results.map((r, i) => {
            const header = r.group !== lastGroup ? r.group : null
            lastGroup = r.group
            return (
              <div key={r.id}>
                {header && <div className="px-3 pt-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-white/40 uppercase">{header}</div>}
                <button
                  type="button"
                  data-index={i}
                  onMouseMove={() => setSelected(i)}
                  onClick={() => run(r)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                    i === selected ? 'bg-white/[0.12]' : 'hover:bg-white/[0.06]',
                  )}
                >
                  <span className="shrink-0">{r.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.title}</span>
                    {r.subtitle && <span className="block truncate text-xs text-white/45">{r.subtitle}</span>}
                  </span>
                  {r.group === 'App Store' && (
                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation()
                        install(r.id.slice('store:'.length))
                        onClose()
                      }}
                      className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/20"
                    >
                      <Download size={12} /> Install
                    </span>
                  )}
                  {i === selected && r.group !== 'App Store' && <span className="text-xs text-white/40">↵</span>}
                </button>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

function ActionIcon({ children }: { children: ReactNode }) {
  return <span className="flex size-8 items-center justify-center rounded-[24%] bg-white/10 text-white/85">{children}</span>
}
