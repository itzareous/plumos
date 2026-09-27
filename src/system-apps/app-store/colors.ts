import type { AppInfo } from '@/apps/types'

export interface AppColors {
  /** Gradient start (lighter). */
  from: string
  /** Gradient end (deeper). */
  to: string
  /** The most vivid colour, for highlights in illustrations. */
  accent: string
}

// Hand-picked for the drawn artwork, which has no CSS gradient to read from.
const artColors: Record<string, [string, string, string]> = {
  android: ['#86e39c', '#1f7a3a', '#86e39c'],
  windows: ['#5cb4ff', '#1d5fae', '#5cb4ff'],
  linux: ['#ffd166', '#5b3a8c', '#ffd166'],
  'home-assistant': ['#4fd2f7', '#17a0dc', '#4fd2f7'],
  'hermes-agent': ['#d9d4c5', '#3a3a3a', '#e8e2cf'],
  immich: ['#ffb81f', '#f06bc2', '#ff9f43'],
  jellyfin: ['#b26bff', '#3bb6ff', '#9b7bff'],
  n8n: ['#ff7a9c', '#ea4f7a', '#ff7a9c'],
  nextcloud: ['#35b1ff', '#1478d4', '#35b1ff'],
  'bitcoin-node': ['#ffc93d', '#f7931a', '#ffb02e'],
  ollama: ['#e8e6df', '#5b5b5b', '#e8e6df'],
  openclaw: ['#ff6a5c', '#c81e1e', '#ff6a5c'],
  plex: ['#ffd84d', '#f5a300', '#ffc21a'],
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}

function fromHsl(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/** How colourful a colour looks: saturation, discounted near black and white. */
function vividness(hex: string) {
  const [, s, l] = toHsl(hex)
  return s * Math.max(0, 1 - Math.abs(l - 0.58) * 2.2)
}

/** Lifts dark colours so they read as highlights on the dark UI. */
function brighten(hex: string) {
  const [h, s, l] = toHsl(hex)
  return l >= 0.55 ? hex : fromHsl(h, Math.min(s, 0.85), 0.62)
}

const cache = new Map<string, AppColors>()

/** The colours of an app's icon, used to tint banners, cards and screenshots. */
export function appColors(app: AppInfo): AppColors {
  const hit = cache.get(app.id)
  if (hit) return hit
  let result: AppColors
  if (app.icon.type === 'art') {
    const [from, to, accent] = artColors[app.icon.art] ?? ['#a78bfa', '#4c1d95', '#a78bfa']
    result = { from, to, accent }
  } else {
    const stops = app.icon.background.match(/#[0-9a-f]{3,8}\b/gi) ?? ['#a78bfa', '#4c1d95']
    const from = stops[0]
    const to = stops[stops.length - 1]
    const candidates = [from, to, ...(app.icon.color ? [app.icon.color] : [])]
    const accent = candidates.reduce((best, c) => (vividness(c) > vividness(best) ? c : best))
    result = { from, to, accent: brighten(accent) }
  }
  cache.set(app.id, result)
  return result
}

/** `#rrggbb` + alpha → `rgb(r g b / a)`. */
export function withAlpha(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex)
  return `rgb(${r} ${g} ${b} / ${alpha})`
}

/** A small deterministic random generator, so illustrations look the same on every render. */
export function seeded(seed: string) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
