import { WIDGET_HEIGHT, WIDGET_WIDTH } from '@/components/widgets/WidgetFrame'
import { widgetRegistry } from '@/components/widgets/registry'
import type { WidgetId } from '@/stores/settings'

/**
 * The real widget, live, shrunk to `width`. It can't be clicked or focused,
 * and the label the home screen shows underneath is cropped off.
 */
export function WidgetPreview({ id, width }: { id: WidgetId; width: number }) {
  const Widget = widgetRegistry[id]?.component
  const scale = width / WIDGET_WIDTH
  if (!Widget || width <= 0) return <div style={{ width, height: WIDGET_HEIGHT * scale }} />
  return (
    <div aria-hidden inert className="pointer-events-none relative shrink-0 overflow-hidden select-none" style={{ width, height: WIDGET_HEIGHT * scale }}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: WIDGET_WIDTH, transform: `scale(${scale})` }}>
        <Widget />
      </div>
    </div>
  )
}

export const previewHeight = (width: number) => (WIDGET_HEIGHT * width) / WIDGET_WIDTH
