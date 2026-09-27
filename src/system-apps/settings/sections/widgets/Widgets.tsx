import { MAX_WIDGETS, widgetRegistry } from '@/components/widgets/registry'
import { useSettings, type WidgetId } from '@/stores/settings'
import { toast } from '@/stores/toasts'
import { Group, Page } from '../../ui/Page'
import { Arrangement } from './Arrangement'
import { GalleryCard } from './GalleryCard'
import { useWallpaperThumb } from './useWallpaperThumb'

export function Widgets() {
  const widgets = useSettings((s) => s.widgets)
  const set = useSettings((s) => s.set)
  const thumb = useWallpaperThumb()
  const full = widgets.length >= MAX_WIDGETS

  const toggle = (id: WidgetId) => {
    if (widgets.includes(id)) set({ widgets: widgets.filter((w) => w !== id) })
    else if (full) toast(`Your home screen fits ${MAX_WIDGETS} widgets`, { description: 'Remove one to make room for another.' })
    else set({ widgets: [...widgets, id] })
  }

  return (
    <Page title="Widgets" description="Pick what shows under the greeting on your home screen.">
      <Group
        title={`On your home screen · ${widgets.length} of ${MAX_WIDGETS}`}
        footer="Drag to reorder. With the keyboard, focus a widget and use the arrow keys to move it, or Delete to remove it."
      >
        <Arrangement />
      </Group>

      <Group title="All widgets">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {(Object.keys(widgetRegistry) as WidgetId[]).map((id) => (
            <GalleryCard
              key={id}
              id={id}
              position={widgets.indexOf(id) + 1}
              full={full}
              thumb={thumb}
              onToggle={() => toggle(id)}
            />
          ))}
        </div>
      </Group>
    </Page>
  )
}
