import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Reorder } from 'motion/react'
import { Minus } from 'lucide-react'
import { MAX_WIDGETS, widgetRegistry } from '@/components/widgets/registry'
import { useSettings, type WidgetId } from '@/stores/settings'
import { useElementWidth } from '../../lib/useElementWidth'
import { WidgetPreview, previewHeight } from './WidgetPreview'
import { useWallpaperThumb } from './useWallpaperThumb'

/**
 * The home screen's widget row in miniature, over the real wallpaper.
 * Drag to reorder; focus a widget and use ← → to move it or Delete to remove it.
 */
export function Arrangement() {
  const widgets = useSettings((s) => s.widgets)
  const set = useSettings((s) => s.set)
  const thumb = useWallpaperThumb()
  const box = useRef<HTMLDivElement>(null)
  const width = useElementWidth(box)
  // Local order while dragging; saved when the drag ends.
  const [order, setOrder] = useState(widgets)
  useEffect(() => setOrder(widgets), [widgets])

  const gap = width < 420 ? 10 : 18
  const slot = Math.max(0, Math.min(172, (width - gap * (MAX_WIDGETS - 1)) / MAX_WIDGETS))
  const commit = (next: WidgetId[]) => set({ widgets: next })
  const remove = (id: WidgetId) => commit(widgets.filter((w) => w !== id))

  const onKey = (e: KeyboardEvent, id: WidgetId) => {
    const i = order.indexOf(id)
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      remove(id)
      return
    }
    const to = e.key === 'ArrowLeft' ? i - 1 : e.key === 'ArrowRight' ? i + 1 : -1
    if (to < 0 || to >= order.length || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
    e.preventDefault()
    const next = [...order]
    next.splice(i, 1)
    next.splice(to, 0, id)
    commit(next)
  }

  return (
    <div className="relative overflow-hidden rounded-[22px] ring-1 ring-inset ring-white/10">
      <img src={thumb} alt="" draggable={false} className="absolute inset-0 size-full scale-110 object-cover blur-[2px]" />
      <div className="absolute inset-0 bg-black/15" />
      <div className="relative px-4 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5">
        <div ref={box} className="flex justify-center" style={{ gap }}>
          <Reorder.Group as="div" axis="x" values={order} onReorder={setOrder} className="flex" style={{ gap }}>
            {order.map((id) => (
              <Reorder.Item
                key={id}
                as="div"
                value={id}
                tabIndex={0}
                aria-label={`${widgetRegistry[id]?.name ?? id} widget. Use arrow keys to move, Delete to remove.`}
                onKeyDown={(e) => onKey(e, id)}
                onDragEnd={() => commit(order)}
                whileDrag={{ scale: 1.06, zIndex: 10 }}
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                className="relative flex cursor-grab touch-pan-y flex-col items-center gap-2 rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent active:cursor-grabbing"
              >
                <WidgetPreview id={id} width={slot} />
                <span className="text-on-wallpaper max-w-full truncate text-[12px] font-semibold text-white/90">
                  {widgetRegistry[id]?.name ?? id}
                </span>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={`Remove ${widgetRegistry[id]?.name ?? id}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => remove(id)}
                  className="absolute -top-2 -left-2 flex size-6 items-center justify-center rounded-full bg-[#3a3945]/95 text-white shadow-[0_2px_8px_rgb(0_0_0/0.4)] ring-1 ring-white/20 transition hover:bg-red-500 active:scale-90"
                >
                  <Minus size={14} strokeWidth={3} />
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          {Array.from({ length: MAX_WIDGETS - order.length }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className="flex items-center justify-center rounded-[18px] border-[1.5px] border-dashed border-white/35 bg-black/10 text-[12px] font-medium text-white/70"
                style={{ width: slot, height: previewHeight(slot) }}
              >
                Empty
              </div>
              <span className="text-[12px] text-transparent">.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
