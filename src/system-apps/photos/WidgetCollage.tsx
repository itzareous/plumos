import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Play } from 'lucide-react'
import { photoTone, usePhotoUrl, type Photo } from '@/lib/photos'
import { useLibrary, usePhotos } from '@/stores/photos'
import { cn } from '@/lib/cn'
import { dayLabel } from './format'

const COUNT = 4

function Cell({ photo, className }: { photo: Photo | undefined; className?: string }) {
  const url = usePhotoUrl(photo, 'thumb', Boolean(photo))
  return (
    <div className={cn('relative overflow-hidden rounded-[7px] bg-white/[0.06]', className)}>
      <AnimatePresence initial={false}>
        {photo && (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0"
            style={{ background: photoTone(photo) }}
          >
            {url && <img src={url} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />}
            {photo.video && (
              <span className="absolute right-1 bottom-1 flex size-4 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm">
                <Play size={8} fill="white" strokeWidth={0} className="ml-px" />
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** A little ring that fills as the phone backup runs. */
function BackupRing({ value }: { value: number }) {
  const r = 6
  const c = 2 * Math.PI * r
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="-rotate-90" aria-hidden>
      <circle cx="8" cy="8" r={r} fill="none" stroke="rgb(255 255 255 / 0.25)" strokeWidth="2" />
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        style={{ transition: 'stroke-dashoffset 400ms ease' }}
      />
    </svg>
  )
}

/** The home-screen collage: the newest photo large, three more beside it. */
export default function WidgetCollage() {
  const library = useLibrary()
  const backup = usePhotos((s) => s.backup)
  // The newest photo, then a few more recent ones that don't all look alike.
  const recent = useMemo(() => {
    const pool = library.filter((p) => p.scene !== 'screenshot').slice(0, 40)
    const out: Photo[] = pool.slice(0, 1)
    for (const p of pool) if (out.length < COUNT && !out.some((q) => q.scene === p.scene)) out.push(p)
    for (const p of pool) if (out.length < COUNT && !out.includes(p)) out.push(p)
    return out
  }, [library])
  const [hero, ...rest] = recent
  const running = backup.status === 'running'

  return (
    <div className="grid h-full grid-cols-[136px_1fr] gap-1 p-[5px]">
      <div className="relative">
        <Cell photo={hero} className="h-full rounded-l-[21px]" />
        {hero && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-br-[7px] rounded-bl-[21px] bg-gradient-to-t from-black/55 via-black/20 to-transparent px-2.5 pt-6 pb-2">
            <div className="truncate text-[12.5px] leading-tight font-semibold text-white">{dayLabel(hero.date)}</div>
            {hero.place && <div className="truncate text-[11px] leading-tight text-white/75">{hero.place}</div>}
          </div>
        )}
        {running && (
          <div className="absolute top-1.5 left-1.5 flex h-6 items-center gap-1 rounded-full bg-black/35 pr-2 pl-1 text-[10.5px] font-semibold text-white backdrop-blur-md">
            <BackupRing value={backup.total ? backup.done / backup.total : 0} />
            Backing up
          </div>
        )}
      </div>
      <div className="grid grid-rows-2 gap-1">
        <Cell photo={rest[0]} className="rounded-tr-[21px]" />
        <div className="grid grid-cols-2 gap-1">
          <Cell photo={rest[1]} />
          <Cell photo={rest[2]} className="rounded-br-[21px]" />
        </div>
      </div>
    </div>
  )
}
