import { memo } from 'react'
import { motion } from 'motion/react'
import { photoTone, usePhotoUrl, type Photo } from '@/lib/photos'
import { cn } from '@/lib/cn'

const Thumb = memo(function Thumb({ photo, active, size, onClick }: { photo: Photo; active: boolean; size: number; onClick: () => void }) {
  const url = usePhotoUrl(photo, 'thumb')
  return (
    <motion.button
      layout="position"
      type="button"
      tabIndex={-1}
      aria-label="Show photo"
      onClick={onClick}
      transition={{ type: 'spring', stiffness: 500, damping: 42 }}
      className={cn(
        'relative shrink-0 overflow-hidden rounded-[6px] transition-[opacity,box-shadow,width] duration-200',
        active ? 'opacity-100 shadow-[0_0_0_2px_white]' : 'opacity-55 hover:opacity-90',
      )}
      style={{ width: active ? size * 1.35 : size, height: size, background: photoTone(photo) }}
    >
      {url && <img src={url} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover" />}
    </motion.button>
  )
})

/** A strip of neighbouring photos along the bottom of the viewer. */
export function Filmstrip({ photos, index, compact, onPick }: { photos: Photo[]; index: number; compact: boolean; onPick: (i: number) => void }) {
  const reach = compact ? 4 : 9
  const size = compact ? 34 : 40
  const slots: (Photo | null)[] = []
  for (let i = index - reach; i <= index + reach; i++) slots.push(photos[i] ?? null)
  return (
    <div className="flex items-center justify-center gap-1">
      {slots.map((p, s) =>
        p ? (
          <Thumb key={p.id} photo={p} size={size} active={s === reach} onClick={() => onPick(index - reach + s)} />
        ) : (
          <span key={`gap-${s}`} className="shrink-0" style={{ width: size, height: size }} />
        ),
      )}
    </div>
  )
}
