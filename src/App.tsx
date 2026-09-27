import { useEffect } from 'react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import { IconDefs } from '@/components/icons/AppIcon'
import { CommandPalette } from '@/components/home/CommandPalette'
import { Dock } from '@/components/home/Dock'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { Home } from '@/components/home/Home'
import { Wallpaper } from '@/components/home/Wallpaper'
import { SheetHost } from '@/components/ui/Sheet'
import { Toaster } from '@/components/ui/Toaster'
import { useSettings } from '@/stores/settings'
import { startSystemPolling } from '@/stores/system'
import { useWindows } from '@/stores/windows'

// Handy for screenshots and debugging: window.plumos.open('settings')
if (import.meta.env.DEV) {
  Object.assign(window, { plumos: { open: useWindows.getState().open, close: useWindows.getState().close } })
}

export function App() {
  const reduceTransparency = useSettings((s) => s.reduceTransparency)
  const onboarded = useSettings((s) => s.onboarded)

  useEffect(() => startSystemPolling(), [])
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-transparency', reduceTransparency)
  }, [reduceTransparency])

  return (
    <MotionConfig reducedMotion="user">
      <IconDefs />
      <Wallpaper />
      <Home />
      <Dock />
      <SheetHost />
      <CommandPalette />
      <AnimatePresence>{!onboarded && <Onboarding />}</AnimatePresence>
      <Toaster />
    </MotionConfig>
  )
}
