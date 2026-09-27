import { AnimatePresence, motion } from 'motion/react'
import { ExternalLink, Info, Link2, Trash2 } from 'lucide-react'
import { useState } from 'react'
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

  return (
    <>
      <div className="grid w-full max-w-[880px] grid-cols-4 gap-x-2 gap-y-6 sm:grid-cols-5 sm:gap-y-7 lg:grid-cols-6">
        <AnimatePresence initial={false}>
          {apps.map((app, i) => (
            <AppTile key={app.id} app={app} index={i} onContextMenu={menu.handler(menuFor(app))} />
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

function AppTile({
  app,
  index,
  progress,
  onContextMenu,
}: {
  app: AppInfo
  index: number
  progress?: number
  onContextMenu?: (e: React.MouseEvent) => void
}) {
  const [launching, setLaunching] = useState(false)
  const installing = progress !== undefined

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28, delay: Math.min(index, 12) * 0.018 }}
      disabled={installing}
      onClick={() => {
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
        animate={launching ? { scale: [1, 0.86, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 0.45 }}
        whileHover={installing ? undefined : { y: -3 }}
        whileTap={{ scale: 0.92 }}
      >
        <div className="size-[58px] sm:size-[66px]">
          <AppIcon icon={app.icon} size={66} className="origin-top-left max-sm:scale-[0.879]" />
        </div>
        {installing && <InstallOverlay progress={progress} />}
      </motion.div>
      <span className="text-on-wallpaper max-w-full truncate px-1 text-[12.5px] font-semibold text-white sm:text-[13px]">
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
