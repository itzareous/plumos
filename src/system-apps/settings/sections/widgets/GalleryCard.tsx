import { useRef } from 'react'
import { motion } from 'motion/react'
import { Check, Plus } from 'lucide-react'
import { widgetRegistry } from '@/components/widgets/registry'
import type { WidgetId } from '@/stores/settings'
import { cn } from '@/lib/cn'
import { useElementWidth } from '../../lib/useElementWidth'
import { WidgetPreview } from './WidgetPreview'

export function GalleryCard({
  id,
  position,
  full,
  thumb,
  onToggle,
}: {
  id: WidgetId
  /** 1-based place on the home screen, or 0 when not shown. */
  position: number
  full: boolean
  thumb: string
  onToggle: () => void
}) {
  const entry = widgetRegistry[id]
  const ref = useRef<HTMLDivElement>(null)
  const width = useElementWidth(ref)
  const added = position > 0
  const blocked = !added && full

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[20px] bg-white/[0.05] ring-1 ring-inset transition-shadow',
        added ? 'ring-accent/60' : 'ring-white/[0.08]',
      )}
    >
      <div ref={ref} className="relative flex aspect-[16/10] items-center justify-center overflow-hidden">
        <img src={thumb} alt="" draggable={false} loading="lazy" className="absolute inset-0 size-full scale-110 object-cover blur-[2px]" />
        <div className="absolute inset-0 bg-black/15" />
        <div className="relative">
          <WidgetPreview id={id} width={Math.max(0, width - (width < 240 ? 22 : 36))} />
        </div>
        {added && (
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2.5 left-2.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-[12px] font-bold text-white tabular-nums shadow"
            title={`Number ${position} on your home screen`}
          >
            {position}
          </motion.span>
        )}
      </div>
      <div className="flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{entry.name}</p>
          <p className="truncate text-[12.5px] text-white/50">{entry.description}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={added}
          aria-disabled={blocked}
          aria-label={added ? `Remove ${entry.name} from home screen` : `Add ${entry.name} to home screen`}
          title={blocked ? 'Your home screen is full' : added ? 'Remove from home screen' : 'Add to home screen'}
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full transition outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-90',
            added ? 'bg-accent text-white hover:brightness-110' : 'bg-white/10 text-white hover:bg-white/20',
            blocked && 'opacity-40',
          )}
        >
          {added ? <Check size={16} strokeWidth={3} /> : <Plus size={17} strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  )
}
