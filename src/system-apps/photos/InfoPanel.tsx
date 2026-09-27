import type { ReactNode } from 'react'
import { Aperture, Camera, FolderOpen, HardDrive, Laptop, MapPin, Smartphone, X } from 'lucide-react'
import type { Photo } from '@/lib/photos'
import { formatBytes } from '@/lib/format'
import { IconButton } from '@/components/ui/Button'
import { usePhotos } from '@/stores/photos'
import { Avatar } from './Avatar'
import { MiniMap } from './MiniMap'
import { clock, fullDate, timeOfDay } from './format'
import { contributorOf, type Person } from './people'
import { SMART_ALBUMS } from './albums'

function Section({ icon, title, children }: { icon: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex gap-3 py-3.5 [&+&]:border-t [&+&]:border-white/[0.07]">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-white/75">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-white">{title}</div>
        {children && <div className="mt-0.5 text-[13px] text-white/55">{children}</div>}
      </div>
    </div>
  )
}

const formatOf = (p: Photo) => (p.name.split('.').pop() ?? '').toUpperCase()

export function InfoPanel({ photo, people, onClose }: { photo: Photo; people: Person[]; onClose: () => void }) {
  const albums = usePhotos((s) => s.albums)
  const inAlbums = [
    ...SMART_ALBUMS.filter((a) => a.id !== 'favorites' && a.id !== 'videos' && a.test(photo)).map((a) => a.name),
    ...albums.filter((a) => photo.albums.includes(a.id)).map((a) => a.name),
  ]
  const mp = (photo.width * photo.height) / 1e6
  const owner = photo.owner === 'shared' ? contributorOf(photo, people) : people[0]
  const source =
    photo.source === 'phone'
      ? { icon: <Smartphone size={15} />, text: 'Backed up from your phone' }
      : photo.source === 'drive'
        ? { icon: <HardDrive size={15} />, text: 'Imported from Old Backup Drive' }
        : photo.source === 'computer'
          ? { icon: <Laptop size={15} />, text: 'Added from this computer' }
          : null

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-1">
        <h2 className="text-[17px] font-semibold">Info</h2>
        <IconButton label="Close info (I)" onClick={onClose}>
          <X size={18} />
        </IconButton>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 pb-8">
        <div className="pt-2 pb-3">
          <div className="text-[20px] font-semibold tracking-tight">{fullDate(photo.date)}</div>
          <div className="mt-0.5 text-[13.5px] text-white/55 tabular-nums">{timeOfDay(photo.date)}</div>
        </div>

        {photo.place && (
          <div className="mb-3 overflow-hidden rounded-2xl ring-1 ring-white/10 ring-inset">
            <MiniMap place={photo.place} className="block h-[118px] w-full" />
            <div className="flex items-center gap-2 bg-white/[0.06] px-3.5 py-2.5 text-[13.5px] font-medium">
              <MapPin size={14} className="text-white/60" />
              {photo.place}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white/[0.06] px-4 ring-1 ring-white/[0.08] ring-inset">
          <Section
            icon={<Camera size={15} />}
            title={
              <span className="flex items-center justify-between gap-2">
                <span className="truncate">{photo.camera}</span>
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-white/70">{formatOf(photo)}</span>
              </span>
            }
          >
            <span className="tabular-nums">
              {photo.width.toLocaleString()} × {photo.height.toLocaleString()} · {mp >= 1 ? `${mp.toFixed(1)} MP` : `${Math.round(mp * 1000)} KP`} ·{' '}
              {formatBytes(photo.bytes)}
            </span>
          </Section>
          {photo.video && (
            <Section icon={<Aperture size={15} />} title="Video">
              <span className="tabular-nums">
                {photo.width >= 3840 || photo.height >= 3840 ? '4K' : `${Math.min(photo.width, photo.height)}p`} · 30 fps ·{' '}
                {clock(photo.video.duration)}
              </span>
            </Section>
          )}
          {photo.exif && (
            <div className="grid grid-cols-4 border-t border-white/[0.07] py-3 text-center text-[12.5px] text-white/75 tabular-nums">
              <span>ISO {photo.exif.iso}</span>
              <span className="border-l border-white/[0.08]">{photo.exif.focal} mm</span>
              <span className="border-l border-white/[0.08]">ƒ/{photo.exif.aperture}</span>
              <span className="border-l border-white/[0.08]">{photo.exif.shutter}{photo.exif.shutter.includes('"') ? '' : ' s'}</span>
            </div>
          )}
        </div>

        <div className="mt-3 rounded-2xl bg-white/[0.06] px-4 ring-1 ring-white/[0.08] ring-inset">
          <div className="flex items-center gap-3 py-3.5">
            <Avatar person={owner} size={28} />
            <div className="min-w-0">
              <div className="text-[14px] font-medium">{photo.owner === 'shared' ? 'Family space' : `${people[0].name}’s library`}</div>
              <div className="text-[13px] text-white/55">
                {photo.owner === 'shared' ? `Added by ${owner.me ? 'you' : owner.name}` : 'Only you can see this'}
              </div>
            </div>
          </div>
          {source && (
            <Section icon={source.icon} title={source.text} />
          )}
          {inAlbums.length > 0 && (
            <Section icon={<FolderOpen size={15} />} title={inAlbums.length === 1 ? 'In 1 album' : `In ${inAlbums.length} albums`}>
              {inAlbums.join(', ')}
            </Section>
          )}
        </div>

        <div className="selectable mt-4 truncate px-1 font-mono text-[12px] text-white/40">{photo.name}</div>
      </div>
    </div>
  )
}
