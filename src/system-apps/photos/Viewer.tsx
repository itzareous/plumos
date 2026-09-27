import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react'
import { ChevronLeft, ChevronRight, Download, Heart, Info, Trash2, X } from 'lucide-react'
import { downloadPhoto, loadPhotoUrl, usePhotoUrl, type Photo } from '@/lib/photos'
import { IconButton } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { ViewerImage, type Rect } from './ViewerImage'
import { InfoPanel } from './InfoPanel'
import { Filmstrip } from './Filmstrip'
import { dayLabel, timeOfDay } from './format'
import type { Person } from './people'

export interface ViewerProps {
  photos: Photo[]
  index: number
  origin: Rect | null
  closing: boolean
  closeTo: Rect | null
  people: Person[]
  onIndexChange: (index: number) => void
  onRequestClose: () => void
  onClosed: () => void
  onFavorite: (p: Photo) => void
  onDelete: (p: Photo) => void
}

function useWindowSize() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return size
}

const INFO_W = 360

function fit(aspect: number, s: { x: number; y: number; w: number; h: number }): Rect {
  let width = s.w
  let height = width / aspect
  if (height > s.h) {
    height = s.h
    width = height * aspect
  }
  return { left: s.x + (s.w - width) / 2, top: s.y + (s.h - height) / 2, width, height }
}

function Ambient({ photo }: { photo: Photo }) {
  const url = usePhotoUrl(photo, 'thumb')
  return (
    <AnimatePresence initial={false}>
      {url && (
        <motion.img
          key={photo.id}
          src={url}
          alt=""
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.32 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-[90px] saturate-150"
        />
      )}
    </AnimatePresence>
  )
}

/** Full-screen lightbox: flies out of the grid, swipes between photos, flies back on close. */
export function Viewer(props: ViewerProps) {
  const { photos, index, origin, closing, closeTo, people, onIndexChange, onRequestClose, onClosed, onFavorite, onDelete } = props
  const { w: vw, h: vh } = useWindowSize()
  const phone = vw < 640
  const [info, setInfo] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [enter, setEnter] = useState(0)
  const navigated = useRef(false)
  const dragY = useMotionValue(0)
  const fade = useTransform(dragY, [0, 280], [1, 0.25])
  const photo = photos[Math.min(index, photos.length - 1)]

  const infoW = info && !phone ? INFO_W : 0
  const infoH = info && phone ? Math.round(vh * 0.5) : 0
  const topBar = phone ? 60 : 72
  const bottomBar = phone ? 70 : 88
  const pad = phone ? 0 : 28
  const stage = { x: pad, y: topBar, w: vw - infoW - pad * 2, h: vh - topBar - (infoH || bottomBar) }
  const target = photo ? fit(photo.width / photo.height, stage) : { left: 0, top: 0, width: 0, height: 0 }

  const go = useCallback(
    (delta: 1 | -1) => {
      const next = index + delta
      if (next < 0 || next >= photos.length) return
      navigated.current = true
      setEnter(delta)
      setPlaying(false)
      onIndexChange(next)
    },
    [index, photos.length, onIndexChange],
  )

  const togglePlay = useCallback(() => setPlaying((p) => !p), [])

  const jump = (i: number) => {
    if (i === index) return
    navigated.current = true
    setEnter(Math.sign(i - index))
    setPlaying(false)
    onIndexChange(i)
  }

  // Keys belong to the viewer while it's open; Escape must not also close the sheet.
  const latest = useRef({ go, photo, info, phone, closing, onRequestClose, onFavorite, onDelete, togglePlay })
  latest.current = { go, photo, info, phone, closing, onRequestClose, onFavorite, onDelete, togglePlay }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = latest.current
      if (s.closing || !s.photo) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable="true"]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      let handled = true
      if (k === 'Escape') {
        if (s.info && s.phone) setInfo(false)
        else s.onRequestClose()
      } else if (k === 'ArrowRight') s.go(1)
      else if (k === 'ArrowLeft') s.go(-1)
      else if (k === 'i' || k === 'I') setInfo((v) => !v)
      else if (k === 'f' || k === 'F' || k === '.') s.onFavorite(s.photo)
      else if (k === 'Delete' || k === 'Backspace') s.onDelete(s.photo)
      else if (k === ' ' && s.photo.video && !s.photo.url) s.togglePlay()
      else handled = false
      if (handled) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [])

  // Focus returns to where it was once the viewer is gone.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    return () => previous?.focus?.({ preventScroll: true })
  }, [])

  // Warm up the neighbours.
  useEffect(() => {
    const t = setTimeout(() => {
      for (const p of [photos[index + 1], photos[index - 1]]) if (p) void loadPhotoUrl(p, 'full')
    }, 900)
    return () => clearTimeout(t)
  }, [index, photos])

  // In case the fly-back animation is interrupted.
  useEffect(() => {
    if (!closing) return
    const t = setTimeout(onClosed, 700)
    return () => clearTimeout(t)
  }, [closing, onClosed])

  if (!photo) return null
  const canPrev = index > 0
  const canNext = index < photos.length - 1

  return createPortal(
    <div className={cn('fixed inset-0 z-[60] text-white', closing && 'pointer-events-none')} role="dialog" aria-modal="true" aria-label="Photo viewer">
      <motion.div
        className="absolute inset-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: closing ? 0.3 : 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <motion.div className="absolute inset-0 bg-[#060609]" style={{ opacity: fade }}>
          <Ambient photo={photo} />
        </motion.div>
      </motion.div>

      <AnimatePresence custom={enter}>
        <ViewerImage
          key={photo.id}
          photo={photo}
          target={target}
          origin={navigated.current ? null : origin}
          enter={enter}
          closing={closing}
          closeTo={closeTo}
          dragY={dragY}
          playing={playing}
          onTogglePlay={togglePlay}
          onSwipe={go}
          onDismiss={onRequestClose}
          onCloseDone={onClosed}
        />
      </AnimatePresence>

      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: 0.25, delay: closing ? 0 : 0.08 }}
      >
        <header
          className="pointer-events-auto absolute top-0 left-0 flex items-center gap-2 bg-gradient-to-b from-black/50 to-transparent px-3 sm:gap-3 sm:px-5"
          style={{ right: infoW, height: topBar }}
        >
          <IconButton autoFocus label="Close (Esc)" onClick={onRequestClose} className="bg-white/10 hover:bg-white/20">
            {phone ? <ChevronLeft size={20} /> : <X size={18} />}
          </IconButton>
          <div className="min-w-0 flex-1 pl-1">
            <div className="truncate text-[15px] leading-tight font-semibold">{dayLabel(photo.date)}</div>
            <div className="truncate text-[12.5px] text-white/60 tabular-nums">
              {timeOfDay(photo.date)}
              {photo.place ? ` · ${photo.place}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <IconButton label={photo.favorite ? 'Remove from Favorites (F)' : 'Favorite (F)'} onClick={() => onFavorite(photo)} aria-pressed={photo.favorite}>
              <motion.span key={String(photo.favorite)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }}>
                <Heart size={19} fill={photo.favorite ? 'currentColor' : 'none'} />
              </motion.span>
            </IconButton>
            <IconButton label="Info (I)" onClick={() => setInfo((v) => !v)} aria-pressed={info} className={cn(info && 'bg-white/15 text-white')}>
              <Info size={19} />
            </IconButton>
            <IconButton label={photo.url ? 'Download original' : 'Download'} onClick={() => void downloadPhoto(photo)}>
              <Download size={19} />
            </IconButton>
            <IconButton label="Delete (Del)" onClick={() => onDelete(photo)} className="hover:text-red-300">
              <Trash2 size={19} />
            </IconButton>
          </div>
        </header>

        {!phone && (
          <>
            <NavButton side="left" disabled={!canPrev} onClick={() => go(-1)} style={{ left: 16, top: stage.y + stage.h / 2 }} />
            <NavButton side="right" disabled={!canNext} onClick={() => go(1)} style={{ left: stage.x + stage.w + pad - 60, top: stage.y + stage.h / 2 }} />
          </>
        )}

        {!(phone && info) && (
          <div className="pointer-events-auto absolute bottom-0 left-0 flex items-center justify-center pb-4" style={{ right: infoW, height: bottomBar }}>
            <Filmstrip photos={photos} index={index} compact={phone} onPick={jump} />
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {info && !closing && (
          <motion.aside
            key="info"
            aria-label="Photo info"
            initial={phone ? { y: '100%' } : { x: INFO_W }}
            animate={phone ? { y: 0 } : { x: 0 }}
            exit={phone ? { y: '100%' } : { x: INFO_W }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            className={cn(
              'glass-dark absolute z-10',
              phone ? 'inset-x-0 bottom-0 rounded-t-[26px]' : 'top-0 right-0 bottom-0 rounded-l-[26px]',
            )}
            style={phone ? { height: infoH } : { width: INFO_W }}
          >
            <InfoPanel photo={photo} people={people} onClose={() => setInfo(false)} />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  )
}

function NavButton({ side, disabled, onClick, style }: { side: 'left' | 'right'; disabled: boolean; onClick: () => void; style: React.CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Previous (←)' : 'Next (→)'}
      title={side === 'left' ? 'Previous (←)' : 'Next (→)'}
      className="pointer-events-auto absolute flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/85 ring-1 ring-white/10 backdrop-blur-md transition hover:bg-white/20 hover:text-white active:scale-95 disabled:opacity-0 outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      style={style}
    >
      {side === 'left' ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
    </button>
  )
}
