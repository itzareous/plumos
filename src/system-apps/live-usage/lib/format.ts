import { formatBytes } from '@/lib/format'

/** Bytes per second → "1.2 MB/s". */
export const formatRate = (bytesPerSecond: number) =>
  bytesPerSecond < 1 ? '0 B/s' : `${formatBytes(bytesPerSecond)}/s`

/** 12.345 → "12.3%"; tiny non-zero values stay honest instead of rounding to 0. */
export function formatCpu(percent: number): string {
  if (percent <= 0) return '0%'
  if (percent < 0.1) return '<0.1%'
  return `${percent < 10 ? percent.toFixed(1) : Math.round(percent)}%`
}

/** Wall-clock time of a sample, with seconds: "14:32:05". */
export const formatClock = (t: number) =>
  new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' })

/** Celsius in the user's unit, split so the unit can be typeset smaller. */
export function temperatureParts(celsius: number, unit: 'c' | 'f') {
  const value = unit === 'f' ? (celsius * 9) / 5 + 32 : celsius
  return { value: Math.round(value), unit: unit === 'f' ? 'F' : 'C' }
}
