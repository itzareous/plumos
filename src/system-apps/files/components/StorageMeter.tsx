import { useMemo } from 'react'
import { motion } from 'motion/react'
import { useFiles, rootOf } from '@/stores/files'
import { useSystem } from '@/stores/system'
import { formatBytes } from '@/lib/format'

const SEGMENTS = [
  { key: 'media', label: 'Photos', color: '#ffb057' },
  { key: 'docs', label: 'Documents', color: '#5b9dff' },
  { key: 'apps', label: 'Apps', color: '#a77bf5' },
  { key: 'other', label: 'Other', color: 'rgb(255 255 255 / 0.45)' },
] as const

type SegmentKey = (typeof SEGMENTS)[number]['key']

/** Used vs total space, split into what's taking it up. */
export function StorageMeter() {
  const storage = useSystem((s) => s.stats.storage)
  const nodes = useFiles((s) => s.nodes)

  // Proportions come from the file tree; the totals from the server.
  const shares = useMemo(() => {
    const sums: Record<SegmentKey, number> = { media: 0, docs: 0, apps: 0, other: 0 }
    for (const n of Object.values(nodes)) {
      if (n.kind === 'folder' || n.trashed) continue
      const root = rootOf(nodes, n.id)
      if (root === 'external') continue
      if (root === 'apps') sums.apps += n.size
      else if (n.kind === 'image' || n.kind === 'video') sums.media += n.size
      else if (['document', 'pdf', 'spreadsheet', 'text'].includes(n.kind)) sums.docs += n.size
      else sums.other += n.size
    }
    const total = Object.values(sums).reduce((a, b) => a + b, 0) || 1
    return SEGMENTS.map((s) => ({ ...s, share: sums[s.key] / total }))
  }, [nodes])

  const used = storage.used
  const fraction = storage.total ? Math.min(1, used / storage.total) : 0

  return (
    <div className="rounded-2xl bg-white/[0.05] p-3.5 ring-1 ring-inset ring-white/[0.07]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold text-white/90">Storage</span>
        <span className="text-[12px] text-white/50 tabular-nums">
          {formatBytes(used)} of {formatBytes(storage.total)}
        </span>
      </div>
      <div className="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-full bg-white/12" aria-hidden>
        <motion.div
          className="flex h-full"
          initial={false}
          animate={{ width: `${fraction * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        >
          {shares.map((s) => (
            <span key={s.key} className="h-full first:rounded-l-full" style={{ width: `${s.share * 100}%`, background: s.color }} />
          ))}
        </motion.div>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1">
        {shares.map((s) => (
          <span key={s.key} className="flex min-w-0 items-center gap-1.5 text-[11px] text-white/50">
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="truncate">{s.label}</span>
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] text-white/40 tabular-nums">{formatBytes(Math.max(0, storage.total - used))} available</p>
    </div>
  )
}
