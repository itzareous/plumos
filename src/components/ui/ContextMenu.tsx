import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/cn'

export interface MenuItem {
  label: string
  icon?: ReactNode
  onSelect: () => void
  danger?: boolean
  disabled?: boolean
}

export type MenuEntry = MenuItem | 'separator'

interface MenuState {
  x: number
  y: number
  items: MenuEntry[]
}

/**
 * Right-click (or long-press) menus.
 *
 *   const menu = useContextMenu()
 *   <div onContextMenu={menu.handler(() => [...items])} />
 *   {menu.element}
 */
export function useContextMenu() {
  const [state, setState] = useState<MenuState | null>(null)
  const close = () => setState(null)

  const handler = (items: () => MenuEntry[]) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState({ x: e.clientX, y: e.clientY, items: items() })
  }

  const openAt = (x: number, y: number, items: MenuEntry[]) => setState({ x, y, items })

  return { handler, openAt, close, element: <ContextMenu state={state} onClose={close} /> }
}

function ContextMenu({ state, onClose }: { state: MenuState | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useLayoutEffect(() => {
    if (!state || !ref.current) return
    // offsetWidth/Height ignore the entrance scale animation's transform.
    const width = ref.current.offsetWidth
    const height = ref.current.offsetHeight
    setPos({
      x: Math.max(8, Math.min(state.x, window.innerWidth - width - 8)),
      y: Math.max(8, Math.min(state.y, window.innerHeight - height - 8)),
    })
  }, [state])

  useEffect(() => {
    if (!state) return
    // Capture phase + preventDefault so Escape closes only the menu, not the sheet behind it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, { capture: true })
    window.addEventListener('blur', onClose)
    window.addEventListener('resize', onClose)
    return () => {
      window.removeEventListener('keydown', onKey, { capture: true })
      window.removeEventListener('blur', onClose)
      window.removeEventListener('resize', onClose)
    }
  }, [state, onClose])

  return createPortal(
    <AnimatePresence>
      {state && (
        <div
          className="fixed inset-0 z-[90]"
          onMouseDown={onClose}
          onContextMenu={(e) => {
            e.preventDefault()
            onClose()
          }}
        >
          <motion.div
            ref={ref}
            role="menu"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
            transition={{ type: 'spring', stiffness: 600, damping: 36 }}
            style={{ left: pos.x, top: pos.y, transformOrigin: 'top left' }}
            className="glass-dark absolute min-w-[200px] rounded-2xl p-1.5"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {state.items.map((item, i) =>
              item === 'separator' ? (
                <div key={i} className="mx-2 my-1 h-px bg-white/10" />
              ) : (
                <button
                  key={i}
                  role="menuitem"
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    onClose()
                    item.onSelect()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-sm transition-colors disabled:opacity-40',
                    item.danger ? 'text-red-400 hover:bg-red-500/15' : 'text-white/90 hover:bg-white/10',
                  )}
                >
                  {item.icon && <span className="flex size-4 items-center justify-center opacity-80">{item.icon}</span>}
                  {item.label}
                </button>
              ),
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
