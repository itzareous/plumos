import { motion } from 'motion/react'
import { Activity, Image, LayoutGrid, ShoppingBag } from 'lucide-react'
import { useContextMenu } from '@/components/ui/ContextMenu'
import { widgetRegistry } from '@/components/widgets/registry'
import { useSettings } from '@/stores/settings'
import { useWindows } from '@/stores/windows'
import { AppGrid } from './AppGrid'
import { Greeting } from './Greeting'
import { SearchButton } from './SearchButton'

export function Home() {
  const widgets = useSettings((s) => s.widgets)
  const sheetOpen = useWindows((s) => s.sheet !== null)
  const open = useWindows((s) => s.open)
  const menu = useContextMenu()

  return (
    <motion.main
      className="scrollbar-none h-full overflow-y-auto"
      animate={{ scale: sheetOpen ? 0.94 : 1, opacity: sheetOpen ? 0 : 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      aria-hidden={sheetOpen}
      onContextMenu={menu.handler(() => [
        { label: 'Change wallpaper', icon: <Image size={15} />, onSelect: () => open('settings', { section: 'appearance' }) },
        { label: 'Edit widgets', icon: <LayoutGrid size={15} />, onSelect: () => open('settings', { section: 'widgets' }) },
        'separator',
        { label: 'App Store', icon: <ShoppingBag size={15} />, onSelect: () => open('app-store') },
        { label: 'Live Usage', icon: <Activity size={15} />, onSelect: () => open('live-usage') },
      ])}
    >
      <div className="mx-auto flex min-h-full max-w-[1100px] flex-col items-center px-4 pt-[clamp(28px,7vh,80px)] pb-32">
        <Greeting />

        {widgets.length > 0 && (
          <div className="scrollbar-none -mx-4 mt-[clamp(20px,4vh,40px)] flex w-[calc(100%+2rem)] snap-x snap-mandatory gap-5 overflow-x-auto px-6 py-3 lg:justify-center lg:gap-7">
            {widgets.map((id) => {
              const Widget = widgetRegistry[id]?.component
              return Widget ? <Widget key={id} /> : null
            })}
          </div>
        )}

        <div className="mt-[clamp(20px,4.5vh,48px)] flex w-full justify-center">
          <AppGrid />
        </div>

        <div className="mt-[clamp(20px,4vh,40px)]">
          <SearchButton />
        </div>
      </div>
      {menu.element}
    </motion.main>
  )
}
