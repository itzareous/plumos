import { lazy, Suspense } from 'react'
import { useWindows } from '@/stores/windows'
import { WidgetFrame } from './WidgetFrame'

// The collage pulls in the photo painter, so it loads on its own once the widget is shown.
const WidgetCollage = lazy(() => import('@/system-apps/photos/WidgetCollage'))

function Placeholder() {
  return (
    <div className="grid h-full grid-cols-[136px_1fr] gap-1 p-[5px]" aria-hidden>
      <div className="rounded-l-[21px] rounded-r-[7px] bg-white/[0.07]" />
      <div className="grid grid-rows-2 gap-1">
        <div className="rounded-[7px] rounded-tr-[21px] bg-white/[0.07]" />
        <div className="grid grid-cols-2 gap-1">
          <div className="rounded-[7px] bg-white/[0.07]" />
          <div className="rounded-[7px] rounded-br-[21px] bg-white/[0.07]" />
        </div>
      </div>
    </div>
  )
}

/** Recent photos on the home screen; opens Photos. */
export function PhotosWidget() {
  const open = useWindows((s) => s.open)
  return (
    <WidgetFrame label="Photos" padded={false} onClick={() => open('photos')}>
      <Suspense fallback={<Placeholder />}>
        <WidgetCollage />
      </Suspense>
    </WidgetFrame>
  )
}
