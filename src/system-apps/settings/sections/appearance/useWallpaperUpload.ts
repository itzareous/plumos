import { useState } from 'react'
import { useSettings } from '@/stores/settings'
import { toast } from '@/stores/toasts'
import { encodeImage, isQuotaError } from '../../lib/image'

/** Sizes to try, largest first, until the image fits in local storage. */
const ATTEMPTS = [
  { maxWidth: 2560, quality: 0.85 },
  { maxWidth: 1920, quality: 0.8 },
  { maxWidth: 1440, quality: 0.75 },
]

/**
 * Turns a picked image into the custom wallpaper: downscaled, stored as a
 * data URL in settings, and selected.
 */
export function useWallpaperUpload() {
  const [busy, setBusy] = useState(false)

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('That’s not an image', { description: 'Choose a JPEG, PNG, WebP or HEIC photo.' })
      return
    }
    setBusy(true)
    const { wallpaper: previous, customWallpaper: previousCustom, set } = useSettings.getState()
    try {
      for (const attempt of ATTEMPTS) {
        const { dataUrl } = await encodeImage(file, attempt.maxWidth, attempt.quality)
        try {
          set({ customWallpaper: dataUrl, wallpaper: 'custom' })
          toast('Wallpaper updated', { description: file.name })
          return
        } catch (e) {
          // Persisting throws after the in-memory state changed: put it back.
          useSettings.setState({ customWallpaper: previousCustom, wallpaper: previous })
          if (!isQuotaError(e)) throw e
        }
      }
      toast('Couldn’t save that wallpaper', { description: 'It’s too big for this browser’s storage. Try a smaller image.' })
    } catch (e) {
      toast('Couldn’t use that image', { description: e instanceof Error ? e.message : 'Try a different file.' })
    } finally {
      setBusy(false)
    }
  }

  return { upload, busy }
}
