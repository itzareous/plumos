import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useSettings } from '@/stores/settings'
import { useWindows } from '@/stores/windows'
import { findWallpaper } from '@/lib/wallpapers'

/** Full-screen wallpaper. Blurs and zooms slightly while a sheet is open. */
export function Wallpaper() {
  const { wallpaper, customWallpaper } = useSettings()
  const sheetOpen = useWindows((s) => s.sheet !== null)
  const preset = findWallpaper(wallpaper)
  const url = wallpaper === 'custom' && customWallpaper ? customWallpaper : preset.url
  const thumb = wallpaper === 'custom' && customWallpaper ? customWallpaper : preset.thumb
  const [loaded, setLoaded] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.style.setProperty('--plumos-accent', preset.accent)
  }, [preset.accent])

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden bg-[#0b0d14]"
      animate={{ scale: sheetOpen ? 1.06 : 1, filter: sheetOpen ? 'blur(18px) brightness(0.7)' : 'blur(0px) brightness(1)' }}
      transition={{ type: 'spring', stiffness: 160, damping: 30 }}
    >
      <img src={thumb} alt="" className="absolute inset-0 size-full scale-105 object-cover blur-2xl" draggable={false} />
      <img
        key={url}
        src={url}
        alt=""
        draggable={false}
        onLoad={() => setLoaded(url)}
        className="absolute inset-0 size-full object-cover transition-opacity duration-700"
        style={{ opacity: loaded === url ? 1 : 0 }}
      />
      {/* Gentle vignette keeps white text readable on bright wallpapers. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(0_0_0/0.28)_100%)]" />
    </motion.div>
  )
}
