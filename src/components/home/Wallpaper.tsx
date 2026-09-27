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

  const isCustom = wallpaper === 'custom' && Boolean(customWallpaper)
  useEffect(() => {
    const set = (accent: string) => document.documentElement.style.setProperty('--plumos-accent', accent)
    if (!isCustom || !customWallpaper) {
      set(preset.accent)
      return
    }
    let cancelled = false
    accentFromImage(customWallpaper).then((accent) => !cancelled && set(accent))
    return () => {
      cancelled = true
    }
  }, [isCustom, customWallpaper, preset.accent])

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

/** Picks a pleasant accent from an image: its most saturated average hue, brightened. */
async function accentFromImage(src: string): Promise<string> {
  const fallback = '#8b7cf6'
  try {
    const img = new Image()
    img.src = src
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 24
    const ctx = canvas.getContext('2d')
    if (!ctx) return fallback
    ctx.drawImage(img, 0, 0, 24, 24)
    const data = ctx.getImageData(0, 0, 24, 24).data
    // Weight each pixel by its saturation so grey skies and black sand don't win.
    let r = 0
    let g = 0
    let b = 0
    let weight = 0
    for (let i = 0; i < data.length; i += 4) {
      const max = Math.max(data[i], data[i + 1], data[i + 2])
      const min = Math.min(data[i], data[i + 1], data[i + 2])
      const w = (max - min) / 255 + 0.02
      r += data[i] * w
      g += data[i + 1] * w
      b += data[i + 2] * w
      weight += w
    }
    const [h, sat] = rgbToHsl(r / weight, g / weight, b / weight)
    return `hsl(${Math.round(h)} ${Math.round(Math.max(45, Math.min(85, sat)))}% 68%)`
  } catch {
    return fallback
  }
}

function rgbToHsl(r: number, g: number, b: number): [number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s * 100]
}
