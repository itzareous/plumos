import { useEffect, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { SoftKey } from './useLineEditor'

const KEYS: { key: SoftKey; label: string; icon?: LucideIcon }[] = [
  { key: 'Tab', label: 'tab' },
  { key: 'CtrlC', label: 'ctrl C' },
  { key: 'Up', label: 'Previous command', icon: ArrowUp },
  { key: 'Down', label: 'Next command', icon: ArrowDown },
  { key: 'Left', label: 'Cursor left', icon: ArrowLeft },
  { key: 'Right', label: 'Cursor right', icon: ArrowRight },
  { key: 'CtrlL', label: 'clear' },
]

/** How much of the layout viewport the on-screen keyboard covers, in px. */
function useKeyboardInset() {
  const [inset, setInset] = useState(0)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)))
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])
  return inset
}

/** Clears the home indicator on phones without a keyboard showing. */
const SAFE_AREA = 'max(env(safe-area-inset-bottom), 8px)'

/**
 * Phone keyboards have no Tab, Ctrl or arrows, so a row of them sits above
 * the on-screen keyboard. Buttons don't take focus, so the keyboard stays up.
 */
export function KeyBar({ onKey, running }: { onKey: (key: SoftKey) => void; running: boolean }) {
  const keyboard = useKeyboardInset()
  // With the on-screen keyboard up, sit right on top of it.
  const below = keyboard > 120 ? `${keyboard}px` : SAFE_AREA
  return (
    <div className="shrink-0 bg-white/[0.03] sm:hidden" style={{ paddingBottom: below }}>
      <div
        className="scrollbar-none flex gap-1.5 overflow-x-auto border-t border-white/[0.07] px-3 pt-2"
        role="toolbar"
        aria-label="Terminal keys"
      >
        {KEYS.map(({ key, label, icon: Icon }) => {
          const disabled = running && key !== 'CtrlC'
          return (
            <button
              key={key}
              type="button"
              aria-label={label}
              disabled={disabled}
              onPointerDown={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onKey(key)}
              className={cn(
                'flex h-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] font-mono text-[13px] text-white/85 ring-1 ring-white/[0.08] ring-inset transition active:scale-95 active:bg-white/20 disabled:opacity-35',
                Icon ? 'w-10' : 'px-3',
                key === 'CtrlC' && running && 'bg-[#ff7a8a]/20 text-[#ffb3bc] ring-[#ff7a8a]/30',
              )}
            >
              {Icon ? <Icon size={16} /> : label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
