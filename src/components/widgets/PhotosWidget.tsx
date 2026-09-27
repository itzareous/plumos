import { useWindows } from '@/stores/windows'
import { WidgetFrame } from './WidgetFrame'

// Placeholder — the Photos app replaces this with recent photos.
export function PhotosWidget() {
  const open = useWindows((s) => s.open)
  return (
    <WidgetFrame label="Photos" onClick={() => open('photos')}>
      <div className="flex h-full items-center justify-center text-sm text-white/60">Recent photos</div>
    </WidgetFrame>
  )
}
