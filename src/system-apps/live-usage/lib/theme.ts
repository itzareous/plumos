/**
 * Chart colours. Each card plots one quantity, so one hue per card; the
 * network pair (download/upload) shares a chart and was checked for
 * colour-blind separation against the card surface.
 */
export const COLORS = {
  cpu: '#3b93f5',
  memory: '#8f7ff0',
  memorySystem: '#c7befc',
  memoryCache: 'rgb(255 255 255 / 0.3)',
  storage: '#1fae7c',
  download: '#199ccd',
  upload: '#e0692f',
} as const

/** Approximate colour of a card inside the sheet; rings around dots use it. */
export const SURFACE = '#1d1d26'

/** Reserved for state (temperature), never for series. Always shown with a label. */
export const STATUS = {
  good: '#22b35e',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#e04848',
} as const

export type Level = keyof typeof STATUS

export function temperatureLevel(celsius: number): { level: Level; label: string } {
  if (celsius >= 90) return { level: 'critical', label: 'Critical' }
  if (celsius >= 80) return { level: 'serious', label: 'Hot' }
  if (celsius >= 70) return { level: 'warning', label: 'Warm' }
  return { level: 'good', label: 'Normal' }
}

/** Tints an icon chip with the card's colour. */
export const tint = (hex: string, alpha = 0.16) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${alpha})`
}
