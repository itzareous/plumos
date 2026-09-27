import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Copy, Minus, Square, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { AppGlyph, type GuestApp } from '../apps/glyphs'
import { useScale } from '../screen/scale'
import { maximizedRect, type Win, type WindowManager, type WorkArea } from './useWindowManager'

export type WindowVariant = 'win' | 'gnome'

interface Props {
  win: Win
  wm: WindowManager
  active: boolean
  area: WorkArea
  title: string
  variant: WindowVariant
  children: ReactNode
}

/** A draggable guest window with title bar controls. */
export function WindowFrame({ win, wm, active, area, title, variant, children }: Props) {
  const scale = useScale()
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null)
  const rect = win.max ? maximizedRect(area) : win

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || win.max) return
    if ((e.target as HTMLElement).closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, x: win.x, y: win.y }
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const x = d.x + (e.clientX - d.px) / scale
    const y = d.y + (e.clientY - d.py) / scale
    // Keep enough of the title bar on screen to grab it again.
    wm.move(
      win.id,
      Math.round(Math.min(area.w - 90, Math.max(area.left - win.w + 90, x))),
      Math.round(Math.min(area.h - area.bottom - 36, Math.max(area.top, y))),
    )
  }
  const endDrag = () => {
    drag.current = null
    setDragging(false)
  }

  const gnome = variant === 'gnome'

  return (
    <motion.div
      role="dialog"
      aria-label={title}
      data-window={win.app}
      data-hidden={win.min || undefined}
      initial={{ opacity: 0, scale: 0.9, y: 18 }}
      animate={win.min ? { opacity: 0, scale: 0.4, y: 320 } : { opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.16 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        zIndex: win.z,
        pointerEvents: win.min ? 'none' : undefined,
        transformOrigin: '50% 100%',
      }}
      className={cn(
        'absolute flex flex-col overflow-hidden text-white',
        !dragging && 'transition-[left,top,width,height,border-radius] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        gnome
          ? 'bg-[#242429] shadow-[0_18px_50px_-8px_rgb(0_0_0/0.7),0_0_0_1px_rgb(255_255_255/0.08)]'
          : 'bg-[#1d1f25] shadow-[0_24px_60px_-12px_rgb(0_0_0/0.7),0_0_0_1px_rgb(255_255_255/0.09)]',
        win.max ? 'rounded-none' : gnome ? 'rounded-[12px]' : 'rounded-[9px]',
      )}
      onPointerDownCapture={() => wm.focus(win.id)}
      onClickCapture={() => wm.focus(win.id)}
    >
      <div
        className={cn(
          'relative flex shrink-0 touch-none items-center select-none',
          gnome ? 'h-10 justify-center bg-[#2e2e34] px-2' : 'h-9 pl-3',
          !active && 'opacity-70',
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={(e) => !(e.target as HTMLElement).closest('button') && wm.toggleMax(win.id)}
      >
        {gnome ? (
          <span className="truncate text-[13px] font-semibold text-white/90">{title}</span>
        ) : (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <AppGlyph app={win.app} size={16} />
            <span className="truncate text-[12px] text-white/85">{title}</span>
          </span>
        )}
        <Controls app={win.app} max={win.max} gnome={gnome} wm={wm} id={win.id} />
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
    </motion.div>
  )
}

function Controls({ app, id, max, gnome, wm }: { app: GuestApp; id: string; max: boolean; gnome: boolean; wm: WindowManager }) {
  const buttons = [
    { key: 'min', label: 'Minimise', icon: <Minus size={gnome ? 13 : 15} strokeWidth={gnome ? 2.4 : 1.6} />, onClick: () => wm.minimize(id) },
    {
      key: 'max',
      label: max ? 'Restore' : 'Maximise',
      icon: max ? <Copy size={gnome ? 11 : 12} strokeWidth={2} /> : <Square size={gnome ? 10 : 11} strokeWidth={gnome ? 2.4 : 1.6} />,
      onClick: () => wm.toggleMax(id),
    },
    { key: 'close', label: 'Close', icon: <X size={gnome ? 13 : 16} strokeWidth={gnome ? 2.4 : 1.5} />, onClick: () => wm.close(id) },
  ]
  if (gnome) {
    return (
      <span className="absolute right-2.5 flex items-center gap-2">
        {buttons.map((b) => (
          <button
            key={b.key}
            type="button"
            aria-label={b.label}
            data-agent={`win.${app}.${b.key}`}
            onClick={b.onClick}
            className="flex size-6 items-center justify-center rounded-full bg-white/10 text-white/85 transition outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {b.icon}
          </button>
        ))}
      </span>
    )
  }
  return (
    <span className="flex h-full items-stretch">
      {buttons.map((b) => (
        <button
          key={b.key}
          type="button"
          aria-label={b.label}
          data-agent={`win.${app}.${b.key}`}
          onClick={b.onClick}
          className={cn(
            'flex w-11 items-center justify-center text-white/80 transition outline-none focus-visible:bg-white/15',
            b.key === 'close' ? 'hover:bg-[#d63c3c] hover:text-white' : 'hover:bg-white/10',
          )}
        >
          {b.icon}
        </button>
      ))}
    </span>
  )
}
