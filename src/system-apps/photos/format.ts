const DAY = 86_400_000

export const monthKey = (t: number) => {
  const d = new Date(t)
  return d.getFullYear() * 12 + d.getMonth()
}

export const monthLabel = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

export const shortMonth = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })

/** "Lisbon, Sintra & 2 more" — the first part of each distinct place name. */
export function placesSummary(places: (string | null)[]): string {
  const seen: string[] = []
  for (const p of places) {
    if (!p || p === 'Home') continue
    const short = p.split(',')[0]
    if (!seen.includes(short)) seen.push(short)
  }
  if (!seen.length) return ''
  if (seen.length <= 2) return seen.join(' & ')
  return `${seen.slice(0, 2).join(', ')} & ${seen.length - 2} more`
}

/** Seconds → "0:42" or "2:05". */
export const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

export const count = (n: number) => n.toLocaleString()

export const plural = (n: number, one: string, many = `${one}s`) => `${count(n)} ${n === 1 ? one : many}`

export function dayLabel(t: number, now = Date.now()) {
  const d = new Date(t)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - new Date(d).setHours(0, 0, 0, 0)) / DAY)
  if (diff <= 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: 'long' })
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}

export const fullDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const timeOfDay = (t: number) => new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

/** "2008 – 2012", "March 2025" or "Mar – Sep 2026" for a set of dates. */
export function dateRange(dates: number[]): string {
  if (!dates.length) return ''
  const min = Math.min(...dates)
  const max = Math.max(...dates)
  const a = new Date(min)
  const b = new Date(max)
  if (a.getFullYear() !== b.getFullYear()) return `${a.getFullYear()} – ${b.getFullYear()}`
  if (a.getMonth() === b.getMonth()) return monthLabel(min)
  return `${a.toLocaleDateString(undefined, { month: 'short' })} – ${b.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
}
