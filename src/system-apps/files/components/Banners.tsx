import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleCheck, Eject, HardDriveDownload, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/controls'
import { descendants, useFiles, useTransfers } from '@/stores/files'
import type { Drive } from '@/stores/storage'
import { formatBytes } from '@/lib/format'
import { driveFolderId } from '../lib/seed'
import { DriveArt } from './Thumb'

const spring = { type: 'spring', stiffness: 380, damping: 34 } as const

/** "Import everything from this drive", with live progress. */
export function DriveBanner({
  drive,
  userName,
  onShow,
  onEject,
}: {
  drive: Drive
  userName: string
  onShow: (folderId: string) => void
  onEject: () => void
}) {
  const nodes = useFiles((s) => s.nodes)
  const job = useTransfers((s) => s.imports[drive.id])
  const importDrive = useTransfers((s) => s.importDrive)
  const cancel = useTransfers((s) => s.cancelImport)

  const summary = useMemo(() => {
    const files = descendants(nodes, driveFolderId(drive.id)).filter((n) => n.kind !== 'folder')
    const media = files.filter((n) => n.kind === 'image' || n.kind === 'video').length
    return { count: files.length, media, bytes: files.reduce((a, n) => a + n.size, 0) }
  }, [nodes, drive.id])

  const state = job?.status === 'copying' ? 'copying' : job?.status === 'done' ? 'done' : 'idle'

  return (
    <motion.section
      layout
      transition={spring}
      aria-label={`Import from ${drive.name}`}
      className="relative mb-5 overflow-hidden rounded-[22px] bg-white/[0.05] p-4 ring-1 ring-inset ring-white/[0.08] sm:p-5"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: 'radial-gradient(120% 140% at 0% 0%, var(--color-accent-soft), transparent 60%)' }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <DriveArt size={60} className="shrink-0" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={state}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="min-w-0 flex-1"
            >
              {state === 'idle' && (
                <>
                  <h3 className="text-[16px] font-semibold tracking-tight">Import everything from this drive</h3>
                  <p className="mt-0.5 text-[13px] leading-snug text-white/55">
                    Copies {summary.count.toLocaleString()} files ({summary.media.toLocaleString()} photos and videos,{' '}
                    {formatBytes(summary.bytes)}) into {userName} › Imported. Nothing on the drive changes.
                  </p>
                </>
              )}
              {state === 'copying' && job && (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="min-w-0 text-[15px] leading-snug font-semibold">Bringing {drive.name} home…</h3>
                    <span className="shrink-0 text-[13px] font-semibold text-white/80 tabular-nums">
                      {Math.round((job.bytes / (job.totalBytes || 1)) * 100)}%
                    </span>
                  </div>
                  <ProgressBar value={job.bytes / (job.totalBytes || 1)} color="var(--color-accent)" className="mt-2.5 h-2" />
                  <p className="mt-2 flex flex-col gap-0.5 text-[12px] text-white/50 tabular-nums sm:flex-row sm:justify-between sm:gap-3">
                    <span className="truncate">Copying {job.current}</span>
                    <span className="shrink-0">
                      {job.copied.toLocaleString()} of {job.total.toLocaleString()} · {formatBytes(job.bytes)} of {formatBytes(job.totalBytes)}
                    </span>
                  </p>
                </>
              )}
              {state === 'done' && job && (
                <div className="flex items-center gap-2.5">
                  <CircleCheck size={22} className="shrink-0 text-emerald-400" />
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold">Imported {job.total.toLocaleString()} files</h3>
                    <p className="text-[13px] text-white/55">They're in {userName} › Imported › {nodes[job.targetId ?? '']?.name ?? drive.name}.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
          {state === 'idle' && (
            <Button variant="primary" icon={<HardDriveDownload size={16} />} onClick={() => importDrive(drive.id)} disabled={!summary.count}>
              Import everything
            </Button>
          )}
          {state === 'copying' && (
            <Button variant="secondary" size="sm" onClick={() => cancel(drive.id)}>
              Cancel
            </Button>
          )}
          {state === 'done' && job?.targetId && (
            <Button variant="primary" size="sm" onClick={() => onShow(job.targetId!)}>
              Show files
            </Button>
          )}
          <Button variant="ghost" size={state === 'idle' ? 'md' : 'sm'} icon={<Eject size={16} />} onClick={onEject} disabled={state === 'copying'}>
            Eject
          </Button>
        </div>
      </div>
    </motion.section>
  )
}

/** A quiet note at the top of read-only places. */
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-white/[0.045] px-4 py-3 text-[13px] leading-snug text-white/60 ring-1 ring-inset ring-white/[0.07]">
      <Info size={16} className="mt-px shrink-0 text-accent" />
      <p>{children}</p>
    </div>
  )
}
