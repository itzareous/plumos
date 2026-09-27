import { useMemo, useRef, useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Power, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { AppGlyph, GLYPHS, type GuestApp } from '../apps/glyphs'
import { FsIcon } from '../apps/Files'
import { nodeAt } from '../apps/fsData'
import { TASKBAR_H } from './Taskbar'

const PINNED: GuestApp[] = ['notes', 'browser', 'files', 'calc', 'settings', 'tasks']
const RECENT = ['Desktop/Welcome.txt', 'Documents/Taxes 2025/receipts.txt', 'Documents/Budget 2026.txt', 'Downloads/meeting-notes.txt']
const RECENT_WHEN = ['Yesterday', 'Sep 12', 'Sep 18', '2 days ago']

/** The start launcher: search, pinned apps, recent files and the power button. */
export function Launcher({
  focusSearch,
  onOpenApp,
  onOpenFile,
  onClose,
  onShutdown,
}: {
  focusSearch: boolean
  onOpenApp: (app: GuestApp) => void
  onOpenFile: (path: string) => void
  onClose: () => void
  onShutdown: () => void
}) {
  const [q, setQ] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (focusSearch) input.current?.focus({ preventScroll: true })
  }, [focusSearch])

  const query = q.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!query) return null
    const apps = (Object.keys(GLYPHS) as GuestApp[])
      .filter((a) => PINNED.includes(a) && GLYPHS[a].label.toLowerCase().includes(query))
      .map((a) => ({ kind: 'app' as const, app: a }))
    const files = RECENT.filter((p) => p.toLowerCase().includes(query)).map((p) => ({ kind: 'file' as const, path: p }))
    return [...apps, ...files]
  }, [query])

  const openMatch = (m: NonNullable<typeof matches>[number]) => (m.kind === 'app' ? onOpenApp(m.app) : onOpenFile(m.path))

  return (
    <motion.div
      role="menu"
      aria-label="Launcher"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
      className="absolute left-1/2 z-[950] flex w-[560px] -translate-x-1/2 flex-col overflow-hidden rounded-xl bg-[#1d2029]/85 text-white shadow-[0_24px_70px_-10px_rgb(0_0_0/0.7),0_0_0_1px_rgb(255_255_255/0.09)] backdrop-blur-2xl"
      style={{ bottom: TASKBAR_H + 10 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="px-6 pt-6">
        <label className="flex h-9 items-center gap-2.5 rounded-full bg-black/30 px-4 ring-1 ring-white/[0.08] focus-within:ring-2 focus-within:ring-sky-400/60">
          <Search size={14} className="text-white/50" />
          <input
            ref={input}
            data-agent="launcher.search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches?.[0]) openMatch(matches[0])
            }}
            placeholder="Search apps and files"
            aria-label="Search apps and files"
            className="h-full flex-1 bg-transparent text-[13px] outline-none placeholder:text-white/40"
          />
        </label>
      </div>

      {matches ? (
        <div className="min-h-[248px] px-4 py-4">
          <p className="px-2 pb-2 text-[12px] font-semibold text-white/80">Results</p>
          {matches.map((m) => (
            <button
              key={m.kind === 'app' ? m.app : m.path}
              type="button"
              onClick={() => openMatch(m)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-[13px] transition hover:bg-white/[0.07]"
            >
              {m.kind === 'app' ? <AppGlyph app={m.app} size={26} /> : <FsIcon node={nodeAt(m.path)!} size={26} />}
              {m.kind === 'app' ? GLYPHS[m.app].label : m.path.split('/').pop()}
            </button>
          ))}
          {!matches.length && <p className="px-2 py-6 text-[13px] text-white/45">Nothing matches “{q}”.</p>}
        </div>
      ) : (
        <>
          <Section title="Pinned">
            <div className="grid grid-cols-6 gap-1">
              {PINNED.map((app) => (
                <button
                  key={app}
                  type="button"
                  data-agent={`launch.${app}`}
                  onClick={() => onOpenApp(app)}
                  className="flex flex-col items-center gap-2 rounded-md px-1 py-3 text-[11.5px] text-white/85 transition outline-none hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  <AppGlyph app={app} size={34} />
                  {GLYPHS[app].label}
                </button>
              ))}
            </div>
          </Section>
          <Section title="Recent">
            <div className="grid grid-cols-2 gap-1">
              {RECENT.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onOpenFile(p)}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-left transition outline-none hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  <FsIcon node={nodeAt(p)!} size={30} />
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] text-white/90">{p.split('/').pop()}</span>
                    <span className="block text-[11px] text-white/45">{RECENT_WHEN[i]}</span>
                  </span>
                </button>
              ))}
            </div>
          </Section>
        </>
      )}

      <div className="mt-2 flex h-14 items-center justify-between border-t border-white/[0.07] bg-black/20 px-8">
        <span className="flex items-center gap-2.5 text-[12.5px] text-white/85">
          <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-[11px] font-semibold">
            G
          </span>
          Guest
        </span>
        <button
          type="button"
          aria-label="Shut down"
          title="Shut down"
          onClick={() => {
            onClose()
            onShutdown()
          }}
          className={cn('flex size-8 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10')}
        >
          <Power size={15} />
        </button>
      </div>
    </motion.div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 pt-5">
      <p className="px-2 pb-2 text-[12px] font-semibold text-white/80">{title}</p>
      {children}
    </div>
  )
}
