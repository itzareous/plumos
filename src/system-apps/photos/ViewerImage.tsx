import { useEffect, useState } from 'react'
import { motion, type MotionValue, type PanInfo } from 'motion/react'
import { Pause, Play } from 'lucide-react'
import { usePhotoUrl, type Photo } from '@/lib/photos'
import { cn } from '@/lib/cn'
import { clock } from './format'

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

export const toRect = (r: DOMRect): Rect => ({ left: r.left, top: r.top, width: r.width, height: r.height })

const spring = { type: 'spring', stiffness: 340, damping: 34, mass: 0.9 } as const
const SLIDE = 220

interface Props {
  photo: Photo
  target: Rect
  /** Where the photo flies in from (its grid tile). Only for the first photo shown. */
  origin: Rect | null
  /** Direction we navigated from, for the slide-in. */
  enter: number
  closing: boolean
  /** Where to fly back to on close; null fades out instead. */
  closeTo: Rect | null
  dragY: MotionValue<number>
  playing: boolean
  onTogglePlay: () => void
  onSwipe: (dir: 1 | -1) => void
  onDismiss: () => void
  onCloseDone: () => void
}

export function ViewerImage({ photo, target, origin, enter, closing, closeTo, dragY, playing, onTogglePlay, onSwipe, onDismiss, onCloseDone }: Props) {
  const thumb = usePhotoUrl(photo, 'thumb', true, true)
  // Paint the big version once the fly-in has mostly settled, so it doesn't stutter.
  const [wantFull, setWantFull] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setWantFull(true), origin ? 360 : 140)
    return () => clearTimeout(t)
  }, [origin])
  const full = usePhotoUrl(photo, 'full', wantFull)
  const [fullReady, setFullReady] = useState(false)
  const fileVideo = Boolean(photo.url && photo.mime?.startsWith('video/'))
  const simVideo = Boolean(photo.video && !photo.url)

  const initial = origin
    ? { ...origin, opacity: 1, x: 0, scale: 1, borderRadius: 4 }
    : { ...target, opacity: 0, x: enter * SLIDE * 0.4, scale: enter ? 1 : 0.94, borderRadius: 4 }
  const animate = closing
    ? closeTo
      ? { ...closeTo, opacity: 1, x: 0, y: 0, scale: 1, borderRadius: 4 }
      : { ...target, opacity: 0, x: 0, y: 0, scale: 0.9, borderRadius: 4 }
    : { ...target, opacity: 1, x: 0, scale: 1, borderRadius: 4 }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      if (offset.x < -70 || velocity.x < -500) onSwipe(1)
      else if (offset.x > 70 || velocity.x > 500) onSwipe(-1)
    } else if (offset.y > 110 || velocity.y > 700) onDismiss()
  }

  return (
    <motion.div
      className="absolute overflow-hidden bg-black/30 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)]"
      style={{ y: dragY, touchAction: 'none' }}
      custom={enter}
      variants={{
        exit: (d: number) => ({ x: -d * SLIDE, opacity: 0, transition: { duration: 0.24, ease: [0.32, 0.72, 0, 1] } }),
      }}
      initial={initial}
      animate={animate}
      exit="exit"
      transition={spring}
      drag={!closing && !fileVideo}
      dragDirectionLock
      dragSnapToOrigin
      dragElastic={0.65}
      onDragEnd={onDragEnd}
      onAnimationComplete={() => closing && onCloseDone()}
    >
      <motion.div
        className="absolute inset-0"
        animate={simVideo && playing ? { scale: 1.14 } : { scale: 1 }}
        transition={simVideo && playing ? { duration: photo.video!.duration, ease: 'linear' } : { duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
        {thumb && <img src={thumb} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />}
        {full && !fileVideo && (
          <img
            src={full}
            alt={photo.place ? `Photo taken in ${photo.place}` : 'Photo'}
            draggable={false}
            onLoad={() => setFullReady(true)}
            className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-300', fullReady ? 'opacity-100' : 'opacity-0')}
          />
        )}
      </motion.div>
      {fileVideo && !closing && (
        <video src={photo.url} poster={thumb ?? undefined} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black object-contain" />
      )}
      {simVideo && !closing && <SimulatedPlayback duration={photo.video!.duration} playing={playing} onToggle={onTogglePlay} />}
    </motion.div>
  )
}

/** Playback controls for demo videos: the frame drifts slowly while the clock runs. */
function SimulatedPlayback({ duration, playing, onToggle }: { duration: number; playing: boolean; onToggle: () => void }) {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      setT((prev) => Math.min(duration, prev + (now - last) / 1000))
      last = now
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, duration])
  useEffect(() => {
    if (t >= duration && playing) {
      onToggle()
      setT(0)
    }
  }, [t, duration, playing, onToggle])

  return (
    <>
      {!playing && (
        <button
          type="button"
          onClick={onToggle}
          onPointerDownCapture={(e) => e.stopPropagation()}
          aria-label="Play video (Space)"
          className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/30 backdrop-blur-md transition hover:scale-105 hover:bg-black/45 focus-visible:ring-2 focus-visible:ring-white outline-none"
        >
          <Play size={26} fill="currentColor" strokeWidth={0} className="ml-1" />
        </button>
      )}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/60 to-transparent px-4 pt-8 pb-3"
        onPointerDownCapture={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onToggle} aria-label={playing ? 'Pause' : 'Play'} className="text-white/90 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 rounded">
          {playing ? <Pause size={16} fill="currentColor" strokeWidth={0} /> : <Play size={16} fill="currentColor" strokeWidth={0} />}
        </button>
        <span className="text-[12px] font-medium text-white/85 tabular-nums">{clock(t)}</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white" style={{ width: `${(t / duration) * 100}%` }} />
        </div>
        <span className="text-[12px] font-medium text-white/60 tabular-nums">-{clock(Math.max(0, duration - t))}</span>
      </div>
    </>
  )
}
