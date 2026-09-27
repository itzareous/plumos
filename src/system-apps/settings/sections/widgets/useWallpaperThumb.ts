import { findWallpaper } from '@/lib/wallpapers'
import { useSettings } from '@/stores/settings'

/** The current wallpaper's small image, for backdrops behind widget previews. */
export function useWallpaperThumb() {
  const wallpaper = useSettings((s) => s.wallpaper)
  const custom = useSettings((s) => s.customWallpaper)
  return wallpaper === 'custom' && custom ? custom : findWallpaper(wallpaper).thumb
}
