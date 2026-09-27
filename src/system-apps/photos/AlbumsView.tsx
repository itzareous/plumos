import { memo, useRef, type MouseEvent, type ReactNode } from 'react'
import { FolderPlus, HardDrive, Heart, Images, Play, Plus, Smartphone, Users } from 'lucide-react'
import { photoTone, useNearViewport, usePhotoUrl } from '@/lib/photos'
import { Button } from '@/components/ui/Button'
import { SectionTitle } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import type { AlbumView } from './albums'
import { plural } from './format'

const SMART_ICONS: Record<string, ReactNode> = {
  favorites: <Heart size={14} fill="currentColor" strokeWidth={0} />,
  videos: <Play size={13} fill="currentColor" strokeWidth={0} />,
  'old-drive': <HardDrive size={14} />,
  screenshots: <Smartphone size={14} />,
  family: <Users size={14} />,
}

const AlbumCard = memo(function AlbumCard({
  album,
  icon,
  emptyText,
  onOpen,
  onMenu,
}: {
  album: AlbumView
  icon?: ReactNode
  emptyText: string
  onOpen: (album: AlbumView) => void
  onMenu?: (album: AlbumView, e: MouseEvent<HTMLElement>) => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const near = useNearViewport(ref)
  const cover = album.photos.find((p) => p.scene !== 'screenshot') ?? album.photos[0]
  const url = usePhotoUrl(cover, 'thumb', near)
  const empty = !album.photos.length
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpen(album)}
      onContextMenu={onMenu ? (e) => onMenu(album, e) : undefined}
      className="group min-w-0 text-left outline-none"
    >
      <div
        className={cn(
          'relative aspect-square overflow-hidden rounded-[18px] ring-1 ring-white/[0.08] transition duration-300 ease-(--ease-spring) ring-inset group-hover:scale-[1.025] group-active:scale-[0.98] group-focus-visible:ring-2 group-focus-visible:ring-white/70',
          empty && 'bg-white/[0.05]',
        )}
        style={cover ? { background: photoTone(cover) } : undefined}
      >
        {url && <img src={url} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />}
        {empty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/35">
            {album.id === 'old-drive' ? <HardDrive size={34} strokeWidth={1.5} /> : <Images size={34} strokeWidth={1.5} />}
          </div>
        )}
        {icon && !empty && (
          <span className="absolute bottom-2 left-2 flex size-7 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/15 backdrop-blur-md">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2.5 truncate text-[14px] font-medium text-white">{album.name}</div>
      <div className={cn('text-[12.5px] tabular-nums', empty && album.id === 'old-drive' ? 'text-accent' : 'text-white/45')}>
        {empty ? emptyText : plural(album.photos.length, 'item')}
      </div>
    </button>
  )
})

export function AlbumsView({
  smart,
  mine,
  onOpen,
  onNew,
  onMenu,
}: {
  smart: AlbumView[]
  mine: AlbumView[]
  onOpen: (album: AlbumView) => void
  onNew: () => void
  onMenu: (album: AlbumView, e: MouseEvent<HTMLElement>) => void
}) {
  const grid = 'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-32 sm:px-8">
      <section>
        <SectionTitle>Collections</SectionTitle>
        <div className={grid}>
          {smart.map((a) => (
            <AlbumCard key={a.id} album={a} icon={SMART_ICONS[a.id]} emptyText={a.id === 'old-drive' ? 'Import from drive' : 'Empty'} onOpen={onOpen} />
          ))}
        </div>
      </section>
      <section className="mt-10">
        <SectionTitle
          action={
            <Button size="sm" variant="ghost" icon={<Plus size={15} />} onClick={onNew}>
              New Album
            </Button>
          }
        >
          My Albums
        </SectionTitle>
        <div className={grid}>
          {mine.map((a) => (
            <AlbumCard key={a.id} album={a} emptyText="Empty" onOpen={onOpen} onMenu={onMenu} />
          ))}
          <button type="button" onClick={onNew} className="group min-w-0 text-left outline-none">
            <div className="flex aspect-square items-center justify-center rounded-[18px] border-[1.5px] border-dashed border-white/20 text-white/45 transition duration-300 ease-(--ease-spring) group-hover:scale-[1.025] group-hover:border-white/35 group-hover:text-white/75 group-focus-visible:ring-2 group-focus-visible:ring-white/70">
              <FolderPlus size={32} strokeWidth={1.5} />
            </div>
            <div className="mt-2.5 text-[14px] font-medium text-white/80">New Album</div>
            <div className="text-[12.5px] text-white/40">Collect photos you love</div>
          </button>
        </div>
      </section>
    </div>
  )
}
