import { AnimatePresence, motion } from 'motion/react'
import { ExternalLink, Info, Link2, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { AppIcon } from '@/components/icons/AppIcon'
import { useContextMenu } from '@/components/ui/ContextMenu'
import { findApp } from '@/apps/catalog'
import type { AppInfo } from '@/apps/types'
import { useApps, useInstalledApps } from '@/stores/apps'
import { useWindows } from '@/stores/windows'
import { toast } from '@/stores/toasts'
import { launchApp } from '@/lib/launch'

export function AppGrid() {
  const apps = useInstalledApps()
  const installing = useApps((s) => s.installing)
  const uninstall = useApps((s) => s.uninstall)
  const move = useApps((s) => s.move)
  const open = useWindows((s) => s.open)
  const menu = useContextMenu()
  const pending = Object.entries(installing)
    .map(([id, state]) => ({ app: findApp(id), state }))
    .filter((x): x is { app: AppInfo; state: (typeof installing)[string] } => Boolean(x.app))

  const menuFor = (app: AppInfo) => () => [
    { label: 'Open', icon: <ExternalLink size={15} />, onSelect: () => launchApp(app) },
    { label: 'Details', icon: <Info size={15} />, onSelect: () => open('app-details', { appId: app.id }) },
    ...(app.kind !== 'vm'
      ? [{ label: 'Edit link…', icon: <Link2 size={15} />, onSelect: () => open('app-details', { appId: app.id, edit: 'link' }) }]
      : []),
    'separator' as const,
    {
      label: 'Uninstall',
      icon: <Trash2 size={15} />,
      danger: true,
      onSelect: () => {
        uninstall(app.id)
        toast(`${app.name} was uninstalled`, { icon: <AppIcon icon={app.icon} size={32} /> })
      },
    },
  ]

  const gridRef = useRef<HTMLDivElement>(null)

  // While dragging an icon, move it into the slot under the pointer. Slots are
  // found from offsetLeft/Top — the final layout position, unaffected by the
  // transforms of tiles that are still animating — so the order can't flicker.
  const dragOver = (id: string, point: { x: number; y: number }) => {
    const grid = gridRef.current
    if (!grid) return
    const rect = grid.getBoundingClientRect()
    const x = point.x - window.scrollX - rect.left
    const y = point.y - window.scrollY - rect.top
    const target = [...grid.querySelectorAll<HTMLElement>('[data-app-id]')].find(
      (el) =>
        el.dataset.appId !== id &&
        x >= el.offsetLeft &&
        x <= el.offsetLeft + el.offsetWidth &&
        y >= el.offsetTop &&
        y <= el.offsetTop + el.offsetHeight,
    )
    const { installed } = useApps.getState()
    const to = target?.dataset.appId ? installed.indexOf(target.dataset.appId) : -1
    if (to !== -1 && installed.indexOf(id) !== to) move(id, to)
  }

  return (
    <>
      <div ref={gridRef} className="relative grid w-full max-w-[880px] grid-cols-4 gap-x-2 gap-y-6 sm:grid-cols-5 sm:gap-y-7 lg:grid-cols-6">
        <AnimatePresence initial={false}>
          {apps.map((app, i) => (
            <AppTile
              key={app.id}
              app={app}
              index={i}
              onContextMenu={menu.handler(menuFor(app))}
              onDragOver={(point) => dragOver(app.id, point)}
            />
          ))}
          {pending.map(({ app, state }) => (
            <AppTile key={app.id} app={app} index={apps.length} progress={state.progress} />
          ))}
        </AnimatePresence>
      </div>
      {menu.element}
    </>
  )
}

// Rearranging by drag is mouse-only so it never fights with touch scrolling.
const finePointer = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

function AppTile({
  app,
  index,
  progress,
  onContextMenu,
  onDragOver,
}: {
  app: AppInfo
  index: number
  progress?: number
  onContextMenu?: (e: React.MouseEvent) => void
  onDragOver?: (point: { x: number; y: number }) => void
}) {
  const [launching, setLaunching] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragged = useRef(false)
  const installing = progress !== undefined
  const draggable = finePointer && !installing && Boolean(onDragOver)

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{
        default: { type: 'spring', stiffness: 380, damping: 28, delay: Math.min(index, 12) * 0.018 },
        layout: { type: 'spring', stiffness: 520, damping: 40 },
      }}
      disabled={installing}
      data-app-id={installing ? undefined : app.id}
      drag={draggable}
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={1}
      onDragStart={() => {
        dragged.current = true
        setDragging(true)
      }}
      onDrag={(_, info) => onDragOver?.(info.point)}
      onDragEnd={() => {
        setDragging(false)
        // The click that ends a drag must not launch the app.
        setTimeout(() => (dragged.current = false), 0)
      }}
      style={{ zIndex: dragging ? 20 : undefined }}
      onClick={() => {
        if (dragged.current) return
        setLaunching(true)
        setTimeout(() => setLaunching(false), 500)
        launchApp(app)
      }}
      onContextMenu={onContextMenu}
      className="group flex flex-col items-center gap-2 rounded-2xl py-1 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      title={app.name}
    >
      <motion.div
        className="relative"
        transition={{ duration: 0.45 }}
        animate={dragging ? { scale: 1.12 } : launching ? { scale: [1, 0.86, 1.06, 1] } : { scale: 1 }}
        whileHover={installing || dragging ? undefined : { y: -3 }}
        whileTap={{ scale: 0.92 }}
      >
        <div className="size-[58px] sm:size-[66px]">
          <AppIcon icon={app.icon} size={66} className="origin-top-left max-sm:scale-[0.879]" />
        </div>
        {installing && <InstallOverlay progress={progress} />}
      </motion.div>
      <span
        className="text-on-wallpaper max-w-full truncate px-1 text-[12.5px] font-semibold text-white transition-opacity sm:text-[13px]"
        style={{ opacity: dragging ? 0 : 1 }}
      >
        {installing ? 'Installing…' : app.name}
      </span>
    </motion.button>
  )
}

function InstallOverlay({ progress }: { progress: number }) {
  const r = 17
  const c = 2 * Math.PI * r
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-[24%] bg-black/55 backdrop-blur-[2px]">
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgb(255 255 255 / 0.25)" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 300ms ease' }}
        />
      </svg>
    </div>
  )
}
