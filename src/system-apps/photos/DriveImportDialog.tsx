import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, HardDrive, Usb } from 'lucide-react'
import { OLD_DRIVE_COUNT, loadPhotoUrl, photoTone, usePhotoUrl, type Photo } from '@/lib/photos'
import { formatBytes } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import { useStorage } from '@/stores/storage'
import { useLibrary, usePhotos } from '@/stores/photos'
import { Dialog, DialogFooter } from './Dialog'
import { DriveArt } from './Illustrations'
import { count } from './format'

const STRIP = 8
const STEP_MS = 380

/** A photo in the "just imported" strip. Its thumbnail is ready before it's added, so it lands fully painted. */
function StripThumb({ photo }: { photo: Photo }) {
  const url = usePhotoUrl(photo, 'thumb', true, true)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.5, x: 12 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="relative aspect-square overflow-hidden rounded-lg"
      style={{ background: photoTone(photo) }}
    >
      {url && <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
    </motion.div>
  )
}

const newestFirst = (list: Photo[]) => [...list].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0) || b.date - a.date)

/**
 * The strip of recently imported photos. While the import runs, the newest
 * photo joins every few hundred milliseconds (once its thumbnail is painted),
 * so the strip slides along calmly however fast the copy goes.
 */
function useImportStrip(imported: Photo[], active: boolean) {
  const latest = useRef(imported)
  latest.current = imported
  const [shown, setShown] = useState<Photo[]>(() => newestFirst(imported).slice(0, STRIP).reverse())
  useEffect(() => {
    if (!active) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const step = async () => {
      const next = newestFirst(latest.current)[0]
      if (next) {
        await loadPhotoUrl(next, 'thumb', true)
        if (cancelled) return
        setShown((s) => (s.some((p) => p.id === next.id) ? s : [...s, next].slice(-STRIP)))
      }
      timer = setTimeout(() => void step(), STEP_MS)
    }
    void step()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [active])
  return shown
}

export function DriveImportDialog({ open, onClose, onViewAlbum }: { open: boolean; onClose: () => void; onViewAlbum: () => void }) {
  const drives = useStorage((s) => s.drives)
  const external = useMemo(() => drives.filter((d) => d.location === 'external'), [drives])
  const [chosen, setChosen] = useState<string | null>(null)
  const drive = external.find((d) => d.id === chosen) ?? external[0]
  const job = usePhotos((s) => s.driveImport)
  const start = usePhotos((s) => s.startDriveImport)
  const library = useLibrary()
  const imported = useMemo(() => library.filter((p) => p.source === 'drive'), [library])
  const strip = useImportStrip(imported, open && job.status === 'running')
  const ratio = job.total ? job.done / job.total : 0
  const year = strip.length ? new Date(strip[strip.length - 1].date).getFullYear() : null

  return (
    <Dialog open={open} onClose={onClose} label="Import from Old Backup Drive">
      {job.status === 'idle' && !drive && (
        <>
          <div className="flex flex-col items-center px-8 pt-10 pb-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/[0.08] text-white/70">
              <Usb size={30} />
            </div>
            <h2 className="mt-4 text-[21px] font-bold tracking-tight">Plug in a drive</h2>
            <p className="mt-2 max-w-[360px] text-[14px] leading-relaxed text-white/60">
              Connect an old USB drive or memory card to your server and it shows up here, ready to bring its photos home.
            </p>
          </div>
          <DialogFooter>
            <Button variant="primary" onClick={onClose} data-autofocus>
              OK
            </Button>
          </DialogFooter>
        </>
      )}

      {job.status === 'idle' && drive && (
        <>
          <div className="flex flex-col items-center px-6 pt-9 pb-6 text-center sm:px-10">
            <DriveArt busy={false} />
            <h2 className="mt-3 text-[22px] font-bold tracking-tight">Bring old photos home</h2>
            <p className="mt-2 max-w-[400px] text-[14px] leading-relaxed text-white/60">
              We looked through the drive and found {count(OLD_DRIVE_COUNT)} photos and videos from 2008 to 2012. They’ll keep their original
              dates, so they land in the right place on your timeline.
            </p>
            <div className="mt-6 w-full space-y-2">
              {external.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setChosen(d.id)}
                  className={cn(
                    'flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left ring-1 transition ring-inset outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                    d.id === drive.id ? 'bg-white/[0.1] ring-white/25' : 'bg-white/[0.04] ring-white/[0.08] hover:bg-white/[0.07]',
                  )}
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white/80">
                    <HardDrive size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-medium">{d.name}</span>
                    <span className="block truncate text-[12.5px] text-white/50">
                      {d.model} · {formatBytes(d.size)} · USB
                    </span>
                  </span>
                  <span className="text-[12.5px] text-white/45 tabular-nums">{count(OLD_DRIVE_COUNT)} items</span>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" data-autofocus onClick={() => start(drive.id, drive.name)}>
              Import {count(OLD_DRIVE_COUNT)} Photos
            </Button>
          </DialogFooter>
        </>
      )}

      {job.status !== 'idle' && (
        <>
          <div className="flex flex-col items-center px-6 pt-9 pb-7 text-center sm:px-10">
            <DriveArt busy={job.status === 'running'} />
            <h2 className="mt-3 text-[22px] font-bold tracking-tight">
              {job.status === 'running' ? 'Importing memories…' : `${count(job.total)} photos imported`}
            </h2>
            <p className="mt-2 max-w-[400px] text-[14px] leading-relaxed text-white/60">
              {job.status === 'running'
                ? `Copying from ${job.driveName ?? 'the drive'}. You can close this, the import keeps going.`
                : 'They’re on your timeline under 2008 to 2012, and together in one album. You can unplug the drive now.'}
            </p>
            <div className="mt-6 w-full rounded-2xl bg-white/[0.06] p-4 text-left ring-1 ring-white/[0.08] ring-inset">
              <div className="mb-2.5 flex items-center justify-between text-[13.5px]">
                <span className="flex items-center gap-2 font-medium tabular-nums">
                  {job.status === 'done' && <CheckCircle2 size={16} className="text-emerald-400" />}
                  {job.status === 'running' ? `Importing ${count(job.done)} of ${count(job.total)}` : 'Import complete'}
                </span>
                <AnimatePresence mode="popLayout">
                  {year && job.status === 'running' && (
                    <motion.span
                      key={year}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="text-white/50 tabular-nums"
                    >
                      Photos from {year}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <ProgressBar value={ratio} color={job.status === 'done' ? '#34d399' : 'var(--plumos-accent)'} className="h-2" />
              <div className="relative mt-4">
                <div className="grid grid-cols-8 gap-1.5" aria-hidden>
                  {Array.from({ length: STRIP }, (_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-white/[0.05]" />
                  ))}
                </div>
                <div className="absolute inset-0 grid grid-cols-8 gap-1.5">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {strip.map((p) => (
                      <StripThumb key={p.id} photo={p} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              data-autofocus
              disabled={job.status === 'running'}
              onClick={() => {
                onClose()
                onViewAlbum()
              }}
            >
              View Album
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  )
}
