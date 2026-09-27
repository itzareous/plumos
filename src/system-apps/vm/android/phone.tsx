import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { GuestApp } from '../apps/glyphs'

export type PhoneApp = Extract<
  GuestApp,
  'clock' | 'calendar' | 'photos' | 'weather' | 'notes' | 'calc' | 'music' | 'settings' | 'phone' | 'messages' | 'browser' | 'camera'
>

export const STATUS_H = 30
export const NAV_H = 44

export interface PhoneApi {
  launch: (app: PhoneApp) => void
  back: () => void
  home: () => void
  /** The open app can take Back for itself (return true when handled). */
  backHandler: React.RefObject<(() => boolean) | null>
}

export const PhoneContext = createContext<PhoneApi | null>(null)

export function usePhone() {
  const api = useContext(PhoneContext)
  if (!api) throw new Error('usePhone outside the phone')
  return api
}

/** Registers a Back handler for as long as the calling component is mounted. */
export function useBack(handler: () => boolean) {
  const { backHandler } = usePhone()
  const latest = useRef(handler)
  useEffect(() => {
    latest.current = handler
  })
  useEffect(() => {
    const fn = () => latest.current()
    backHandler.current = fn
    return () => {
      if (backHandler.current === fn) backHandler.current = null
    }
  }, [backHandler])
}

/** Title bar inside a phone app, with a Back arrow. */
export function AppHeader({ title, right, sub }: { title: ReactNode; right?: ReactNode; sub?: ReactNode }) {
  const { back } = usePhone()
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 px-2">
      <button
        type="button"
        aria-label="Back"
        data-agent="app.back"
        onClick={back}
        className="flex size-10 items-center justify-center rounded-full text-white/90 transition outline-none active:bg-white/15"
      >
        <ArrowLeft size={21} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[19px] leading-tight font-medium">{title}</div>
        {sub && <div className="truncate text-[12px] text-white/50">{sub}</div>}
      </div>
      {right}
    </div>
  )
}
