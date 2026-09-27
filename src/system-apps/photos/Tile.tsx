import { memo, useContext, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { Check, Heart, Play } from 'lucide-react'
import { photoTone, useNearViewport, usePhotoUrl, type Photo } from '@/lib/photos'
import { cn } from '@/lib/cn'
import { clock } from './format'
import { ScrollRootContext } from './scrollRoot'

export interface TileProps {
  photo: Photo
  index: number
  x: number
  y: number
  size: number
  radius: number
  selecting: boolean
  selected: boolean
  hidden: boolean
  /** Animate position changes, e.g. while new photos arrive at the top. */
  flowing: boolean
  showFavorite: boolean
  badge?: (p: Photo) => ReactNode
  onActivate: (index: number, e: MouseEvent<HTMLElement>) => void
  onCheck: (index: number, e: MouseEvent<HTMLElement>) => void
  onMenu: (index: number, e: MouseEvent<HTMLElement>) => void
  onKey: (index: number, e: KeyboardEvent<HTMLElement>) => void
}

const APPEAR_WINDOW = 1800

export const Tile = memo(function Tile({
  photo,
  index,
  x,
  y,
  size,
  radius,
  selecting,
  selected,
  hidden,
  flowing,
  showFavorite,
  badge,
  onActivate,
  onCheck,
  onMenu,
  onKey,
}: TileProps) {
  const root = useContext(ScrollRootContext)
  const ref = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const near = useNearViewport(ref, root)
  const url = usePhotoUrl(photo, 'thumb', near)
  const [loaded, setLoaded] = useState(false)

  // New arrivals pop in; everything else is already there.
  useEffect(() => {
    if (!photo.addedAt || Date.now() - photo.addedAt > APPEAR_WINDOW) return
    inner.current?.animate(
      [
        { opacity: 0, transform: 'scale(0.55)', filter: 'blur(6px)' },
        { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
      ],
      { duration: 620, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
    )
  }, [photo.addedAt])

  const date = new Date(photo.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
  const label = `${photo.video ? 'Video' : photo.scene === 'screenshot' ? 'Screenshot' : 'Photo'}, ${date}${photo.place ? `, ${photo.place}` : ''}`
  const small = size < 70

  return (
    <div
      ref={ref}
      data-photo-id={photo.id}
      className="group/cell absolute top-0 left-0"
      style={{
        width: size,
        height: size,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        transition: flowing ? 'transform 480ms cubic-bezier(0.32, 0.72, 0, 1)' : undefined,
        visibility: hidden ? 'hidden' : undefined,
      }}
    >
      <button
        type="button"
        data-index={index}
        aria-label={label}
        aria-pressed={selecting ? selected : undefined}
        onClick={(e) => onActivate(index, e)}
        onContextMenu={(e) => onMenu(index, e)}
        onKeyDown={(e) => onKey(index, e)}
        className="group/tile absolute inset-0 cursor-default outline-none"
      >
        <div
          ref={inner}
          className="absolute inset-0 overflow-hidden transition-[transform,border-radius] duration-200 ease-(--ease-spring)"
          style={{
            background: photoTone(photo),
            borderRadius: selected ? Math.max(radius, 8) : radius,
            transform: selected ? 'scale(0.86)' : undefined,
          }}
        >
          {url && (
            <img
              src={url}
              alt=""
              draggable={false}
              decoding="async"
              ref={(img) => {
                if (img?.complete && img.naturalWidth) setLoaded(true)
              }}
              onLoad={() => setLoaded(true)}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
                loaded ? 'opacity-100' : 'opacity-0',
              )}
            />
          )}
          {!selecting && <span className="absolute inset-0 bg-black/0 transition-colors group-hover/tile:bg-black/10" />}
          {photo.video && (
            <span className="absolute right-1 bottom-1 flex items-center gap-0.5 rounded-full bg-black/35 px-1.5 py-px text-[10.5px] font-semibold text-white tabular-nums backdrop-blur-sm">
              {!small && <Play size={9} fill="currentColor" strokeWidth={0} />}
              {clock(photo.video.duration)}
            </span>
          )}
          {showFavorite && photo.favorite && !small && (
            <Heart size={13} fill="white" strokeWidth={0} className="absolute bottom-1.5 left-1.5 drop-shadow-[0_1px_2px_rgb(0_0_0/0.6)]" />
          )}
          {badge && !small && badge(photo)}
        </div>
        <span className="pointer-events-none absolute inset-0 hidden rounded-[inherit] ring-2 ring-white ring-inset group-focus-visible/tile:block" />
      </button>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={(e) => onCheck(index, e)}
        className={cn(
          'absolute top-1.5 left-1.5 flex size-[22px] items-center justify-center rounded-full transition-[opacity,background,transform] duration-150 active:scale-90',
          selected
            ? 'bg-accent text-white opacity-100 shadow-[0_0_0_2px_white]'
            : 'bg-black/20 text-transparent ring-[1.5px] ring-white/90 backdrop-blur-sm ring-inset',
          selecting ? 'opacity-100' : 'opacity-0 group-hover/cell:opacity-100 [@media(hover:none)]:hidden',
          small && !selected && 'scale-90',
        )}
      >
        <Check size={13} strokeWidth={3} />
      </button>
    </div>
  )
})
