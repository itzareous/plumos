import { useRef, type PointerEvent, type ReactNode, type RefObject } from 'react'
import { cn } from '@/lib/cn'
import { useElementSize } from '../hooks'
import { SCREEN, type VmOs } from '../types'
import { ScaleContext } from './scale'

interface Props {
  os: VmOs
  fullscreen: boolean
  stageRef: RefObject<HTMLDivElement | null>
  screenRef: RefObject<HTMLDivElement | null>
  /** Guest content, laid out at the guest's logical resolution. */
  children: ReactNode
  /** Unscaled overlay on the display (e.g. "This virtual machine is off"). */
  overlay?: ReactNode
  /** Real pointer presses inside the guest (not the agent's synthetic clicks). */
  onUserPointer: () => void
  className?: string
}

/**
 * Centres the guest display and scales it to fit: a monitor with a thin bezel
 * for desktop guests, a phone frame for Android.
 */
export function ScreenStage({ os, fullscreen, stageRef, screenRef, children, overlay, onUserPointer, className }: Props) {
  const inner = useRef<HTMLDivElement>(null)
  const size = useElementSize(inner)
  const phone = os === 'android'
  const { w: W, h: H } = SCREEN[os]
  const bezel = phone ? 11 : fullscreen ? 0 : 9
  const s = size ? Math.max(0.05, Math.min((size.w - bezel * 2) / W, (size.h - bezel * 2) / H, phone ? 1.3 : 1.6)) : 0
  const radius = phone ? 40 * s : fullscreen ? 0 : 6

  const onPointerDownCapture = (e: PointerEvent) => {
    if (e.nativeEvent.isTrusted) onUserPointer()
  }

  return (
    <div
      ref={stageRef}
      className={cn('relative flex min-h-0 min-w-0 flex-1', fullscreen ? 'bg-black' : className)}
    >
      <div ref={inner} className={cn('relative flex min-h-0 min-w-0 flex-1 items-center justify-center', !fullscreen && 'm-3 sm:m-5')}>
        {s > 0 && (
          <div
            className={cn(
              'relative shrink-0',
              phone
                ? 'bg-gradient-to-b from-[#2a2c33] to-[#15161b] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8),inset_0_0_0_1.5px_rgb(255_255_255/0.12)]'
                : !fullscreen && 'bg-gradient-to-b from-[#24262d] to-[#131419] shadow-[0_30px_80px_-24px_rgb(0_0_0/0.8),inset_0_0_0_1px_rgb(255_255_255/0.1)]',
            )}
            style={{ padding: bezel, borderRadius: radius + bezel * (phone ? 1 : 0.9) }}
          >
            {phone && <PhoneButtons />}
            <div
              className="relative overflow-hidden bg-black"
              style={{ width: W * s, height: H * s, borderRadius: radius }}
              onPointerDownCapture={onPointerDownCapture}
            >
              <ScaleContext.Provider value={s}>
                <div
                  ref={screenRef}
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: W, height: H, transform: `scale(${s})`, transformOrigin: '0 0' }}
                >
                  {children}
                </div>
              </ScaleContext.Provider>
              {overlay}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PhoneButtons() {
  return (
    <>
      <span className="absolute top-[18%] -right-[3px] h-[9%] w-[3px] rounded-r bg-[#2a2c33]" />
      <span className="absolute top-[30%] -right-[3px] h-[14%] w-[3px] rounded-r bg-[#2a2c33]" />
    </>
  )
}
