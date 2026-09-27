import type { MouseEvent, ReactNode } from 'react'
import { ChevronLeft, Ellipsis, HardDrive, Plus, RotateCcw, Trash2 } from 'lucide-react'
import type { Photo } from '@/lib/photos'
import { Button, IconButton } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'
import { contributorOf, type Person } from './people'
import { dateRange, plural } from './format'
import type { AlbumView } from './albums'

const pad = 'px-4 sm:pr-16 sm:pl-8'

export function AlbumHeader({
  album,
  onBack,
  onAddPhotos,
  onMore,
  onImport,
}: {
  album: AlbumView
  onBack: () => void
  onAddPhotos?: () => void
  onMore?: (e: MouseEvent<HTMLButtonElement>) => void
  /** Shown while photos are still arriving from a drive: reopens the import. */
  onImport?: () => void
}) {
  return (
    <div className={cn(pad, 'pt-1 pb-4')}>
      <BackToAlbums onBack={onBack} />
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[24px] leading-tight font-bold tracking-tight">{album.name}</h2>
          <p className="mt-0.5 text-[13px] text-white/50 tabular-nums">
            {plural(album.photos.length, 'item')}
            {album.photos.length > 0 && ` · ${dateRange(album.photos.map((p) => p.date))}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onImport && (
            <Button size="sm" icon={<HardDrive size={15} />} onClick={onImport}>
              Importing…
            </Button>
          )}
          {onAddPhotos && (
            <Button size="sm" icon={<Plus size={15} />} onClick={onAddPhotos}>
              Add Photos
            </Button>
          )}
          {onMore && (
            <IconButton label="Album options" onClick={onMore} className="size-8 bg-white/10">
              <Ellipsis size={17} />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  )
}

function BackToAlbums({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="-ml-2 flex items-center gap-0.5 rounded-full py-1 pr-3 pl-1.5 text-[14px] font-medium text-accent transition outline-none hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <ChevronLeft size={18} />
      Albums
    </button>
  )
}

/** Recently Deleted: how long things are kept, and recover or empty it in one go. */
export function DeletedHeader({
  count,
  days,
  onBack,
  onRecoverAll,
  onDeleteAll,
}: {
  count: number
  days: number
  onBack: () => void
  onRecoverAll: () => void
  onDeleteAll: () => void
}) {
  return (
    <div className={cn(pad, 'pt-1 pb-4')}>
      <BackToAlbums onBack={onBack} />
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[24px] leading-tight font-bold tracking-tight">Recently Deleted</h2>
          <p className="mt-0.5 text-[13px] text-white/50">
            <span className="tabular-nums">{plural(count, 'item')}</span> · Kept for {days} days, then deleted for good
          </p>
        </div>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" icon={<RotateCcw size={15} />} onClick={onRecoverAll}>
              Recover All
            </Button>
            <Button size="sm" variant="ghost" icon={<Trash2 size={15} />} onClick={onDeleteAll} className="text-red-300! hover:bg-red-500/15! hover:text-red-200!">
              Delete All
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function SharedHeader({
  people,
  photos,
  who,
  onWho,
  onAddPhotos,
}: {
  people: Person[]
  photos: Photo[]
  who: string
  onWho: (id: string) => void
  onAddPhotos: () => void
}) {
  const counts = new Map<string, number>()
  for (const p of photos) {
    const id = contributorOf(p, people).id
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  const chips: { id: string; label: string; person?: Person; n: number }[] = [
    { id: 'all', label: 'Everyone', n: photos.length },
    ...people.map((p) => ({ id: p.id, label: p.me ? 'You' : p.name, person: p, n: counts.get(p.id) ?? 0 })),
  ]
  return (
    <div className={cn(pad, 'pb-3')}>
      <div className="relative overflow-hidden rounded-[22px] bg-white/[0.05] p-5 ring-1 ring-white/[0.08] ring-inset sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--plumos-accent), transparent 65%)' }}
        />
        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex -space-x-2.5">
            {people.map((p) => (
              <Avatar key={p.id} person={p} size={40} ring />
            ))}
          </div>
          <div className="order-last w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
            <h2 className="text-[18px] font-semibold tracking-tight">Family space</h2>
            <p className="mt-0.5 text-[13px] text-white/55">Photos everyone in your home can see and add to.</p>
          </div>
          <Button size="sm" icon={<Plus size={15} />} onClick={onAddPhotos} className="ml-auto">
            Add Photos
          </Button>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Show photos from">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={who === c.id}
              onClick={() => onWho(c.id)}
              className={cn(
                'flex h-8 items-center gap-2 rounded-full pr-3 text-[13px] font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                c.person ? 'pl-1' : 'pl-3',
                who === c.id ? 'bg-white text-black' : 'bg-white/[0.08] text-white/80 hover:bg-white/[0.14]',
              )}
            >
              {c.person && <Avatar person={c.person} size={24} />}
              {c.label}
              <span className={cn('tabular-nums', who === c.id ? 'text-black/50' : 'text-white/40')}>{c.n}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 pt-16 pb-40 text-center">
      <div className="flex size-16 items-center justify-center rounded-[20px] bg-white/[0.07] text-white/55 ring-1 ring-white/[0.08] ring-inset">{icon}</div>
      <h3 className="mt-4 text-[18px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-[340px] text-[14px] leading-relaxed text-white/50">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
