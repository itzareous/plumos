/** Loads an image file so it can be drawn on a canvas. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That file isn’t an image this browser can open.'))
    }
    img.src = url
  })
}

export interface Encoded {
  dataUrl: string
  width: number
  height: number
}

/**
 * Downscales an image to at most `maxWidth` wide and encodes it as a JPEG
 * data URL, small enough to keep in local storage.
 */
export async function encodeImage(file: File, maxWidth = 2560, quality = 0.85): Promise<Encoded> {
  const img = await loadImage(file)
  const scale = Math.min(1, maxWidth / img.naturalWidth)
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Couldn’t process the image.')
  // JPEG has no alpha: give transparent images a dark backdrop instead of black.
  ctx.fillStyle = '#0b0d14'
  ctx.fillRect(0, 0, width, height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)
  return { dataUrl: canvas.toDataURL('image/jpeg', quality), width, height }
}

/** True for the error browsers throw when local storage is full. */
export function isQuotaError(e: unknown) {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014)
  )
}
