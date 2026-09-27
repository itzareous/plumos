import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { Glass } from '@/components/ui/Glass'
import { iconArt } from '@/components/icons/art'
import { sheetRegistry } from '@/system-apps/registry'
import { useWindows, type SheetId } from '@/stores/windows'

const BASE = 50
const MAX = 76
const REACH = 140

const dockItems = (Object.entries(sheetRegistry) as [SheetId, (typeof sheetRegistry)[SheetId]][]).filter(
  ([, entry]) => entry.dock,
)

export function Dock() {
  const mouseX = useMotionValue(Infinity)
  const active = useWindows((s) => s.sheet?.id)
  const open = useWindows((s) => s.open)
  const close = useWindows((s) => s.close)
  // Magnification only makes sense with a mouse.
  const [canHover] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches)

  return (
    <nav className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-3 pb-[env(safe-area-inset-bottom)] sm:bottom-4">
      <Glass
        radius={24}
        refraction={50}
        depth={0.25}
        blur={4}
        tint="rgb(255 255 255 / 0.08)"
        className="flex items-end gap-2.5 px-2.5 py-2 sm:gap-3 sm:px-3"
        style={{ height: BASE + 18 }}
      >
        <div
          className="flex h-full items-end gap-2.5 sm:gap-3"
          onMouseMove={(e) => canHover && mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
        >
          {dockItems.map(([id, entry]) => (
            <DockItem
              key={id}
              label={entry.name}
              art={entry.art}
              mouseX={mouseX}
              active={active === id}
              onClick={() => (active === id ? close() : open(id))}
            />
          ))}
        </div>
      </Glass>
    </nav>
  )
}

function DockItem({
  label,
  art,
  mouseX,
  active,
  onClick,
}: {
  label: string
  art: string
  mouseX: MotionValue<number>
  active: boolean
  onClick: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [hovered, setHovered] = useState(false)

  const distance = useTransform(mouseX, (x) => {
    const box = ref.current?.getBoundingClientRect()
    return box ? x - box.left - box.width / 2 : Infinity
  })
  const target = useTransform(distance, [-REACH, 0, REACH], [BASE, MAX, BASE], { clamp: true })
  const size = useSpring(target, { mass: 0.1, stiffness: 180, damping: 13 })

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.88 }}
      style={{ width: size, height: size }}
      className="relative mb-0 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white/60 max-sm:!size-11 rounded-[24%]"
    >
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, y: 6, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 4, x: '-50%' }}
            className="glass-dark pointer-events-none absolute -top-10 left-1/2 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      <svg
        viewBox="0 0 100 100"
        className="size-full overflow-hidden rounded-[24%] shadow-[0_6px_16px_-4px_rgb(0_0_0/0.45)]"
        style={{ clipPath: 'inset(0 round 24%)' }}
      >
        {iconArt[art]}
        <rect width="100" height="50" fill="url(#dock-sheen)" />
        <defs>
          <linearGradient id="dock-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className="absolute -bottom-[7px] left-1/2 size-1 -translate-x-1/2 rounded-full bg-white transition-opacity"
        style={{ opacity: active ? 0.9 : 0 }}
      />
    </motion.button>
  )
}
