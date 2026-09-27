import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Check, ChevronDown, X } from 'lucide-react'
import { ProgressBar } from '@/components/ui/controls'
import { displayName, useFiles, useTransfers, type UploadItem } from '@/stores/files'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import { FileIcon } from './FileIcon'

const MAX_ROWS = 60

function eta(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  if (seconds < 5) return 'a few seconds left'
  if (seconds < 60) return `about ${Math.ceil(seconds / 5) * 5} s left`
  return `about ${Math.ceil(seconds / 60)} min left`
}

/** Bottom-right panel with per-file upload progress. */
export function UploadTray({ onShow }: { onShow: (folderId: string) => void }) {
  const uploads = useTransfers((s) => s.uploads)
  const lastTarget = useTransfers((s) => s.lastTarget)
  const clear = useTransfers((s) => s.clearFinished)
  const target = useFiles((s) => (lastTarget ? s.nodes[lastTarget] : undefined))
  const [collapsed, setCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)

  const totals = useMemo(() => {
    const size = uploads.reduce((a, u) => a + u.size, 0)
    const loaded = uploads.reduce((a, u) => a + u.loaded, 0)
    const active = uploads.filter((u) => u.status === 'uploading')
    const rate = active.reduce((a, u) => a + u.rate, 0)
    // One home network link, shared by everything in flight.
    const speed = Math.min(active.reduce((a, u) => a + u.speed, 0), 112e6 + (loaded % 7) * 1e6)
    const done = uploads.filter((u) => u.status === 'done').length
    return { size, loaded, rate, speed, done, finished: uploads.length > 0 && done === uploads.length }
  }, [uploads])

  // Tidy up a little while after everything finishes.
  useEffect(() => {
    if (!totals.finished || hovered) return
    const t = setTimeout(clear, 6000)
    return () => clearTimeout(t)
  }, [totals.finished, hovered, clear])

  const rows = useMemo(() => {
    const order = { uploading: 0, queued: 1, done: 2 } as const
    return [...uploads].sort((a, b) => order[a.status] - order[b.status]).slice(0, MAX_ROWS)
  }, [uploads])

  const where = target ? displayName(target) : ''
  const count = `${uploads.length.toLocaleString()} ${uploads.length === 1 ? 'item' : 'items'}`
  const title = totals.finished ? `Uploaded ${count}` : `Uploading ${count}`
  const subtitle = totals.finished
    ? `to ${where}`
    : [
        `${totals.done.toLocaleString()} of ${uploads.length.toLocaleString()} done`,
        totals.speed ? `${formatBytes(totals.speed)}/s` : '',
        eta((totals.size - totals.loaded) / (totals.rate || 1)),
      ]
        .filter(Boolean)
        .join(' · ')

  return (
    <AnimatePresence>
      {uploads.length > 0 && (
        <motion.section
          key="tray"
          aria-label="Uploads"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96, transition: { duration: 0.2 } }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="glass-dark absolute right-3 bottom-[92px] left-3 z-20 overflow-hidden rounded-[22px] sm:right-5 sm:bottom-[100px] sm:left-auto sm:w-[360px]"
        >
          <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-full',
                totals.finished ? 'bg-emerald-400/20 text-emerald-300' : 'bg-accent-soft text-accent',
              )}
            >
              {totals.finished ? <Check size={18} strokeWidth={2.6} /> : <ArrowUp size={18} strokeWidth={2.4} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold tabular-nums">{title}</p>
              <p className="truncate text-[12px] text-white/50 tabular-nums">{subtitle}</p>
            </div>
            {totals.finished && lastTarget && (
              <button
                type="button"
                onClick={() => onShow(lastTarget)}
                className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white/90 transition outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Show
              </button>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Show uploads' : 'Hide upload list'}
              aria-expanded={!collapsed}
              className="flex size-7 items-center justify-center rounded-full text-white/60 transition outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ChevronDown size={17} className={cn('transition-transform duration-300', collapsed && 'rotate-180')} />
            </button>
            {totals.finished && (
              <button
                type="button"
                onClick={clear}
                aria-label="Dismiss"
                className="flex size-7 items-center justify-center rounded-full text-white/60 transition outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="px-4 pb-3">
            <ProgressBar
              value={totals.loaded / (totals.size || 1)}
              color={totals.finished ? '#34d399' : 'var(--color-accent)'}
            />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 38 }}
                className="scrollbar-thin max-h-[236px] overflow-y-auto border-t border-white/[0.07] px-2 py-1.5"
              >
                {rows.map((u) => (
                  <UploadRow key={u.id} item={u} />
                ))}
                {uploads.length > MAX_ROWS && (
                  <li className="px-2 py-2 text-[12px] text-white/40">and {(uploads.length - MAX_ROWS).toLocaleString()} more…</li>
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

function UploadRow({ item }: { item: UploadItem }) {
  const pct = item.size ? item.loaded / item.size : 1
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-2">
      <span className="flex size-8 shrink-0 items-center justify-center">
        <FileIcon kind={item.kind} name={item.name} size={30} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-medium text-white/90">{item.name}</span>
          <span className="shrink-0 text-[11px] text-white/45 tabular-nums">
            {item.status === 'done' ? formatBytes(item.size) : item.status === 'queued' ? 'Waiting' : `${Math.round(pct * 100)}%`}
          </span>
        </div>
        {item.status !== 'done' ? (
          <ProgressBar value={pct} className="mt-1.5 h-1 bg-white/10" color={item.status === 'queued' ? 'rgb(255 255 255 / 0.2)' : 'white'} />
        ) : (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-300/90">
            <Check size={11} strokeWidth={3} /> Uploaded
          </p>
        )}
      </div>
    </li>
  )
}
