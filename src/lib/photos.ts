/**
 * Plumos Photos: the demo library and a procedural "camera".
 *
 * Every demo photo is painted on a canvas from its seed, so the library looks
 * lived-in without shipping a single image. Painting is deterministic and
 * resolution independent: a seed renders the same picture as a 300px
 * thumbnail or a 1600px viewer image. Thumbnails are painted lazily in idle
 * time and cached as object URLs.
 */
import { useEffect, useState, type RefObject } from 'react'

// ---------------------------------------------------------------------------
// Types

export type Scene =
  | 'sunset'
  | 'mountains'
  | 'lake'
  | 'city'
  | 'forest'
  | 'beach'
  | 'snow'
  | 'flowers'
  | 'desert'
  | 'aurora'
  | 'family'
  | 'table'
  | 'screenshot'

export type PhotoSource = 'library' | 'phone' | 'drive' | 'computer'

export interface Exif {
  aperture: number
  shutter: string
  iso: number
  focal: number
}

export interface Photo {
  id: string
  seed: number
  scene: Scene
  /** Capture time, ms since epoch. */
  date: number
  place: string | null
  camera: string
  /** Pixel size of the original. */
  width: number
  height: number
  favorite: boolean
  video?: { duration: number }
  /** `me` is the signed-in person's private library; `shared` is the family space. */
  owner: 'me' | 'shared'
  /** Who put a shared photo in the family space: `me` or a member id. Derived from the seed when unset. */
  addedBy?: string
  /** Album ids this photo belongs to. */
  albums: string[]
  source: PhotoSource
  /** File name of the original. */
  name: string
  /** Size of the original in bytes. */
  bytes: number
  exif?: Exif
  /** Older digital-camera look: faded, warm and grainy. */
  vintage?: boolean
  /** Orange date stamp burned into the corner, like old compacts did. */
  stamp?: boolean
  /** Object URL of the original, for files added from this computer. */
  url?: string
  mime?: string
  /** When it landed in the library; drives the appear animation. */
  addedAt?: number
}

export type PhotoSize = 'thumb' | 'full'

// ---------------------------------------------------------------------------
// Randomness

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const between = (r: Rng, a: number, b: number) => a + (b - a) * r()
const intIn = (r: Rng, a: number, b: number) => Math.min(b, Math.floor(between(r, a, b + 1)))
const pick = <T>(r: Rng, list: readonly T[]): T => list[Math.min(list.length - 1, Math.floor(r() * list.length))]
function weighted<T>(r: Rng, list: readonly (readonly [T, number])[]): T {
  const total = list.reduce((s, [, w]) => s + w, 0)
  let x = r() * total
  for (const [v, w] of list) {
    x -= w
    if (x <= 0) return v
  }
  return list[list.length - 1][0]
}

// ---------------------------------------------------------------------------
// Colour

type RGB = readonly [number, number, number]

function hsl(h: number, s: number, l: number): RGB {
  const hh = (((h % 360) + 360) % 360) / 360
  const ss = Math.max(0, Math.min(100, s)) / 100
  const ll = Math.max(0, Math.min(100, l)) / 100
  const k = (n: number) => (n + hh * 12) % 12
  const a = ss * Math.min(ll, 1 - ll)
  const f = (n: number) => ll - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0) * 255, f(8) * 255, f(4) * 255]
}
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const rgba = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`
const WHITE: RGB = [255, 255, 255]
const BLACK: RGB = [0, 0, 0]
const TAU = Math.PI * 2

// ---------------------------------------------------------------------------
// Canvas helpers

type Ctx = CanvasRenderingContext2D
type Op = GlobalCompositeOperation

function layer(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const cv = document.createElement('canvas')
  cv.width = Math.max(1, Math.round(w))
  cv.height = Math.max(1, Math.round(h))
  return [cv, cv.getContext('2d')!]
}

let filterSupport: boolean | null = null
function canFilter() {
  if (filterSupport === null) {
    const [, c] = layer(1, 1)
    c.filter = 'blur(2px)'
    filterSupport = c.filter === 'blur(2px)'
  }
  return filterSupport
}

/** Draws `src` onto `c` blurred. Falls back to a downscale blur where canvas filters are missing. */
function blurInto(c: Ctx, src: HTMLCanvasElement, radius: number, op: Op = 'source-over', alpha = 1) {
  c.save()
  c.globalCompositeOperation = op
  c.globalAlpha = alpha
  if (radius < 0.4) c.drawImage(src, 0, 0)
  else if (canFilter()) {
    c.filter = `blur(${radius}px)`
    c.drawImage(src, 0, 0)
  } else {
    const k = Math.max(1, radius / 1.2)
    const [small, sc] = layer(src.width / k, src.height / k)
    sc.imageSmoothingQuality = 'high'
    sc.drawImage(src, 0, 0, small.width, small.height)
    c.imageSmoothingQuality = 'high'
    c.drawImage(small, 0, 0, src.width, src.height)
  }
  c.restore()
}

/** Paints on a fresh layer, then composites it blurred. */
function soft(c: Ctx, W: number, H: number, radius: number, draw: (l: Ctx) => void, op?: Op, alpha?: number) {
  const [cv, l] = layer(W, H)
  draw(l)
  blurInto(c, cv, radius, op, alpha)
}

function vgrad(c: Ctx, y0: number, y1: number, stops: [number, RGB, number?][]) {
  const g = c.createLinearGradient(0, y0, 0, y1)
  for (const [o, col, a] of stops) g.addColorStop(Math.max(0, Math.min(1, o)), rgba(col, a ?? 1))
  return g
}

function glow(c: Ctx, x: number, y: number, radius: number, color: RGB, a: number, op: Op = 'screen') {
  const g = c.createRadialGradient(x, y, 0, x, y, radius)
  g.addColorStop(0, rgba(color, a))
  g.addColorStop(0.3, rgba(color, a * 0.45))
  g.addColorStop(1, rgba(color, 0))
  c.save()
  c.globalCompositeOperation = op
  c.fillStyle = g
  c.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  c.restore()
}

/** Midpoint-displacement ridge, normalised to 0..1. A fixed number of samples keeps it resolution independent. */
function ridge(r: Rng, detail = 7, rough = 0.55): number[] {
  const size = 2 ** detail + 1
  const pts = new Array<number>(size).fill(0)
  pts[0] = r()
  pts[size - 1] = r()
  let step = size - 1
  let amp = 0.9
  while (step > 1) {
    const half = step >> 1
    for (let i = half; i < size - 1; i += step) pts[i] = (pts[i - half] + pts[i + half]) / 2 + (r() - 0.5) * amp
    amp *= rough
    step = half
  }
  let min = Infinity
  let max = -Infinity
  for (const v of pts) {
    min = Math.min(min, v)
    max = Math.max(max, v)
  }
  return pts.map((v) => (v - min) / (max - min || 1))
}

function sampleRidge(pts: number[], u: number) {
  const f = Math.max(0, Math.min(1, u)) * (pts.length - 1)
  const i = Math.floor(f)
  const j = Math.min(pts.length - 1, i + 1)
  return pts[i] + (pts[j] - pts[i]) * (f - i)
}

function ridgePath(c: Ctx, W: number, H: number, pts: number[], base: number, amp: number) {
  c.beginPath()
  c.moveTo(-2, H + 2)
  for (let i = 0; i < pts.length; i++) c.lineTo((i / (pts.length - 1)) * (W + 4) - 2, base - pts[i] * amp)
  c.lineTo(W + 2, H + 2)
  c.closePath()
}

/** A smooth curve built from a few sines, in -1..1. */
function waves(r: Rng, n = 3) {
  const parts = Array.from({ length: n }, (_, i) => ({ f: between(r, 0.5, 1.4) * (i + 1), p: r(), a: 1 / (i + 1.3) }))
  const norm = parts.reduce((s, x) => s + x.a, 0)
  return (u: number) => parts.reduce((s, x) => s + x.a * Math.sin((u * x.f + x.p) * TAU), 0) / norm
}

function pine(c: Ctx, x: number, y: number, h: number) {
  const w = h * 0.34
  const right: [number, number][] = []
  const tiers = 4
  for (let i = 1; i <= tiers; i++) {
    const t = i / tiers
    const ty = y - h + h * 0.86 * t
    right.push([x + w * t, ty], [x + w * t * 0.36, ty - h * 0.012])
  }
  right.pop()
  c.beginPath()
  c.moveTo(x, y - h)
  for (const [px, py] of right) c.lineTo(px, py)
  c.lineTo(x + h * 0.028, y - h * 0.14)
  c.lineTo(x + h * 0.028, y)
  c.lineTo(x - h * 0.028, y)
  c.lineTo(x - h * 0.028, y - h * 0.14)
  for (const [px, py] of [...right].reverse()) c.lineTo(2 * x - px, py)
  c.closePath()
  c.fill()
}

function snowOnPine(c: Ctx, x: number, y: number, h: number) {
  const w = h * 0.34
  c.lineCap = 'round'
  c.lineWidth = Math.max(0.6, h * 0.035)
  for (let i = 1; i <= 4; i++) {
    const t = i / 4
    const top = y - h + h * 0.86 * (t - 0.25) + h * 0.03
    const ty = y - h + h * 0.86 * t
    c.beginPath()
    c.moveTo(x - w * t * 0.7, ty - h * 0.03)
    c.quadraticCurveTo(x, top, x + w * t * 0.7, ty - h * 0.03)
    c.stroke()
  }
}

function cumulus(c: Ctx, r: Rng, x: number, y: number, w: number, lit: RGB, shade: RGB, alpha = 1) {
  c.save()
  c.beginPath()
  c.rect(x - w, y - w, w * 2, w + w * 0.04)
  c.clip()
  c.fillStyle = vgrad(c, y - w * 0.36, y + w * 0.04, [
    [0, lit, alpha],
    [0.55, mix(lit, shade, 0.25), alpha],
    [1, shade, alpha],
  ])
  for (let i = 0; i < 10; i++) {
    const t = i / 9
    const bx = x + (t - 0.5) * w * 0.92 + between(r, -0.04, 0.04) * w
    const br = w * (0.08 + 0.17 * Math.sin(t * Math.PI)) * between(r, 0.75, 1.25)
    c.beginPath()
    c.arc(bx, y - br * 0.5, br, 0, TAU)
    c.fill()
  }
  c.restore()
}

function bokehDisc(c: Ctx, x: number, y: number, rad: number, col: RGB, a: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, rad)
  g.addColorStop(0, rgba(col, a * 0.7))
  g.addColorStop(0.8, rgba(col, a * 0.85))
  g.addColorStop(0.93, rgba(mix(col, WHITE, 0.25), a))
  g.addColorStop(1, rgba(col, 0))
  c.fillStyle = g
  c.beginPath()
  c.arc(x, y, rad, 0, TAU)
  c.fill()
}

function vignette(c: Ctx, W: number, H: number, a: number) {
  const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.62)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(0,0,0,${a})`)
  c.fillStyle = g
  c.fillRect(0, 0, W, H)
}

let noiseTile: HTMLCanvasElement | null = null
function grain(c: Ctx, W: number, H: number, a: number) {
  if (!noiseTile) {
    const [cv, n] = layer(128, 128)
    const img = n.createImageData(128, 128)
    const r = mulberry32(99)
    for (let i = 0; i < 128 * 128; i++) {
      const v = r() * 255
      img.data[i * 4] = v
      img.data[i * 4 + 1] = v
      img.data[i * 4 + 2] = v
      img.data[i * 4 + 3] = 255
    }
    n.putImageData(img, 0, 0)
    noiseTile = cv
  }
  const pattern = c.createPattern(noiseTile, 'repeat')
  if (!pattern) return
  c.save()
  c.globalAlpha = a
  c.globalCompositeOperation = 'overlay'
  c.fillStyle = pattern
  c.fillRect(0, 0, W, H)
  c.restore()
}

function fadeToVintage(c: Ctx, W: number, H: number) {
  c.save()
  c.globalCompositeOperation = 'saturation'
  c.fillStyle = 'rgba(128,128,128,0.3)'
  c.fillRect(0, 0, W, H)
  c.globalCompositeOperation = 'soft-light'
  c.fillStyle = 'rgba(255,168,90,0.4)'
  c.fillRect(0, 0, W, H)
  c.globalCompositeOperation = 'lighten'
  c.fillStyle = 'rgb(30,26,32)'
  c.fillRect(0, 0, W, H)
  c.restore()
}

function dateStamp(c: Ctx, W: number, H: number, date: number) {
  const d = new Date(date)
  const text = `'${String(d.getFullYear()).slice(2)}  ${d.getMonth() + 1}  ${d.getDate()}`
  const size = Math.min(W, H) * 0.05
  c.save()
  c.font = `700 ${size}px ui-monospace, Menlo, Consolas, monospace`
  c.textAlign = 'right'
  c.textBaseline = 'bottom'
  c.shadowColor = 'rgba(255,110,30,0.9)'
  c.shadowBlur = size * 0.35
  c.fillStyle = 'rgba(255,152,64,0.96)'
  c.fillText(text, W - size * 1.1, H - size * 0.8)
  c.restore()
}

// ---------------------------------------------------------------------------
// Scenes

interface SceneDef<P> {
  palette(r: Rng): P
  /** Two representative colours, used for the placeholder before the thumbnail is painted. */
  tone(p: P): [RGB, RGB]
  paint(c: Ctx, W: number, H: number, r: Rng, p: P): void
}

const sunset: SceneDef<{
  skyTop: RGB
  skyMid: RGB
  skyLow: RGB
  horizon: RGB
  sun: RGB
  seaTop: RGB
  seaBottom: RGB
  cloudLit: RGB
  cloudDark: RGB
  clouds: number
  land: boolean
}> = {
  palette(r) {
    const warm = between(r, 6, 36)
    const dusk = between(r, 235, 320)
    return {
      skyTop: hsl(dusk - 15, 48, 13),
      skyMid: hsl(dusk + 12, 42, 36),
      skyLow: hsl(warm, 82, 58),
      horizon: hsl(warm + 18, 96, 76),
      sun: hsl(warm + 30, 100, 90),
      seaTop: hsl(dusk - 5, 30, 34),
      seaBottom: hsl(dusk - 20, 45, 8),
      cloudLit: hsl(warm + 4, 88, 68),
      cloudDark: hsl(dusk + 16, 32, 24),
      clouds: r(),
      land: r() < 0.5,
    }
  },
  tone: (p) => [p.skyLow, p.seaBottom],
  paint(c, W, H, r, p) {
    const m = Math.min(W, H)
    const hz = H * between(r, 0.54, 0.68)
    c.fillStyle = vgrad(c, 0, hz, [
      [0, p.skyTop],
      [0.42, p.skyMid],
      [0.8, p.skyLow],
      [1, p.horizon],
    ])
    c.fillRect(0, 0, W, hz + 1)
    const sx = W * between(r, 0.28, 0.72)
    const sr = m * between(r, 0.035, 0.065)
    const sy = hz - sr * between(r, -0.2, 2.2)
    glow(c, sx, sy, m * 0.95, p.horizon, 0.5)
    glow(c, sx, sy, m * 0.22, p.sun, 0.85)

    const bands = 2 + Math.floor(p.clouds * 5)
    soft(c, W, H, m * 0.01, (l) => {
      for (let i = 0; i < bands; i++) {
        const cy = hz * between(r, 0.1, 0.84)
        const cx = W * r()
        const cw = W * between(r, 0.25, 0.8)
        const ch = m * between(r, 0.008, 0.032)
        const near = cy / hz
        l.fillStyle = vgrad(l, cy - ch, cy + ch, [
          [0, p.cloudDark, 0.9],
          [1, mix(p.cloudDark, p.cloudLit, 0.35 + near * 0.65), 0.95],
        ])
        for (let k = 0; k < 5; k++) {
          l.beginPath()
          l.ellipse(
            cx + (k - 2) * cw * 0.22 + between(r, -1, 1) * cw * 0.05,
            cy + between(r, -1, 1) * ch * 0.6,
            cw * between(r, 0.18, 0.34),
            ch * between(r, 0.6, 1.2),
            0,
            0,
            TAU,
          )
          l.fill()
        }
      }
    })

    c.save()
    c.beginPath()
    c.rect(0, 0, W, hz)
    c.clip()
    c.fillStyle = rgba(p.sun)
    c.beginPath()
    c.arc(sx, sy, sr, 0, TAU)
    c.fill()
    c.restore()

    const landPts = ridge(r, 6, 0.5)
    const fromLeft = r() < 0.5
    if (p.land) {
      c.fillStyle = rgba(mix(p.cloudDark, p.seaBottom, 0.55))
      c.beginPath()
      c.moveTo(fromLeft ? -2 : W + 2, hz + 1)
      for (let i = 0; i <= 40; i++) {
        const u = i / 40
        const env = Math.pow(1 - u, 1.6)
        const x = fromLeft ? u * W * 0.5 : W - u * W * 0.5
        c.lineTo(x, hz - env * (0.4 + 0.6 * sampleRidge(landPts, u)) * hz * 0.16)
      }
      c.lineTo(fromLeft ? W * 0.5 : W * 0.5, hz + 1)
      c.closePath()
      c.fill()
    }

    c.fillStyle = vgrad(c, hz, H, [
      [0, mix(p.seaTop, p.horizon, 0.4)],
      [0.1, p.seaTop],
      [1, p.seaBottom],
    ])
    c.fillRect(0, hz, W, H - hz)

    soft(
      c,
      W,
      H,
      m * 0.004,
      (l) => {
        for (let i = 0; i < 70; i++) {
          const t = i / 70
          const y = hz + (H - hz) * Math.pow(t, 1.35) + r() * m * 0.004
          const spread = sr * (1.1 + t * 7)
          const w = spread * between(r, 0.25, 1.1)
          const x = sx + between(r, -1, 1) * spread * 0.5 - w / 2
          l.fillStyle = rgba(mix(p.sun, p.skyLow, t), (1 - t) * 0.6 + 0.12)
          l.fillRect(x, y, w, Math.max(1, m * between(r, 0.002, 0.006)))
        }
      },
      'screen',
    )
    for (let i = 0; i < 90; i++) {
      const t = r()
      const y = hz + (H - hz) * t * t
      c.fillStyle = rgba(r() < 0.5 ? p.seaBottom : p.skyMid, 0.2)
      const w = W * between(r, 0.02, 0.16) * (0.3 + t)
      c.fillRect(W * r() - w / 2, y, w, Math.max(1, m * 0.002 * (1 + t * 2)))
    }
  },
}

type Mood = 'dawn' | 'day' | 'dusk' | 'mist'
function moodColors(mood: Mood, h: number) {
  switch (mood) {
    case 'dawn':
      return { skyTop: hsl(222 + h, 42, 56), skyBottom: hsl(24 + h, 82, 84), far: hsl(252 + h, 22, 72), near: hsl(245 + h, 30, 15), sun: hsl(36, 100, 90) }
    case 'day':
      return { skyTop: hsl(212 + h, 68, 50), skyBottom: hsl(200 + h, 60, 87), far: hsl(212 + h, 28, 74), near: hsl(165 + h, 28, 15), sun: hsl(50, 100, 96) }
    case 'dusk':
      return { skyTop: hsl(258 + h, 38, 24), skyBottom: hsl(18 + h, 86, 66), far: hsl(282 + h, 22, 48), near: hsl(262 + h, 34, 9), sun: hsl(30, 100, 82) }
    case 'mist':
      return { skyTop: hsl(210 + h, 16, 68), skyBottom: hsl(200 + h, 16, 90), far: hsl(210 + h, 12, 76), near: hsl(200 + h, 18, 22), sun: hsl(45, 40, 96) }
  }
}

const mountains: SceneDef<ReturnType<typeof moodColors> & { mood: Mood; snow: boolean; birds: boolean; sunOn: boolean }> = {
  palette(r) {
    const mood = pick(r, ['dawn', 'day', 'dusk', 'mist', 'day'] as const)
    return { mood, ...moodColors(mood, between(r, -14, 14)), snow: r() < 0.6, birds: r() < 0.3, sunOn: r() < 0.55 }
  },
  tone: (p) => [p.skyBottom, p.near],
  paint(c, W, H, r, p) {
    const m = Math.min(W, H)
    c.fillStyle = vgrad(c, 0, H * 0.7, [
      [0, p.skyTop],
      [1, p.skyBottom],
    ])
    c.fillRect(0, 0, W, H)
    const sunX = W * between(r, 0.2, 0.8)
    const sunY = H * between(r, 0.18, 0.42)
    if (p.sunOn) {
      glow(c, sunX, sunY, m * 0.8, p.sun, 0.55)
      c.fillStyle = rgba(p.sun, 0.9)
      c.beginPath()
      c.arc(sunX, sunY, m * 0.03, 0, TAU)
      c.fill()
    }
    const n = 5 + Math.floor(r() * 3)
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      const base = H * (0.5 + 0.42 * Math.pow(t, 0.9))
      const amp = H * (0.3 - 0.19 * t) * between(r, 0.75, 1.1)
      const pts = ridge(r, 7, t < 0.3 ? 0.58 : 0.5).map((v) => Math.pow(v, t < 0.3 ? 1.35 : 1.1))
      const col = mix(p.far, p.near, Math.pow(t, 0.8))
      c.fillStyle = vgrad(c, base - amp, base + H * 0.1, [
        [0, mix(col, p.skyBottom, 0.12)],
        [1, col],
      ])
      ridgePath(c, W, H, pts, base, amp)
      c.fill()
      const snowline = ridge(r, 6, 0.62)
      if (i === 0 && p.snow) {
        c.save()
        ridgePath(c, W, H, pts, base, amp)
        c.clip()
        c.beginPath()
        c.moveTo(-2, -2)
        c.lineTo(W + 2, -2)
        for (let k = snowline.length - 1; k >= 0; k--) {
          c.lineTo((k / (snowline.length - 1)) * W, base - amp * (0.42 + 0.4 * snowline[k]))
        }
        c.closePath()
        c.fillStyle = vgrad(c, base - amp, base - amp * 0.45, [
          [0, mix(WHITE, p.skyBottom, 0.1), 0.92],
          [0.6, mix(WHITE, p.far, 0.3), 0.55],
          [1, mix(WHITE, p.far, 0.5), 0.05],
        ])
        c.fill()
        c.restore()
      }
      if (i < n - 1) {
        c.fillStyle = vgrad(c, base - amp * 0.35, base, [
          [0, p.skyBottom, 0],
          [1, mix(p.skyBottom, p.far, 0.3), 0.5],
        ])
        c.fillRect(0, base - amp * 0.35, W, H - base + amp * 0.35)
      } else {
        c.fillStyle = rgba(mix(p.near, BLACK, 0.2))
        for (let k = 0; k < 34; k++) {
          const u = r()
          pine(c, u * W, base - sampleRidge(pts, u) * amp + m * 0.01, m * between(r, 0.04, 0.1))
        }
      }
    }
    if (p.birds) {
      c.strokeStyle = rgba(p.near, 0.7)
      c.lineWidth = Math.max(0.8, m * 0.0035)
      const bx = W * between(r, 0.2, 0.7)
      const by = H * between(r, 0.12, 0.3)
      for (let i = 0; i < 5; i++) {
        const x = bx + between(r, -0.08, 0.08) * W
        const y = by + between(r, -0.05, 0.05) * H
        const s = m * between(r, 0.008, 0.016)
        c.beginPath()
        c.moveTo(x - s, y - s * 0.3)
        c.quadraticCurveTo(x - s * 0.5, y - s * 0.7, x, y)
        c.quadraticCurveTo(x + s * 0.5, y - s * 0.7, x + s, y - s * 0.3)
        c.stroke()
      }
    }
  },
}

const lake: SceneDef<ReturnType<typeof moodColors> & { water: RGB; trees: RGB; dock: boolean; clouds: number }> = {
  palette(r) {
    const mood = pick(r, ['day', 'dawn', 'dusk', 'mist', 'day'] as const)
    const col = moodColors(mood, between(r, -10, 10))
    return {
      ...col,
      water: mix(col.skyTop, col.near, 0.55),
      trees: mix(col.near, hsl(150, 30, 12), 0.5),
      dock: r() < 0.35,
      clouds: intIn(r, 0, 3),
    }
  },
  tone: (p) => [p.skyBottom, p.water],
  paint(c, W, H, r, p) {
    const m = Math.min(W, H)
    const hz = Math.round(H * between(r, 0.46, 0.58))
    const [top, t] = layer(W, hz)
    t.fillStyle = vgrad(t, 0, hz, [
      [0, p.skyTop],
      [1, p.skyBottom],
    ])
    t.fillRect(0, 0, W, hz)
    for (let i = 0; i < p.clouds; i++) {
      cumulus(t, r, W * r(), hz * between(r, 0.2, 0.45), m * between(r, 0.25, 0.5), WHITE, mix(p.skyTop, p.near, 0.2), 0.9)
    }
    for (let i = 0; i < 3; i++) {
      const tt = i / 2
      const pts = ridge(r, 7, 0.55).map((v) => Math.pow(v, 1.3))
      const amp = hz * (0.5 - tt * 0.25) * between(r, 0.7, 1)
      const base = hz - hz * 0.02 * (2 - i)
      t.fillStyle = rgba(mix(p.far, p.near, 0.2 + tt * 0.5))
      ridgePath(t, W, hz, pts, base, amp)
      t.fill()
      t.fillStyle = vgrad(t, base - amp * 0.3, base, [
        [0, p.skyBottom, 0],
        [1, p.skyBottom, 0.35],
      ])
      t.fillRect(0, base - amp * 0.3, W, amp * 0.3)
    }
    t.fillStyle = rgba(p.trees)
    for (let i = 0; i < 70; i++) {
      const x = (i / 70) * W + between(r, -0.01, 0.01) * W
      pine(t, x, hz + 1, hz * between(r, 0.07, 0.2))
    }
    c.drawImage(top, 0, 0)
    c.save()
    c.beginPath()
    c.rect(0, hz, W, H - hz)
    c.clip()
    c.translate(0, hz * 2)
    c.scale(1, -1)
    blurInto(c, top, m * 0.004)
    c.restore()
    c.fillStyle = vgrad(c, hz, H, [
      [0, p.water, 0.25],
      [1, mix(p.water, BLACK, 0.3), 0.7],
    ])
    c.fillRect(0, hz, W, H - hz)
    for (let i = 0; i < 90; i++) {
      const y = hz + (H - hz) * Math.pow(r(), 1.4)
      const w = W * between(r, 0.03, 0.25)
      c.fillStyle = r() < 0.6 ? rgba(p.skyBottom, 0.14) : rgba(BLACK, 0.12)
      c.fillRect(W * r() - w / 2, y, w, Math.max(1, m * 0.0025))
    }
    c.fillStyle = rgba(p.skyBottom, 0.35)
    c.fillRect(0, hz, W, Math.max(1, m * 0.003))
    if (p.dock) {
      const dx = W * between(r, 0.35, 0.65)
      const farY = hz + (H - hz) * 0.4
      c.fillStyle = rgba(hsl(25, 25, 16))
      c.beginPath()
      c.moveTo(dx - W * 0.02, farY)
      c.lineTo(dx + W * 0.02, farY)
      c.lineTo(dx + W * 0.2, H + 2)
      c.lineTo(dx - W * 0.2, H + 2)
      c.closePath()
      c.fill()
      c.strokeStyle = rgba(BLACK, 0.45)
      c.lineWidth = Math.max(0.6, m * 0.002)
      for (let k = 1; k < 16; k++) {
        const tt = Math.pow(k / 16, 1.8)
        const y = farY + (H - farY) * tt
        const hw = W * (0.02 + 0.18 * tt)
        c.beginPath()
        c.moveTo(dx - hw, y)
        c.lineTo(dx + hw, y)
        c.stroke()
      }
    }
  },
}

const city: SceneDef<{
  skyTop: RGB
  skyBottom: RGB
  far: RGB
  near: RGB
  lights: RGB[]
  bokeh: boolean
  moon: boolean
  water: boolean
}> = {
  palette(r) {
    const hue = between(r, 215, 250)
    const glowHue = pick(r, [22, 280, 318, 200, 30])
    return {
      skyTop: hsl(hue, 50, 6),
      skyBottom: hsl(glowHue, 48, 24),
      far: hsl(hue, 24, 16),
      near: hsl(hue, 30, 7),
      lights: [hsl(40, 95, 70), hsl(32, 92, 62), hsl(200, 70, 78), hsl(330, 80, 72), hsl(48, 60, 92)],
      bokeh: r() < 0.45,
      moon: r() < 0.3,
      water: r() < 0.55,
    }
  },
  tone: (p) => [p.skyBottom, p.near],
  paint(c, W, H, r, p) {
    const m = Math.min(W, H)
    const base = H * (p.water ? between(r, 0.58, 0.68) : between(r, 0.8, 0.92))
    c.fillStyle = vgrad(c, 0, base, [
      [0, p.skyTop],
      [0.6, mix(p.skyTop, p.skyBottom, 0.5)],
      [1, p.skyBottom],
    ])
    c.fillRect(0, 0, W, H)
    for (let i = 0; i < 40; i++) {
      const s = m * between(r, 0.001, 0.003)
      c.fillStyle = rgba(WHITE, between(r, 0.15, 0.7))
      c.fillRect(r() * W, r() * base * 0.55, s, s)
    }
    const moonX = W * between(r, 0.15, 0.85)
    const moonY = base * between(r, 0.12, 0.35)
    if (p.moon) {
      glow(c, moonX, moonY, m * 0.25, hsl(45, 40, 85), 0.35)
      c.fillStyle = rgba(hsl(45, 40, 92))
      c.beginPath()
      c.arc(moonX, moonY, m * 0.03, 0, TAU)
      c.fill()
    }
    glow(c, W * 0.5, base, W * 0.8, p.skyBottom, 0.5)

    for (let u = -0.02; u < 1; ) {
      const bw = between(r, 0.025, 0.06)
      const bh = between(r, 0.08, 0.3)
      c.fillStyle = rgba(p.far)
      c.fillRect(u * W, base - bh * H, bw * W + 1, bh * H + 1)
      const n = intIn(r, 3, 14)
      for (let k = 0; k < n; k++) {
        c.fillStyle = rgba(pick(r, p.lights), between(r, 0.2, 0.45))
        const s = m * 0.006
        c.fillRect((u + r() * bw) * W, base - r() * bh * H, s, s * 1.2)
      }
      u += bw * between(r, 0.8, 1.05)
    }
    let tallest = { x: 0, top: H, w: 0 }
    for (let u = -0.03; u < 1; ) {
      const bw = between(r, 0.04, 0.11)
      const bh = between(r, 0.14, 0.5) * (p.water ? 0.85 : 1)
      const x = u * W
      const w = bw * W
      const topY = base - bh * H
      if (topY < tallest.top) tallest = { x, top: topY, w }
      c.fillStyle = vgrad(c, topY, base, [
        [0, mix(p.near, p.far, 0.35)],
        [1, p.near],
      ])
      c.fillRect(x, topY, w + 1, bh * H + 1)
      if (r() < 0.3) c.fillRect(x + w * 0.2, topY - H * 0.02, w * 0.6, H * 0.02 + 1)
      const cols = intIn(r, 3, 8)
      const rows = Math.max(3, Math.round(bh * intIn(r, 36, 60)))
      const lit = between(r, 0.12, 0.5)
      const color = pick(r, p.lights)
      const cw = w / cols
      const rh = (bh * H) / (rows + 1)
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (r() < lit) {
            c.fillStyle = rgba(r() < 0.85 ? color : pick(r, p.lights), between(r, 0.5, 0.95))
            c.fillRect(x + i * cw + cw * 0.25, topY + (j + 0.6) * rh, cw * 0.5, rh * 0.55)
          }
        }
      }
      u += bw * between(r, 0.85, 1.02)
    }
    c.strokeStyle = rgba(p.near)
    c.lineWidth = Math.max(1, m * 0.004)
    c.beginPath()
    c.moveTo(tallest.x + tallest.w / 2, tallest.top)
    c.lineTo(tallest.x + tallest.w / 2, tallest.top - H * 0.07)
    c.stroke()
    glow(c, tallest.x + tallest.w / 2, tallest.top - H * 0.07, m * 0.02, hsl(0, 90, 60), 0.9)

    if (p.water) {
      const [cv, l] = layer(W, H)
      l.drawImage(c.canvas, 0, 0)
      c.save()
      c.beginPath()
      c.rect(0, base, W, H - base)
      c.clip()
      c.fillStyle = rgba(p.near)
      c.fillRect(0, base, W, H - base)
      c.translate(0, base * 2)
      c.scale(1, -1)
      blurInto(c, cv, m * 0.008, 'source-over', 0.6)
      c.restore()
      c.fillStyle = vgrad(c, base, H, [
        [0, p.near, 0.35],
        [1, p.near, 0.85],
      ])
      c.fillRect(0, base, W, H - base)
      soft(
        c,
        W,
        H,
        m * 0.007,
        (sl) => {
          for (let i = 0; i < 80; i++) {
            sl.fillStyle = rgba(pick(r, p.lights), between(r, 0.06, 0.22))
            const h = (H - base) * between(r, 0.05, 0.45)
            sl.fillRect(r() * W, base + (H - base) * r() * 0.25, m * between(r, 0.004, 0.012), h)
          }
        },
        'screen',
      )
    }
    if (p.bokeh) {
      const [cv, l] = layer(W, H)
      l.drawImage(c.canvas, 0, 0)
      blurInto(c, cv, m * 0.025)
      c.save()
      c.globalCompositeOperation = 'screen'
      for (let i = 0; i < 44; i++) {
        bokehDisc(c, r() * W, H * between(r, 0.15, 1), m * between(r, 0.025, 0.11), pick(r, p.lights), between(r, 0.1, 0.42))
      }
      c.restore()
    }
  },
}

const forest: SceneDef<{ kind: string; fog: RGB; light: RGB; dark: RGB; leaf: RGB; ground: RGB; lightX: number }> = {
  palette(r) {
    const kind = pick(r, ['summer', 'autumn', 'mist', 'golden'] as const)
    const h = between(r, -10, 10)
    const P = {
      summer: { fog: hsl(88 + h, 28, 70), light: hsl(58, 90, 86), dark: hsl(120 + h, 25, 10), leaf: hsl(110 + h, 45, 30), ground: hsl(95 + h, 35, 17) },
      autumn: { fog: hsl(36 + h, 45, 68), light: hsl(40, 95, 80), dark: hsl(20 + h, 25, 10), leaf: hsl(24 + h, 78, 46), ground: hsl(25 + h, 45, 19) },
      mist: { fog: hsl(200 + h, 14, 74), light: hsl(200, 30, 93), dark: hsl(200 + h, 18, 14), leaf: hsl(170 + h, 18, 30), ground: hsl(180 + h, 14, 19) },
      golden: { fog: hsl(44 + h, 55, 66), light: hsl(44, 100, 82), dark: hsl(30 + h, 30, 9), leaf: hsl(80 + h, 45, 28), ground: hsl(60 + h, 35, 15) },
    }[kind]
    return { kind, ...P, lightX: between(r, 0.15, 0.85) }
  },
  tone: (p) => [p.fog, p.ground],
  paint(c, W, H, r, p) {
    const m = Math.min(W, H)
    const g0 = H * between(r, 0.74, 0.84)
    c.fillStyle = vgrad(c, 0, H, [
      [0, mix(p.fog, p.light, 0.4)],
      [0.55, p.fog],
      [1, mix(p.fog, p.ground, 0.8)],
    ])
    c.fillRect(0, 0, W, H)
    glow(c, p.lightX * W, -m * 0.05, m * 0.9, p.light, 0.75)
    soft(c, W, H, m * 0.025, (l) => {
      for (let i = 0; i < 26; i++) {
        l.fillStyle = rgba(mix(p.fog, p.leaf, between(r, 0.25, 0.5)), between(r, 0.35, 0.7))
        l.beginPath()
        l.arc(r() * W, H * between(r, -0.05, 0.28), m * between(r, 0.06, 0.16), 0, TAU)
        l.fill()
      }
    })
    const trunks = (n: number, t: number, w0: number, w1: number, blur: number, bottom: number) =>
      soft(c, W, H, m * blur, (l) => {
        for (let i = 0; i < n; i++) {
          const x = r() * W
          const w = m * between(r, w0, w1)
          const col = mix(p.fog, p.dark, t * between(r, 0.85, 1.1))
          const g = l.createLinearGradient(x - w / 2, 0, x + w / 2, 0)
          g.addColorStop(0, rgba(mix(col, BLACK, 0.2)))
          g.addColorStop(0.35, rgba(mix(col, p.light, 0.12)))
          g.addColorStop(1, rgba(mix(col, BLACK, 0.3)))
          l.fillStyle = g
          l.beginPath()
          l.moveTo(x - w * 0.42, -2)
          l.lineTo(x + w * 0.42, -2)
          l.lineTo(x + w * 0.5, bottom - w)
          l.quadraticCurveTo(x + w * 0.55, bottom, x + w * 1.1, bottom + w * 0.1)
          l.lineTo(x - w * 1.1, bottom + w * 0.1)
          l.quadraticCurveTo(x - w * 0.55, bottom, x - w * 0.5, bottom - w)
          l.closePath()
          l.fill()
        }
      })
    trunks(24, 0.22, 0.006, 0.016, 0.006, g0 - H * 0.08)
    soft(
      c,
      W,
      H,
      m * 0.02,
      (l) => {
        for (let i = 0; i < 7; i++) {
          const x0 = (p.lightX + between(r, -0.08, 0.08)) * W
          const spread = W * between(r, 0.04, 0.14)
          const x1 = x0 + between(r, -0.3, 0.3) * W
          l.fillStyle = vgrad(l, 0, H, [
            [0, p.light, between(r, 0.2, 0.4)],
            [1, p.light, 0],
          ])
          l.beginPath()
          l.moveTo(x0 - spread * 0.15, -2)
          l.lineTo(x0 + spread * 0.15, -2)
          l.lineTo(x1 + spread, H)
          l.lineTo(x1 - spread, H)
          l.closePath()
          l.fill()
        }
      },
      'screen',
    )
    trunks(12, 0.5, 0.014, 0.03, 0.0025, g0 - H * 0.03)
    c.fillStyle = vgrad(c, g0 - H * 0.04, H, [
      [0, p.ground, 0],
      [0.25, p.ground, 0.85],
      [1, mix(p.ground, BLACK, 0.3)],
    ])
    c.fillRect(0, g0 - H * 0.04, W, H)
    for (let i = 0; i < 34; i++) {
      const x = r() * W
      const y = g0 + (H - g0) * r()
      const s = m * between(r, 0.02, 0.06) * (0.6 + (y - g0) / (H - g0))
      c.fillStyle = rgba(mix(p.leaf, BLACK, between(r, 0.2, 0.6)), 0.85)
      for (let k = 0; k < 5; k++) {
        c.beginPath()
        c.ellipse(x, y, s, s * 0.22, -Math.PI / 2 + (k - 2) * 0.45, 0, TAU)
        c.fill()
      }
    }
    if (p.kind === 'autumn') {
      for (let i = 0; i < 70; i++) {
        c.fillStyle = rgba(hsl(between(r, 10, 45), 80, between(r, 35, 55)), 0.9)
        const y = r() < 0.7 ? g0 + (H - g0) * r() : H * r()
        c.beginPath()
        c.ellipse(r() * W, y, m * 0.007, m * 0.004, r() * TAU, 0, TAU)
        c.fill()
      }
    }
    trunks(intIn(r, 2, 4), 0.95, 0.05, 0.1, 0, H * 1.02)
    c.save()
    c.globalCompositeOperation = 'screen'
    for (let i = 0; i < 50; i++) {
      c.fillStyle = rgba(p.light, between(r, 0.3, 0.8))
      c.beginPath()
      c.arc((p.lightX + between(r, -0.2, 0.2)) * W, r() * H * 0.8, m * between(r, 0.001, 0.004), 0, TAU)
      c.fill()
    }
    c.restore()
  },
}

const beach: SceneDef<{
  skyTop: RGB
  skyBottom: RGB
  seaFar: RGB
  seaNear: RGB
  sand: RGB
  wet: RGB
  prop: 'none' | 'umbrella' | 'palm'
  stripe: RGB
  clouds: number
  headland: boolean
}> = {
  palette(r) {
    const h = between(r, -12, 12)
    return {
      skyTop: hsl(206 + h, 72, 50),
      skyBottom: hsl(196 + h, 62, 86),
      seaFar: hsl(212 + h, 66, 34),
      seaNear: hsl(176 + h, 62, 50),
      sand: hsl(38 + h / 2, 48, 79),
      wet: hsl(34 + h / 2, 28, 58),
      prop: pick(r, ['none', 'umbrella', 'palm', 'palm'] as const),
      stripe: hsl(pick(r, [0, 20, 200, 340, 45]), 80, 55),
      clouds: intIn(r, 1, 4),
      headland: r() < 0.4,
    }
  },
  tone: (p) => [p.skyBottom, p.sand],
  paint(c, W, H, r, p) {
    const m = Math.min(W, H)
    const hz = H * between(r, 0.38, 0.5)
    c.fillStyle = vgrad(c, 0, hz, [
      [0, p.skyTop],
      [1, p.skyBottom],
    ])
    c.fillRect(0, 0, W, hz + 1)
    glow(c, W * between(r, 0, 1), 0, m * 0.8, WHITE, 0.35)
    for (let i = 0; i < p.clouds; i++) {
      cumulus(c, r, W * r(), hz * between(r, 0.3, 0.8), m * between(r, 0.18, 0.42), WHITE, mix(p.skyTop, WHITE, 0.55))
    }
    if (p.headland) {
      const pts = ridge(r, 6, 0.5)
      const side = r() < 0.5
      c.fillStyle = rgba(mix(p.seaFar, p.skyBottom, 0.45))
      c.beginPath()
      c.moveTo(side ? 0 : W, hz + 1)
      for (let i = 0; i <= 30; i++) {
        const u = i / 30
        c.lineTo(side ? u * W * 0.4 : W - u * W * 0.4, hz - (1 - u) * hz * 0.1 * (0.5 + sampleRidge(pts, u)))
      }
      c.closePath()
      c.fill()
    }
    const shore = hz + (H - hz) * between(r, 0.32, 0.5)
    const wave = waves(r, 3)
    const shoreAt = (u: number) => shore + wave(u) * (H - hz) * 0.05
    c.fillStyle = vgrad(c, hz, shore, [
      [0, p.seaFar],
      [0.55, mix(p.seaFar, p.seaNear, 0.6)],
      [1, p.seaNear],
    ])
    c.fillRect(0, hz, W, H - hz)
    c.save()
    c.globalCompositeOperation = 'screen'
    for (let i = 0; i < 70; i++) {
      const y = hz + (shore - hz) * Math.pow(r(), 1.5)
      c.fillStyle = rgba(WHITE, between(r, 0.1, 0.4))
      c.fillRect(r() * W, y, W * between(r, 0.005, 0.03), Math.max(1, m * 0.002))
    }
    c.restore()
    const sandPath = (offset: number) => {
      c.beginPath()
      c.moveTo(-2, H + 2)
      for (let i = 0; i <= 60; i++) c.lineTo((i / 60) * W, shoreAt(i / 60) + offset)
      c.lineTo(W + 2, H + 2)
      c.closePath()
    }
    c.fillStyle = vgrad(c, shore, shore + (H - hz) * 0.14, [
      [0, mix(p.wet, p.seaNear, 0.3)],
      [1, p.wet],
    ])
    sandPath(0)
    c.fill()
    c.fillStyle = vgrad(c, shore, H, [
      [0, mix(p.wet, p.sand, 0.5)],
      [0.3, p.sand],
      [1, mix(p.sand, hsl(30, 40, 60), 0.4)],
    ])
    sandPath((H - hz) * 0.1)
    c.fill()
    soft(c, W, H, m * 0.003, (l) => {
      l.strokeStyle = rgba(WHITE, 0.85)
      l.lineWidth = m * 0.008
      l.beginPath()
      for (let i = 0; i <= 60; i++) l.lineTo((i / 60) * W, shoreAt(i / 60) + m * 0.003)
      l.stroke()
      l.strokeStyle = rgba(WHITE, 0.4)
      l.lineWidth = m * 0.004
      l.beginPath()
      for (let i = 0; i <= 60; i++) l.lineTo((i / 60) * W, shoreAt(i / 60) - (H - hz) * 0.05 + wave(i / 60 + 0.3) * m * 0.01)
      l.stroke()
    })
    for (let i = 0; i < 260; i++) {
      c.fillStyle = rgba(r() < 0.5 ? WHITE : hsl(30, 30, 45), 0.25)
      const s = Math.max(0.8, m * 0.002)
      c.fillRect(r() * W, shore + (H - shore) * (0.15 + 0.85 * r()), s, s)
    }
    if (p.prop === 'umbrella') {
      const ux = W * between(r, 0.2, 0.8)
      const uy = shore + (H - shore) * between(r, 0.4, 0.7)
      const uh = m * 0.32
      const ur = m * 0.2
      soft(c, W, H, m * 0.01, (l) => {
        l.fillStyle = rgba(hsl(30, 40, 35), 0.4)
        l.beginPath()
        l.ellipse(ux + ur * 0.4, uy + m * 0.02, ur, ur * 0.25, 0, 0, TAU)
        l.fill()
      })
      c.strokeStyle = rgba(hsl(30, 20, 90))
      c.lineWidth = m * 0.008
      c.beginPath()
      c.moveTo(ux, uy)
      c.lineTo(ux - m * 0.02, uy - uh)
      c.stroke()
      for (let k = 0; k < 6; k++) {
        c.fillStyle = rgba(k % 2 ? WHITE : p.stripe)
        c.beginPath()
        c.moveTo(ux - m * 0.02, uy - uh - ur * 0.35)
        const a0 = Math.PI + (k / 6) * Math.PI
        const a1 = Math.PI + ((k + 1) / 6) * Math.PI
        c.lineTo(ux - m * 0.02 + Math.cos(a0) * ur, uy - uh + Math.sin(a0) * ur * 0.25 + ur * 0.1)
        c.lineTo(ux - m * 0.02 + Math.cos(a1) * ur, uy - uh + Math.sin(a1) * ur * 0.25 + ur * 0.1)
        c.closePath()
        c.fill()
      }
    } else if (p.prop === 'palm') {
      const left = r() < 0.5
      const bx = left ? W * between(r, -0.02, 0.12) : W * between(r, 0.88, 1.02)
      const tx = bx + (left ? 1 : -1) * W * between(r, 0.12, 0.25)
      const ty = H * between(r, 0.08, 0.2)
      const col = rgba(hsl(120, 18, 12))
      c.strokeStyle = col
      c.lineCap = 'round'
      c.lineWidth = m * 0.03
      c.beginPath()
      c.moveTo(bx, H + 4)
      c.quadraticCurveTo(bx + (tx - bx) * 0.1, ty + (H - ty) * 0.35, tx, ty)
      c.stroke()
      for (let k = 0; k < 8; k++) {
        const a = -Math.PI / 2 + (k / 7 - 0.5) * Math.PI * 1.7 + between(r, -0.15, 0.15)
        const len = m * between(r, 0.2, 0.32)
        const ex = tx + Math.cos(a) * len
        const ey = ty + Math.sin(a) * len * 0.6 + len * 0.35
        c.lineWidth = m * 0.006
        c.beginPath()
        c.moveTo(tx, ty)
        c.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.6 - len * 0.1, ex, ey)
        c.stroke()
        for (let j = 1; j < 16; j++) {
          const t = j / 16
          const px = tx + (ex - tx) * t
          const py = ty + (ey - ty) * t - Math.sin(t * Math.PI) * len * 0.12
          const leaf = len * 0.22 * Math.sin(t * Math.PI * 0.9 + 0.2)
          c.lineWidth = m * 0.009
          c.beginPath()
          c.moveTo(px, py)
          c.lineTo(px + Math.cos(a + 1.2) * leaf, py + Math.sin(a + 1.2) * leaf + leaf * 0.5)
          c.moveTo(px, py)
          c.lineTo(px + Math.cos(a - 1.2) * leaf, py + Math.sin(a - 1.2) * leaf + leaf * 0.5)
          c.stroke()
        }
      }
    }
  },
}

const snow: SceneDef<{ skyTop: RGB; skyBottom: RGB; snowLit: RGB; snowShade: RGB; trees: RGB; cabin: boolean; falling: boolean }> = {
  palette(r) {
    const mood = pick(r, ['clear', 'overcast', 'dusk'] as const)
    const h = between(r, -8, 8)
    const P = {
      clear: { skyTop: hsl(210 + h, 70, 55), skyBottom: hsl(200 + h, 60, 88), snowLit: hsl(0, 0, 99), snowShade: hsl(212 + h, 45, 78) },
      overcast: { skyTop: hsl(215 + h, 12, 66), skyBottom: hsl(210 + h, 14, 86), snowLit: hsl(210, 10, 95), snowShade: hsl(215 + h, 18, 72) },
      dusk: { skyTop: hsl(250 + h, 35, 45), skyBottom: hsl(330 + h, 55, 82), snowLit: hsl(330, 45, 92), snowShade: hsl(245 + h, 35, 62) },
    }[mood]
    return { ...P, trees: hsl(155 + h, 28, 14), cabin: r() < 0.3, falling: mood !== 'clear' || r() < 0.3 }
  },
  tone: (p) => [p.skyBottom, p.snowShade],
  paint(c, W, H, r, p) {
    const m = Math.min(W, H)
    c.fillStyle = vgrad(c, 0, H * 0.6, [
      [0, p.skyTop],
      [1, p.skyBottom],
    ])
    c.fillRect(0, 0, W, H)
    for (let i = 0; i < 2; i++) {
      const pts = ridge(r, 7, 0.55).map((v) => Math.pow(v, 1.3))
      const base = H * (0.5 + i * 0.06)
      c.fillStyle = vgrad(c, base - H * 0.25, base, [
        [0, mix(p.snowLit, p.skyBottom, 0.3 + i * 0.1)],
        [1, mix(p.snowShade, p.skyBottom, 0.4)],
      ])
      ridgePath(c, W, H, pts, base, H * (0.26 - i * 0.08))
      c.fill()
    }
    const hills = 3
    for (let i = 0; i < hills; i++) {
      const t = i / (hills - 1)
      const wv = waves(r, 2)
      const base = H * (0.6 + t * 0.22)
      const amp = H * 0.05
      const hillY = (u: number) => base + wv(u) * amp
      c.fillStyle = vgrad(c, base - amp, H, [
        [0, p.snowLit],
        [0.5, mix(p.snowLit, p.snowShade, 0.5 + t * 0.2)],
        [1, p.snowShade],
      ])
      c.beginPath()
      c.moveTo(-2, H + 2)
      for (let k = 0; k <= 50; k++) c.lineTo((k / 50) * W, hillY(k / 50))
      c.lineTo(W + 2, H + 2)
      c.closePath()
      c.fill()
      const n = 12 + i * 4
      for (let k = 0; k < n; k++) {
        const u = r()
        const s = m * between(r, 0.05, 0.1) * (0.6 + t * 1.2)
        if (r() < 0.35) continue
        const x = u * W
        const y = hillY(u) + s * 0.08
        c.fillStyle = rgba(mix(p.trees, p.skyBottom, (1 - t) * 0.35))
        pine(c, x, y, s)
        c.strokeStyle = rgba(p.snowLit, 0.9)
        snowOnPine(c, x, y, s)
      }
      if (i === 1 && p.cabin) {
        const u = between(r, 0.25, 0.75)
        const x = u * W
        const y = hillY(u)
        const s = m * 0.09
        c.fillStyle = rgba(hsl(18, 35, 22))
        c.fillRect(x - s * 0.6, y - s * 0.55, s * 1.2, s * 0.6)
        c.fillStyle = rgba(p.snowLit)
        c.beginPath()
        c.moveTo(x - s * 0.8, y - s * 0.5)
        c.lineTo(x, y - s * 1.05)
        c.lineTo(x + s * 0.8, y - s * 0.5)
        c.closePath()
        c.fill()
        c.fillStyle = rgba(hsl(40, 100, 70))
        c.fillRect(x - s * 0.35, y - s * 0.38, s * 0.22, s * 0.18)
        c.fillRect(x + s * 0.13, y - s * 0.38, s * 0.22, s * 0.18)
        glow(c, x, y - s * 0.3, s * 1.2, hsl(38, 100, 65), 0.35)
      }
    }
    if (p.falling) {
      for (let i = 0; i < 150; i++) {
        c.fillStyle = rgba(WHITE, between(r, 0.5, 0.95))
        c.beginPath()
        c.arc(r() * W, r() * H, m * between(r, 0.002, 0.006), 0, TAU)
        c.fill()
      }
      soft(c, W, H, m * 0.006, (l) => {
        l.fillStyle = rgba(WHITE, 0.8)
        for (let i = 0; i < 14; i++) {
          l.beginPath()
          l.arc(r() * W, r() * H, m * between(r, 0.01, 0.02), 0, TAU)
          l.fill()
        }
      })
    }
  },
}

type FlowerKind = 'daisy' | 'cosmos' | 'sunflower' | 'poppy'
const flowers: SceneDef<{ kind: FlowerKind; bgA: RGB; bgB: RGB; petal: RGB; tip: RGB; center: RGB; stem: RGB; second: boolean }> = {
  palette(r) {
    const kind = pick(r, ['daisy', 'cosmos', 'sunflower', 'poppy'] as const)
    const bgHue = pick(r, [100, 120, 140, 300, 200])
    const petals: Record<FlowerKind, [RGB, RGB, RGB]> = {
      daisy: [hsl(40, 30, 92), hsl(0, 0, 100), hsl(45, 95, 52)],
      cosmos: [hsl(between(r, 310, 345), 70, 62), hsl(330, 80, 86), hsl(48, 95, 55)],
      sunflower: [hsl(44, 96, 54), hsl(50, 100, 70), hsl(24, 60, 18)],
      poppy: [hsl(between(r, 0, 12), 88, 48), hsl(10, 95, 62), hsl(250, 30, 10)],
    }
    const [petal, tip, center] = petals[kind]
    return {
      kind,
      bgA: hsl(bgHue, 35, 45),
      bgB: hsl(bgHue + 30, 40, 18),
      petal,
      tip,
      center,
      stem: hsl(110, 45, 32),
      second: r() < 0.6,
    }
  },
  tone: (p) => [p.bgA, p.bgB],
  paint(c, W, H, r, p) {
    const m = Math.min(W, H)
    const cx = W * between(r, 0.36, 0.64)
    const cy = H * between(r, 0.34, 0.52)
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, H) * 0.7)
    g.addColorStop(0, rgba(mix(p.bgA, WHITE, 0.15)))
    g.addColorStop(1, rgba(p.bgB))
    c.fillStyle = g
    c.fillRect(0, 0, W, H)
    soft(
      c,
      W,
      H,
      m * 0.012,
      (l) => {
        for (let i = 0; i < 20; i++) {
          bokehDisc(l, r() * W, r() * H, m * between(r, 0.04, 0.16), mix(p.bgA, pick(r, [WHITE, p.tip, hsl(60, 80, 80)]), 0.5), between(r, 0.12, 0.4))
        }
      },
      'screen',
    )
    const drawFlower = (l: Ctx, fx: number, fy: number, R: number, rot: number) => {
      const n = { daisy: intIn(r, 18, 24), cosmos: 8, sunflower: intIn(r, 22, 28), poppy: 5 }[p.kind]
      const width = { daisy: 0.12, cosmos: 0.3, sunflower: 0.16, poppy: 0.55 }[p.kind]
      const layers = p.kind === 'daisy' || p.kind === 'sunflower' ? 2 : 1
      for (let layerIdx = 0; layerIdx < layers; layerIdx++) {
        for (let k = 0; k < n; k++) {
          const a = rot + ((k + layerIdx * 0.5) / n) * TAU + between(r, -0.06, 0.06)
          const len = R * between(r, 0.88, 1.05) * (layerIdx ? 0.92 : 1)
          const wid = R * width
          l.save()
          l.translate(fx, fy)
          l.rotate(a)
          const pg = l.createLinearGradient(0, 0, len, 0)
          const shade = layerIdx === 0 && layers === 2 ? 0.25 : 0
          pg.addColorStop(0, rgba(mix(mix(p.petal, p.center, 0.35), BLACK, shade)))
          pg.addColorStop(0.45, rgba(mix(p.petal, BLACK, shade)))
          pg.addColorStop(1, rgba(mix(p.tip, BLACK, shade)))
          l.fillStyle = pg
          l.beginPath()
          l.moveTo(0, 0)
          l.bezierCurveTo(len * 0.3, -wid, len * 0.85, -wid, len, -wid * 0.15)
          if (p.kind === 'cosmos') {
            l.lineTo(len * 0.95, 0)
            l.lineTo(len, wid * 0.15)
          }
          l.bezierCurveTo(len * 0.85, wid, len * 0.3, wid, 0, 0)
          l.fill()
          l.strokeStyle = rgba(BLACK, 0.08)
          l.lineWidth = Math.max(0.5, R * 0.006)
          l.beginPath()
          l.moveTo(R * 0.1, 0)
          l.lineTo(len * 0.9, 0)
          l.stroke()
          l.restore()
        }
      }
      const cr = R * { daisy: 0.24, cosmos: 0.2, sunflower: 0.42, poppy: 0.22 }[p.kind]
      const cg = l.createRadialGradient(fx - cr * 0.3, fy - cr * 0.3, 0, fx, fy, cr)
      cg.addColorStop(0, rgba(mix(p.center, WHITE, 0.3)))
      cg.addColorStop(1, rgba(mix(p.center, BLACK, 0.35)))
      l.fillStyle = cg
      l.beginPath()
      l.arc(fx, fy, cr, 0, TAU)
      l.fill()
      l.fillStyle = rgba(mix(p.center, BLACK, 0.45), 0.8)
      for (let k = 0; k < 90; k++) {
        const rr = Math.sqrt(k / 90) * cr * 0.92
        const a = k * 2.39996
        l.beginPath()
        l.arc(fx + Math.cos(a) * rr, fy + Math.sin(a) * rr, cr * 0.035, 0, TAU)
        l.fill()
      }
    }
    if (p.second) {
      const fx = W * between(r, 0.05, 0.95)
      const fy = H * between(r, 0.1, 0.9)
      soft(c, W, H, m * 0.02, (l) => drawFlower(l, fx, fy, m * between(r, 0.12, 0.2), r() * TAU), 'source-over', 0.75)
    }
    const R = m * between(r, 0.2, 0.3)
    c.strokeStyle = rgba(p.stem)
    c.lineWidth = m * 0.014
    c.lineCap = 'round'
    c.beginPath()
    c.moveTo(cx, cy)
    const sx = cx + between(r, -0.15, 0.15) * W
    c.quadraticCurveTo(cx + between(r, -0.1, 0.1) * W, (cy + H) / 2, sx, H + 4)
    c.stroke()
    const ly = cy + (H - cy) * 0.55
    const lx = (cx + sx) / 2
    const dir = r() < 0.5 ? -1 : 1
    c.fillStyle = vgrad(c, ly - R * 0.3, ly + R * 0.3, [
      [0, mix(p.stem, WHITE, 0.15)],
      [1, mix(p.stem, BLACK, 0.3)],
    ])
    c.beginPath()
    c.moveTo(lx, ly)
    c.quadraticCurveTo(lx + dir * R * 0.5, ly - R * 0.45, lx + dir * R * 0.95, ly - R * 0.35)
    c.quadraticCurveTo(lx + dir * R * 0.5, ly + R * 0.05, lx, ly)
    c.fill()
    drawFlower(c, cx, cy, R, r() * TAU)
    glow(c, cx - R * 0.4, cy - R * 0.5, R * 1.4, WHITE, 0.12)
  },
}

const desert: SceneDef<{ skyTop: RGB; skyBottom: RGB; lit: RGB; shadow: RGB; mesa: boolean; sunOn: boolean; tracks: boolean; sunLeft: boolean }> = {
  palette(r) {
    const h = between(r, -8, 8)
    return {
      skyTop: hsl(205 + h, 55, 56),
      skyBottom: hsl(35 + h, 55, 86),
      lit: hsl(30 + h, 72, 64),
      shadow: hsl(16 + h, 58, 32),
      mesa: r() < 0.35,
      sunOn: r() < 0.5,
      tracks: r() < 0.3,
      sunLeft: r() < 0.5,
    }
  },
  tone: (p) => [p.skyBottom, p.lit],
  paint(c, W, H, r, p) {
    const m = Math.min(W, H)
    const hz = H * between(r, 0.4, 0.55)
    c.fillStyle = vgrad(c, 0, hz, [
      [0, p.skyTop],
      [1, p.skyBottom],
    ])
    c.fillRect(0, 0, W, H)
    if (p.sunOn) glow(c, p.sunLeft ? W * 0.18 : W * 0.82, hz * 0.35, m * 0.7, hsl(45, 100, 92), 0.7)
    if (p.mesa) {
      const n = intIn(r, 2, 4)
      c.fillStyle = rgba(mix(p.shadow, p.skyBottom, 0.45))
      for (let i = 0; i < n; i++) {
        const x = W * r()
        const w = W * between(r, 0.12, 0.3)
        const h = hz * between(r, 0.12, 0.3)
        c.beginPath()
        c.moveTo(x - w / 2 - h * 0.6, hz + 1)
        c.lineTo(x - w / 2, hz - h)
        c.lineTo(x + w / 2, hz - h * between(r, 0.9, 1))
        c.lineTo(x + w / 2 + h * 0.5, hz + 1)
        c.closePath()
        c.fill()
      }
    }
    const dir = p.sunLeft ? -1 : 1
    for (let i = 0; i < 4; i++) {
      const t = i / 3
      const base = hz + (H - hz) * (0.05 + t * 0.55)
      const amp = (H - hz) * (0.1 + t * 0.12)
      const f1 = between(r, 0.6, 1.6)
      const p1 = r()
      const f2 = between(r, 1.5, 3)
      const p2 = r()
      const crest = (u: number) => base - amp * (0.5 + 0.35 * Math.sin((f1 * u + p1) * TAU) + 0.15 * Math.sin((f2 * u + p2) * TAU))
      const g = c.createLinearGradient(0, 0, W, 0)
      for (let k = 0; k <= 48; k++) {
        const u = k / 48
        const slope = (crest(u + 0.002) - crest(u - 0.002)) / 0.004 / H
        const light = Math.max(0, Math.min(1, 0.55 + slope * dir * 2.4))
        g.addColorStop(u, rgba(mix(mix(p.shadow, p.lit, light), p.skyBottom, (1 - t) * 0.35)))
      }
      c.fillStyle = g
      c.beginPath()
      c.moveTo(-2, H + 2)
      for (let k = 0; k <= 80; k++) c.lineTo((k / 80) * W, crest(k / 80))
      c.lineTo(W + 2, H + 2)
      c.closePath()
      c.fill()
      c.fillStyle = vgrad(c, base - amp, H, [
        [0, p.shadow, 0],
        [1, p.shadow, 0.45],
      ])
      c.fill()
      if (i === 3) {
        c.strokeStyle = rgba(p.shadow, 0.18)
        c.lineWidth = Math.max(0.6, m * 0.0025)
        for (let k = 0; k < 26; k++) {
          const off = (H - base + amp) * between(r, 0.05, 0.9)
          c.beginPath()
          for (let j = 0; j <= 30; j++) {
            const u = j / 30
            c.lineTo(u * W, crest(u) + off + Math.sin(u * 30 + k) * m * 0.004)
          }
          c.stroke()
        }
        if (p.tracks) {
          c.fillStyle = rgba(p.shadow, 0.45)
          const u0 = r()
          for (let j = 0; j < 18; j++) {
            const t2 = j / 18
            const u = u0 + (0.5 - u0) * t2 * 0.8
            const y = H - (H - crest(u)) * t2 * 0.85
            const s = m * 0.012 * (1 - t2 * 0.7)
            c.beginPath()
            c.ellipse(u * W + (j % 2 ? s : -s), y, s * 0.5, s * 0.8, 0, 0, TAU)
            c.fill()
          }
        }
      }
    }
  },
}

const aurora: SceneDef<{ green: number; second: number; skyTop: RGB; skyBottom: RGB; land: RGB; lake: boolean; tent: boolean; bands: number }> = {
  palette(r) {
    return {
      green: between(r, 128, 158),
      second: pick(r, [290, 320, 185, 265]),
      skyTop: hsl(230, 50, 5),
      skyBottom: hsl(between(r, 190, 215), 45, 13),
      land: hsl(220, 30, 5),
      lake: r() < 0.5,
      tent: r() < 0.22,
      bands: intIn(r, 1, 3),
    }
  },
  tone: (p) => [hsl(p.green, 50, 26), p.skyTop],
  paint(c, W, H, r, p) {
    const m = Math.min(W, H)
    const hz = H * (p.lake ? between(r, 0.6, 0.7) : between(r, 0.72, 0.84))
    c.fillStyle = vgrad(c, 0, hz, [
      [0, p.skyTop],
      [1, p.skyBottom],
    ])
    c.fillRect(0, 0, W, H)
    for (let i = 0; i < 230; i++) {
      c.fillStyle = rgba(WHITE, between(r, 0.2, 0.9))
      const s = m * between(r, 0.0008, 0.0028)
      c.fillRect(r() * W, r() * hz, s, s)
    }
    for (let i = 0; i < 8; i++) glow(c, r() * W, r() * hz * 0.8, m * 0.012, WHITE, 0.7)
    const [cv, l] = layer(W, H)
    for (let b = 0; b < p.bands; b++) {
      const yb = between(r, 0.28, 0.55)
      const wv = waves(r, 3)
      const hgt = between(r, 0.22, 0.42)
      const shimmer = waves(r, 4)
      const rays = 180
      for (let i = 0; i < rays; i++) {
        const u = i / rays + between(r, -0.002, 0.002)
        const x = u * W
        const y0 = H * (yb + wv(u) * 0.09) * (hz / H) * 1.25
        const hh = H * hgt * (0.4 + 0.6 * (shimmer(u) * 0.5 + 0.5))
        const a = 0.25 + 0.4 * (shimmer(u + 0.37) * 0.5 + 0.5)
        const g = l.createLinearGradient(0, y0, 0, y0 - hh)
        g.addColorStop(0, rgba(hsl(p.green, 90, 62), 0))
        g.addColorStop(0.06, rgba(hsl(p.green, 90, 66), a))
        g.addColorStop(0.45, rgba(hsl(p.green + 20, 80, 50), a * 0.55))
        g.addColorStop(1, rgba(hsl(p.second, 70, 55), 0))
        l.fillStyle = g
        l.fillRect(x, y0 - hh, (W / rays) * 1.6, hh)
      }
    }
    blurInto(c, cv, m * 0.03, 'screen', 0.8)
    blurInto(c, cv, m * 0.006, 'screen', 0.9)
    const pts = ridge(r, 7, 0.5)
    c.fillStyle = rgba(p.land)
    ridgePath(c, W, H, pts, hz, H * 0.06)
    c.fill()
    for (let i = 0; i < 40; i++) {
      const u = r()
      pine(c, u * W, hz - sampleRidge(pts, u) * H * 0.06 + m * 0.01, m * between(r, 0.03, 0.09))
    }
    if (p.lake) {
      const lakeTop = hz + H * 0.02
      c.save()
      c.beginPath()
      c.rect(0, lakeTop, W, H - lakeTop)
      c.clip()
      c.fillStyle = rgba(mix(p.skyBottom, BLACK, 0.4))
      c.fillRect(0, lakeTop, W, H - lakeTop)
      c.translate(0, lakeTop * 2 - H * 0.08)
      c.scale(1, -1)
      blurInto(c, cv, m * 0.02, 'screen', 0.45)
      c.restore()
      c.fillStyle = rgba(p.land)
      c.fillRect(0, hz, W, H * 0.022)
    }
    if (p.tent) {
      const tx = W * between(r, 0.2, 0.8)
      const ty = p.lake ? hz + H * 0.02 : H * 0.94
      const s = m * 0.07
      glow(c, tx, ty - s * 0.3, s * 2.5, hsl(35, 100, 60), 0.5)
      c.fillStyle = rgba(hsl(34, 100, 62))
      c.beginPath()
      c.moveTo(tx - s, ty)
      c.lineTo(tx, ty - s * 0.8)
      c.lineTo(tx + s, ty)
      c.closePath()
      c.fill()
    }
    c.fillStyle = vgrad(c, H * 0.85, H, [
      [0, p.land, 0],
      [1, p.land, 0.9],
    ])
    c.fillRect(0, H * 0.85, W, H * 0.15)
  },
}

type Pose = 'stand' | 'wave' | 'jump'
function figure(c: Ctx, x: number, g: number, h: number, pose: Pose, child: boolean) {
  const lift = pose === 'jump' ? h * 0.12 : 0
  const y0 = g - lift
  const head = h * (child ? 0.095 : 0.072)
  const headY = y0 - h + head
  const neckY = headY + head * 1.25
  const hipY = y0 - h * 0.47
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.beginPath()
  c.arc(x, headY, head, 0, TAU)
  c.fill()
  c.lineWidth = h * (child ? 0.15 : 0.14)
  c.beginPath()
  c.moveTo(x, neckY + h * 0.05)
  c.lineTo(x, hipY - h * 0.04)
  c.stroke()
  c.lineWidth = h * 0.065
  c.beginPath()
  if (pose === 'jump') {
    c.moveTo(x - h * 0.03, hipY)
    c.lineTo(x - h * 0.1, hipY + h * 0.2)
    c.lineTo(x - h * 0.04, hipY + h * 0.4)
    c.moveTo(x + h * 0.03, hipY)
    c.lineTo(x + h * 0.12, hipY + h * 0.18)
    c.lineTo(x + h * 0.08, hipY + h * 0.4)
  } else {
    c.moveTo(x - h * 0.035, hipY)
    c.lineTo(x - h * 0.06, y0)
    c.moveTo(x + h * 0.035, hipY)
    c.lineTo(x + h * 0.06, y0)
  }
  c.stroke()
  c.lineWidth = h * 0.05
  const sy = neckY + h * 0.07
  c.beginPath()
  if (pose === 'stand') {
    c.moveTo(x - h * 0.06, sy)
    c.lineTo(x - h * 0.1, sy + h * 0.3)
    c.moveTo(x + h * 0.06, sy)
    c.lineTo(x + h * 0.1, sy + h * 0.3)
  } else {
    c.moveTo(x - h * 0.06, sy)
    c.lineTo(x - h * 0.2, sy - h * 0.22)
    c.moveTo(x + h * 0.06, sy)
    c.lineTo(pose === 'jump' ? x + h * 0.2 : x + h * 0.12, pose === 'jump' ? sy - h * 0.22 : sy + h * 0.28)
  }
  c.stroke()
}

const family: SceneDef<{ skyTop: RGB; skyBottom: RGB; sun: RGB; ground: RGB; beachSide: boolean; extra: 'balloon' | 'kite' | 'dog' | 'none'; flare: boolean }> = {
  palette(r) {
    const warm = between(r, 18, 42)
    return {
      skyTop: hsl(warm + pick(r, [180, 200, 330]), 35, 55),
      skyBottom: hsl(warm, 90, 72),
      sun: hsl(warm + 15, 100, 92),
      ground: hsl(warm - 10, 35, 8),
      beachSide: r() < 0.4,
      extra: pick(r, ['balloon', 'kite', 'dog', 'none'] as const),
      flare: r() < 0.55,
    }
  },
  tone: (p) => [p.skyBottom, p.ground],
  paint(c, W, H, r, p) {
    const m = Math.min(W, H)
    const hz = H * between(r, 0.68, 0.8)
    c.fillStyle = vgrad(c, 0, hz, [
      [0, p.skyTop],
      [0.75, p.skyBottom],
      [1, mix(p.skyBottom, p.sun, 0.5)],
    ])
    c.fillRect(0, 0, W, H)
    const sx = W * between(r, 0.3, 0.7)
    const sy = hz - m * between(r, 0.02, 0.14)
    glow(c, sx, sy, m * 1.1, p.sun, 0.7)
    glow(c, sx, sy, m * 0.12, WHITE, 0.95)
    for (let i = 0; i < intIn(r, 1, 3); i++) {
      soft(c, W, H, m * 0.012, (l) => {
        l.fillStyle = rgba(mix(p.skyTop, p.skyBottom, 0.6), 0.55)
        l.beginPath()
        l.ellipse(W * r(), hz * between(r, 0.15, 0.5), W * between(r, 0.15, 0.35), m * between(r, 0.01, 0.025), 0, 0, TAU)
        l.fill()
      })
    }
    const ink = rgba(p.ground)
    c.fillStyle = ink
    c.strokeStyle = ink
    if (p.beachSide) {
      c.fillStyle = rgba(mix(p.skyBottom, p.ground, 0.55))
      c.fillRect(0, hz - m * 0.005, W, H * 0.04)
      c.fillStyle = rgba(mix(p.sun, p.skyBottom, 0.3), 0.6)
      for (let i = 0; i < 30; i++) c.fillRect(sx + between(r, -0.15, 0.15) * W, hz + H * 0.04 * r(), W * between(r, 0.01, 0.05), Math.max(1, m * 0.002))
      c.fillStyle = ink
      c.fillRect(0, hz + H * 0.035, W, H)
    } else {
      c.beginPath()
      c.moveTo(-2, H + 2)
      const wv = waves(r, 2)
      for (let i = 0; i <= 40; i++) c.lineTo((i / 40) * W, hz + wv(i / 40) * H * 0.012)
      c.lineTo(W + 2, H + 2)
      c.closePath()
      c.fill()
      c.lineWidth = Math.max(0.6, m * 0.003)
      for (let i = 0; i < 160; i++) {
        const x = r() * W
        const hh = m * between(r, 0.01, 0.03)
        c.beginPath()
        c.moveTo(x, hz + m * 0.01)
        c.lineTo(x + between(r, -0.4, 0.4) * hh, hz - hh)
        c.stroke()
      }
    }
    const ground = p.beachSide ? hz + H * 0.035 : hz + m * 0.012
    const count = intIn(r, 2, 4)
    const spacing = W * between(r, 0.07, 0.12)
    const startX = sx - ((count - 1) * spacing) / 2 + between(r, -0.12, 0.12) * W
    const people: { x: number; h: number }[] = []
    for (let i = 0; i < count; i++) {
      const child = i > 0 && r() < 0.5
      const h = H * (child ? between(r, 0.15, 0.2) : between(r, 0.27, 0.36))
      const pose = pick(r, ['stand', 'wave', 'jump', 'stand'] as const)
      const x = startX + i * spacing + between(r, -0.02, 0.02) * W
      figure(c, x, ground, h, pose, child)
      people.push({ x, h })
    }
    const lead = people[people.length - 1]
    if (p.extra === 'balloon') {
      const bx = lead.x + lead.h * 0.2
      const by = ground - lead.h * 1.35
      c.lineWidth = Math.max(0.6, m * 0.002)
      c.beginPath()
      c.moveTo(lead.x + lead.h * 0.1, ground - lead.h * 0.55)
      c.quadraticCurveTo(bx - m * 0.02, by + m * 0.1, bx, by + m * 0.05)
      c.stroke()
      const bg = c.createRadialGradient(bx - m * 0.01, by - m * 0.015, 0, bx, by, m * 0.05)
      bg.addColorStop(0, rgba(hsl(pick(r, [0, 330, 200, 45]), 90, 62)))
      bg.addColorStop(1, rgba(hsl(350, 70, 25)))
      c.fillStyle = bg
      c.beginPath()
      c.ellipse(bx, by, m * 0.04, m * 0.05, 0, 0, TAU)
      c.fill()
    } else if (p.extra === 'kite') {
      const kx = W * between(r, 0.15, 0.85)
      const ky = H * between(r, 0.12, 0.3)
      const s = m * 0.05
      c.lineWidth = Math.max(0.5, m * 0.0018)
      c.beginPath()
      c.moveTo(lead.x + lead.h * 0.18, ground - lead.h * 0.82)
      c.quadraticCurveTo((kx + lead.x) / 2, ky + H * 0.25, kx, ky + s)
      c.stroke()
      c.fillStyle = rgba(hsl(pick(r, [0, 200, 50, 280]), 70, 40))
      c.beginPath()
      c.moveTo(kx, ky - s)
      c.lineTo(kx + s * 0.7, ky)
      c.lineTo(kx, ky + s)
      c.lineTo(kx - s * 0.7, ky)
      c.closePath()
      c.fill()
      c.beginPath()
      for (let j = 0; j < 8; j++) c.lineTo(kx + Math.sin(j) * s * 0.3, ky + s + j * s * 0.4)
      c.stroke()
    } else if (p.extra === 'dog') {
      const dx = startX - spacing * 0.9
      const s = H * 0.07
      c.fillStyle = ink
      c.beginPath()
      c.ellipse(dx, ground - s * 1.1, s * 1.1, s * 0.45, 0, 0, TAU)
      c.fill()
      c.beginPath()
      c.arc(dx + s * 1.1, ground - s * 1.6, s * 0.38, 0, TAU)
      c.fill()
      c.lineWidth = s * 0.25
      c.beginPath()
      c.moveTo(dx - s * 0.7, ground - s)
      c.lineTo(dx - s * 0.8, ground)
      c.moveTo(dx + s * 0.7, ground - s)
      c.lineTo(dx + s * 0.8, ground)
      c.moveTo(dx - s * 1, ground - s * 1.3)
      c.quadraticCurveTo(dx - s * 1.5, ground - s * 1.8, dx - s * 1.6, ground - s * 1.6)
      c.stroke()
    }
    if (p.flare) {
      c.save()
      c.globalCompositeOperation = 'screen'
      const vx = W / 2 - sx
      const vy = H / 2 - sy
      for (let i = 1; i <= 4; i++) {
        const t = i * 0.45
        bokehDisc(c, sx + vx * t, sy + vy * t, m * between(r, 0.02, 0.07), hsl(between(r, 20, 60), 80, 70), 0.14)
      }
      c.restore()
    }
  },
}

const table: SceneDef<{ surface: 'wood' | 'marble' | 'linen'; base: RGB; mug: RGB; food: 'croissant' | 'fruit' | 'toast'; lightAngle: number }> = {
  palette(r) {
    const surface = pick(r, ['wood', 'wood', 'marble', 'linen'] as const)
    const base = surface === 'wood' ? hsl(between(r, 20, 32), 40, between(r, 28, 44)) : surface === 'marble' ? hsl(30, 8, 88) : hsl(40, 25, 80)
    return {
      surface,
      base,
      mug: hsl(between(r, 0, 360), between(r, 10, 45), between(r, 45, 88)),
      food: pick(r, ['croissant', 'fruit', 'toast'] as const),
      lightAngle: between(r, -0.8, 0.8),
    }
  },
  tone: (p) => [p.base, mix(p.base, BLACK, 0.3)],
  paint(c, W, H, r, p) {
    const m = Math.min(W, H)
    c.fillStyle = rgba(p.base)
    c.fillRect(0, 0, W, H)
    if (p.surface === 'wood') {
      const planks = 5
      for (let i = 0; i <= planks; i++) {
        c.fillStyle = rgba(mix(p.base, BLACK, 0.4), 0.5)
        c.fillRect(0, (i / planks) * H + between(r, -0.01, 0.01) * H, W, Math.max(1, m * 0.004))
      }
      c.lineWidth = Math.max(0.5, m * 0.0015)
      for (let i = 0; i < 80; i++) {
        c.strokeStyle = rgba(mix(p.base, r() < 0.5 ? BLACK : WHITE, 0.25), between(r, 0.08, 0.2))
        const y = r() * H
        const amp = m * between(r, 0.002, 0.01)
        const f = between(r, 2, 8)
        c.beginPath()
        for (let k = 0; k <= 30; k++) c.lineTo((k / 30) * W, y + Math.sin((k / 30) * f) * amp)
        c.stroke()
      }
    } else if (p.surface === 'marble') {
      soft(c, W, H, m * 0.004, (l) => {
        l.strokeStyle = rgba(hsl(30, 5, 55), 0.35)
        for (let i = 0; i < 9; i++) {
          l.lineWidth = m * between(r, 0.001, 0.005)
          l.beginPath()
          l.moveTo(r() * W, -2)
          l.bezierCurveTo(r() * W, H * 0.3, r() * W, H * 0.7, r() * W, H + 2)
          l.stroke()
        }
      })
    } else {
      c.strokeStyle = rgba(mix(p.base, BLACK, 0.15), 0.25)
      c.lineWidth = Math.max(0.5, m * 0.002)
      for (let i = 0; i < 60; i++) {
        const y = (i / 60) * H
        c.beginPath()
        c.moveTo(0, y)
        c.lineTo(W, y + between(r, -1, 1) * m * 0.004)
        c.stroke()
      }
    }
    const shadowOf = (draw: (l: Ctx) => void) =>
      soft(c, W, H, m * 0.025, (l) => {
        l.translate(m * 0.025, m * 0.035)
        l.fillStyle = 'rgba(0,0,0,0.45)'
        draw(l)
      })
    const mx = W * between(r, 0.18, 0.38)
    const my = H * between(r, 0.2, 0.38)
    const mr = m * 0.11
    const handleA = between(r, -0.6, 0.6)
    shadowOf((l) => {
      l.beginPath()
      l.arc(mx, my, mr, 0, TAU)
      l.fill()
    })
    c.save()
    c.translate(mx, my)
    c.rotate(handleA)
    c.fillStyle = rgba(mix(p.mug, BLACK, 0.12))
    c.beginPath()
    c.roundRect(mr * 0.8, -mr * 0.2, mr * 0.55, mr * 0.4, mr * 0.18)
    c.fill()
    c.restore()
    const mg = c.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, 0, mx, my, mr)
    mg.addColorStop(0, rgba(mix(p.mug, WHITE, 0.3)))
    mg.addColorStop(1, rgba(mix(p.mug, BLACK, 0.15)))
    c.fillStyle = mg
    c.beginPath()
    c.arc(mx, my, mr, 0, TAU)
    c.fill()
    const coffee = c.createRadialGradient(mx, my, 0, mx, my, mr * 0.82)
    coffee.addColorStop(0, rgba(hsl(30, 45, 62)))
    coffee.addColorStop(0.55, rgba(hsl(28, 50, 45)))
    coffee.addColorStop(1, rgba(hsl(22, 55, 18)))
    c.fillStyle = coffee
    c.beginPath()
    c.arc(mx, my, mr * 0.82, 0, TAU)
    c.fill()
    c.strokeStyle = rgba(hsl(35, 50, 85), 0.8)
    c.lineWidth = mr * 0.07
    c.beginPath()
    c.arc(mx, my + mr * 0.08, mr * 0.28, Math.PI * 1.1, Math.PI * 1.9)
    c.stroke()

    const px = W * between(r, 0.55, 0.72)
    const py = H * between(r, 0.55, 0.72)
    const pr = m * 0.24
    shadowOf((l) => {
      l.beginPath()
      l.arc(px, py, pr, 0, TAU)
      l.fill()
    })
    const pg = c.createRadialGradient(px - pr * 0.2, py - pr * 0.2, 0, px, py, pr)
    pg.addColorStop(0, rgba(WHITE))
    pg.addColorStop(1, rgba(hsl(40, 10, 86)))
    c.fillStyle = pg
    c.beginPath()
    c.arc(px, py, pr, 0, TAU)
    c.fill()
    c.strokeStyle = rgba(hsl(40, 8, 78), 0.8)
    c.lineWidth = pr * 0.02
    c.beginPath()
    c.arc(px, py, pr * 0.74, 0, TAU)
    c.stroke()
    if (p.food === 'croissant') {
      for (let k = 0; k < 7; k++) {
        const t = k / 6
        const a = Math.PI * (0.15 + t * 0.7)
        const rr = pr * (0.3 + Math.sin(t * Math.PI) * 0.2)
        const fx = px + Math.cos(a + Math.PI) * pr * 0.2
        const fy = py + Math.sin(a) * pr * 0.1 - pr * 0.05
        const cg = c.createRadialGradient(fx, fy - rr * 0.3, 0, fx, fy, rr)
        cg.addColorStop(0, rgba(hsl(38, 85, 68)))
        cg.addColorStop(1, rgba(hsl(25, 70, 32)))
        c.fillStyle = cg
        c.beginPath()
        c.ellipse(px + (t - 0.5) * pr * 1.1, py + Math.sin(t * Math.PI) * -pr * 0.1, rr * 0.55, rr * 0.8, (t - 0.5) * 1.2, 0, TAU)
        c.fill()
      }
    } else if (p.food === 'fruit') {
      for (let k = 0; k < 9; k++) {
        const a = r() * TAU
        const d = pr * 0.45 * Math.sqrt(r())
        const fr = pr * between(r, 0.1, 0.2)
        const hue = pick(r, [0, 340, 30, 45, 280])
        const fg = c.createRadialGradient(px + Math.cos(a) * d - fr * 0.3, py + Math.sin(a) * d - fr * 0.3, 0, px + Math.cos(a) * d, py + Math.sin(a) * d, fr)
        fg.addColorStop(0, rgba(hsl(hue, 90, 70)))
        fg.addColorStop(1, rgba(hsl(hue, 80, 32)))
        c.fillStyle = fg
        c.beginPath()
        c.arc(px + Math.cos(a) * d, py + Math.sin(a) * d, fr, 0, TAU)
        c.fill()
      }
    } else {
      c.save()
      c.translate(px, py)
      c.rotate(between(r, -0.4, 0.4))
      c.fillStyle = rgba(hsl(28, 60, 38))
      c.beginPath()
      c.roundRect(-pr * 0.45, -pr * 0.4, pr * 0.9, pr * 0.8, pr * 0.14)
      c.fill()
      c.fillStyle = rgba(hsl(36, 65, 70))
      c.beginPath()
      c.roundRect(-pr * 0.38, -pr * 0.33, pr * 0.76, pr * 0.66, pr * 0.1)
      c.fill()
      c.fillStyle = rgba(hsl(90, 45, 45))
      c.beginPath()
      c.ellipse(0, 0, pr * 0.28, pr * 0.2, 0.3, 0, TAU)
      c.fill()
      c.restore()
    }
    c.save()
    c.globalCompositeOperation = 'soft-light'
    c.translate(W / 2, H / 2)
    c.rotate(p.lightAngle)
    const lg = c.createLinearGradient(-W, 0, W, 0)
    lg.addColorStop(0, 'rgba(255,240,210,0)')
    lg.addColorStop(0.45, 'rgba(255,240,210,0.7)')
    lg.addColorStop(0.55, 'rgba(255,240,210,0.7)')
    lg.addColorStop(1, 'rgba(0,0,0,0.3)')
    c.fillStyle = lg
    c.fillRect(-W * 1.5, -H * 1.5, W * 3, H * 3)
    c.restore()
  },
}

const screenshot: SceneDef<{ dark: boolean; accent: RGB; kind: 'chat' | 'feed' | 'settings' | 'music' | 'map' }> = {
  palette(r) {
    return {
      dark: r() < 0.5,
      accent: hsl(pick(r, [210, 150, 265, 20, 340]), 75, 55),
      kind: pick(r, ['chat', 'feed', 'settings', 'music', 'map'] as const),
    }
  },
  tone: (p) => (p.dark ? [hsl(230, 10, 10), hsl(230, 10, 16)] : [hsl(220, 15, 96), hsl(220, 12, 90)]),
  paint(c, W, H, r, p) {
    const ink = p.dark ? hsl(0, 0, 96) : hsl(230, 15, 12)
    const card = p.dark ? hsl(230, 10, 16) : WHITE
    const bg = p.dark ? hsl(230, 10, 7) : hsl(220, 15, 95)
    const u = W / 100
    c.fillStyle = rgba(bg)
    c.fillRect(0, 0, W, H)
    const bar = (x: number, y: number, w: number, h: number, col: RGB, a = 1) => {
      c.fillStyle = rgba(col, a)
      c.beginPath()
      c.roundRect(x, y, w, h, Math.min(h / 2, u * 3))
      c.fill()
    }
    c.fillStyle = rgba(ink)
    c.font = `600 ${u * 4.2}px Inter, system-ui, sans-serif`
    c.textBaseline = 'middle'
    const hh = intIn(r, 7, 22)
    const mm = intIn(r, 0, 59)
    c.fillText(`${hh}:${String(mm).padStart(2, '0')}`, u * 8, u * 7)
    bar(u * 78, u * 5.6, u * 9, u * 3, ink, 0.9)
    for (let i = 0; i < 3; i++) bar(u * (64 + i * 3.5), u * (8 - i * 0.9), u * 2.2, u * (1.2 + i * 0.9), ink, 0.9)
    c.font = `700 ${u * 8}px Inter, system-ui, sans-serif`
    const titles = { chat: 'Family', feed: 'Today', settings: 'Settings', music: 'Now Playing', map: 'Nearby' }
    c.fillText(titles[p.kind], u * 6, u * 22)
    const top = u * 32
    if (p.kind === 'chat') {
      let y = top
      for (let i = 0; i < 12 && y < H - u * 30; i++) {
        const mine = r() < 0.45
        const w = u * between(r, 30, 70)
        const h = u * (r() < 0.3 ? 16 : 9)
        bar(mine ? W - u * 6 - w : u * 6, y, w, h, mine ? p.accent : card)
        y += h + u * 3
      }
    } else if (p.kind === 'feed') {
      let y = top
      for (let i = 0; i < 4 && y < H - u * 30; i++) {
        bar(u * 6, y, u * 88, u * 60, card)
        const g = c.createLinearGradient(0, y, 0, y + u * 38)
        g.addColorStop(0, rgba(hsl(r() * 360, 50, 60)))
        g.addColorStop(1, rgba(hsl(r() * 360, 50, 35)))
        c.fillStyle = g
        c.beginPath()
        c.roundRect(u * 6, y, u * 88, u * 38, [u * 3, u * 3, 0, 0])
        c.fill()
        bar(u * 10, y + u * 43, u * 60, u * 3.4, ink, 0.85)
        bar(u * 10, y + u * 50, u * 44, u * 2.6, ink, 0.4)
        y += u * 66
      }
    } else if (p.kind === 'settings') {
      let y = top
      for (let g = 0; g < 4 && y < H - u * 40; g++) {
        const rows = intIn(r, 2, 4)
        bar(u * 6, y, u * 88, rows * u * 12, card)
        for (let i = 0; i < rows; i++) {
          bar(u * 10, y + i * u * 12 + u * 3, u * 6, u * 6, hsl(r() * 360, 70, 55))
          bar(u * 20, y + i * u * 12 + u * 4.8, u * between(r, 20, 45), u * 2.6, ink, 0.8)
          if (r() < 0.4) bar(u * 76, y + i * u * 12 + u * 3.5, u * 12, u * 5, p.accent)
        }
        y += rows * u * 12 + u * 8
      }
    } else if (p.kind === 'music') {
      const g = c.createLinearGradient(u * 12, top, u * 88, top + u * 76)
      g.addColorStop(0, rgba(hsl(r() * 360, 70, 60)))
      g.addColorStop(1, rgba(hsl(r() * 360, 70, 30)))
      c.fillStyle = g
      c.beginPath()
      c.roundRect(u * 12, top, u * 76, u * 76, u * 4)
      c.fill()
      bar(u * 12, top + u * 86, u * 50, u * 4, ink, 0.9)
      bar(u * 12, top + u * 94, u * 32, u * 3, ink, 0.5)
      bar(u * 12, top + u * 106, u * 76, u * 1.4, ink, 0.2)
      bar(u * 12, top + u * 106, u * 76 * r(), u * 1.4, ink, 0.8)
      for (let i = 0; i < 3; i++) {
        c.fillStyle = rgba(ink, i === 1 ? 1 : 0.8)
        c.beginPath()
        c.arc(u * (30 + i * 20), top + u * 124, u * (i === 1 ? 8 : 5), 0, TAU)
        c.fill()
      }
    } else {
      c.fillStyle = rgba(p.dark ? hsl(220, 12, 14) : hsl(90, 20, 90))
      c.fillRect(0, top - u * 4, W, H - top)
      c.strokeStyle = rgba(p.dark ? hsl(220, 10, 26) : WHITE)
      const tilt = between(r, -0.25, 0.25)
      for (let i = 0; i < 16; i++) {
        c.lineWidth = u * (i % 5 === 0 ? 2.6 : between(r, 0.8, 1.5))
        const x = r() * W
        c.beginPath()
        c.moveTo(x, top)
        c.lineTo(x + tilt * (H - top), H)
        c.stroke()
        const y = top + r() * (H - top)
        c.beginPath()
        c.moveTo(0, y)
        c.lineTo(W, y - tilt * W * 0.5)
        c.stroke()
      }
      c.fillStyle = rgba(p.dark ? hsl(210, 40, 25) : hsl(205, 70, 80))
      c.beginPath()
      c.ellipse(W * r(), top + (H - top) * r(), u * 30, u * 18, r(), 0, TAU)
      c.fill()
      const pinX = W * between(r, 0.3, 0.7)
      const pinY = top + (H - top) * between(r, 0.3, 0.6)
      c.fillStyle = rgba(p.accent)
      c.beginPath()
      c.arc(pinX, pinY, u * 4, 0, TAU)
      c.fill()
      c.fillStyle = rgba(WHITE)
      c.beginPath()
      c.arc(pinX, pinY, u * 1.6, 0, TAU)
      c.fill()
      bar(u * 6, H - u * 60, u * 88, u * 30, card)
      bar(u * 12, H - u * 52, u * 50, u * 3.4, ink, 0.85)
      bar(u * 12, H - u * 45, u * 30, u * 2.6, ink, 0.4)
    }
    bar(0, H - u * 22, W, u * 22, card, p.dark ? 0.9 : 0.95)
    for (let i = 0; i < 4; i++) bar(u * (13 + i * 22), H - u * 18, u * 6, u * 6, i === 0 ? p.accent : ink, i === 0 ? 1 : 0.35)
    bar(W / 2 - u * 18, H - u * 3.2, u * 36, u * 1.2, ink, 0.8)
  },
}

const SCENES: Record<Scene, SceneDef<unknown>> = {
  sunset,
  mountains,
  lake,
  city,
  forest,
  beach,
  snow,
  flowers,
  desert,
  aurora,
  family,
  table,
  screenshot,
} as Record<Scene, SceneDef<unknown>>

type PaintSpec = Pick<Photo, 'seed' | 'scene' | 'vintage' | 'stamp' | 'date'>

/** Paints a demo photo into `c` at W×H. Same seed, same picture, at any size. */
export function paintPhoto(c: Ctx, W: number, H: number, p: PaintSpec) {
  const r = mulberry32(p.seed)
  const scene = SCENES[p.scene]
  const pal = scene.palette(r)
  c.save()
  scene.paint(c, W, H, r, pal)
  c.restore()
  if (p.scene === 'screenshot') return
  vignette(c, W, H, p.vintage ? 0.45 : 0.28)
  if (p.vintage) fadeToVintage(c, W, H)
  grain(c, W, H, p.vintage ? 0.13 : 0.05)
  if (p.stamp) dateStamp(c, W, H, p.date)
}

const toneCache = new Map<string, string>()

/** A CSS gradient close to the photo's colours, shown while its thumbnail paints. */
export function photoTone(p: Photo): string {
  const cached = toneCache.get(p.id)
  if (cached) return cached
  let css = 'linear-gradient(180deg, #2a2a33, #16161c)'
  if (!p.url) {
    const scene = SCENES[p.scene]
    const [a, b] = scene.tone(scene.palette(mulberry32(p.seed)))
    const fade = p.vintage ? (c: RGB) => mix(c, hsl(30, 20, 40), 0.3) : (c: RGB) => c
    css = `linear-gradient(180deg, ${rgba(fade(a))}, ${rgba(fade(b))})`
  }
  toneCache.set(p.id, css)
  return css
}

// ---------------------------------------------------------------------------
// Rendering queue and cache

type Listener = (url: string) => void
interface Job {
  key: string
  photo: Photo
  size: PhotoSize
  listeners: Set<Listener>
}

const THUMB_SHORT = 300
const FULL_LONG = 1600
const thumbs = new Map<string, string>()
const fulls = new Map<string, string>()
const queue = new Map<string, Job>()
const inflight = new Map<string, Job>()
let idleScheduled = false

const keyOf = (p: Photo, size: PhotoSize) => `${p.id}:${size}`
const cacheFor = (size: PhotoSize) => (size === 'thumb' ? thumbs : fulls)

/** Pixel size to render a photo at. */
export function renderSize(p: Photo, size: PhotoSize): [number, number] {
  const aspect = p.width / p.height
  if (size === 'thumb') return aspect >= 1 ? [Math.round(THUMB_SHORT * aspect), THUMB_SHORT] : [THUMB_SHORT, Math.round(THUMB_SHORT / aspect)]
  return aspect >= 1 ? [FULL_LONG, Math.round(FULL_LONG / aspect)] : [Math.round(FULL_LONG * aspect), FULL_LONG]
}

/** Returns a cached URL without scheduling any work. */
export function peekPhotoUrl(p: Photo, size: PhotoSize): string | null {
  if (p.url && size === 'full') return p.url
  return cacheFor(size).get(p.id) ?? null
}

type IdleDeadline = { timeRemaining(): number; didTimeout: boolean }
const requestIdle: (cb: (d: IdleDeadline) => void) => void =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? (cb) => window.requestIdleCallback(cb, { timeout: 180 })
    : (cb) => setTimeout(() => cb({ timeRemaining: () => 8, didTimeout: true }), 24)

function canvasToUrl(cv: HTMLCanvasElement, type = 'image/jpeg'): Promise<string> {
  return new Promise((resolve) => {
    cv.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : cv.toDataURL(type, 0.86)), type, 0.86)
  })
}

async function renderFileThumb(p: Photo): Promise<string> {
  const [w, h] = renderSize(p, 'thumb')
  const [cv, c] = layer(w, h)
  if (p.mime?.startsWith('video/')) {
    const video = document.createElement('video')
    video.muted = true
    video.preload = 'auto'
    video.src = p.url!
    await new Promise<void>((resolve) => {
      const done = () => resolve()
      video.addEventListener('loadeddata', () => {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 3)
      })
      video.addEventListener('seeked', done, { once: true })
      video.addEventListener('error', done, { once: true })
      setTimeout(done, 4000)
    })
    try {
      c.drawImage(video, 0, 0, w, h)
    } catch {
      c.fillStyle = '#222'
      c.fillRect(0, 0, w, h)
    }
  } else {
    const img = new Image()
    img.src = p.url!
    try {
      await img.decode()
      c.drawImage(img, 0, 0, w, h)
    } catch {
      return p.url!
    }
  }
  return canvasToUrl(cv)
}

function finish(job: Job, url: string) {
  const cache = cacheFor(job.size)
  cache.set(job.photo.id, url)
  if (job.size === 'full' && fulls.size > 24) {
    const [oldest] = fulls.keys()
    const old = fulls.get(oldest)
    fulls.delete(oldest)
    if (old?.startsWith('blob:')) URL.revokeObjectURL(old)
  }
  inflight.delete(job.key)
  for (const l of job.listeners) l(url)
}

function run(job: Job) {
  inflight.set(job.key, job)
  if (job.photo.url) {
    void renderFileThumb(job.photo).then((url) => finish(job, url))
    return
  }
  const [w, h] = renderSize(job.photo, job.size)
  const [cv, c] = layer(w, h)
  try {
    paintPhoto(c, w, h, job.photo)
  } catch (err) {
    console.warn('Could not paint photo', job.photo.id, err)
  }
  void canvasToUrl(cv, job.photo.scene === 'screenshot' ? 'image/png' : 'image/jpeg').then((url) => finish(job, url))
}

function pump(deadline: IdleDeadline) {
  idleScheduled = false
  let done = 0
  while (queue.size && (done < 2 || deadline.timeRemaining() > 6)) {
    const [key, job] = queue.entries().next().value as [string, Job]
    queue.delete(key)
    run(job)
    done++
    if (!deadline.didTimeout && deadline.timeRemaining() <= 6 && done >= 1) break
  }
  if (queue.size) scheduleIdle()
}

function scheduleIdle() {
  if (idleScheduled) return
  idleScheduled = true
  requestIdle(pump)
}

/**
 * Asks for a rendered photo. Thumbnails are painted in idle time; full-size
 * renders start right away. Returns an unsubscribe function, which also
 * drops the job if nobody else is waiting for it.
 */
export function requestPhotoUrl(p: Photo, size: PhotoSize, listener: Listener): () => void {
  const direct = peekPhotoUrl(p, size)
  if (direct) {
    listener(direct)
    return () => {}
  }
  const key = keyOf(p, size)
  const existing = inflight.get(key) ?? queue.get(key)
  if (existing) {
    existing.listeners.add(listener)
    return () => existing.listeners.delete(listener)
  }
  const job: Job = { key, photo: p, size, listeners: new Set([listener]) }
  if (size === 'full') {
    inflight.set(key, job)
    setTimeout(() => run(job), 0)
  } else {
    queue.set(key, job)
    scheduleIdle()
  }
  return () => {
    job.listeners.delete(listener)
    if (!job.listeners.size && queue.get(key) === job) queue.delete(key)
  }
}

/** Resolves once the image is ready. */
export function loadPhotoUrl(p: Photo, size: PhotoSize): Promise<string> {
  return new Promise((resolve) => requestPhotoUrl(p, size, resolve))
}

/** A rendered URL for `photo`, or null while it paints. Pass `enabled=false` to hold off (e.g. offscreen). */
export function usePhotoUrl(photo: Photo | null | undefined, size: PhotoSize, enabled = true): string | null {
  const key = photo ? keyOf(photo, size) : ''
  const [state, setState] = useState<{ key: string; url: string | null }>(() => ({
    key,
    url: photo ? peekPhotoUrl(photo, size) : null,
  }))
  useEffect(() => {
    if (!photo || !enabled) return
    return requestPhotoUrl(photo, size, (url) => setState({ key, url }))
    // The photo's identity is captured by `key`.
  }, [key, enabled]) // eslint-disable-line react-hooks/exhaustive-deps
  if (state.key === key) return state.url
  return photo ? peekPhotoUrl(photo, size) : null
}

// Shared IntersectionObservers, one per scroll root.
const observers = new Map<Element | null, { io: IntersectionObserver; cbs: Map<Element, (v: boolean) => void> }>()

function observe(el: Element, root: Element | null, cb: (visible: boolean) => void) {
  let entry = observers.get(root)
  if (!entry) {
    const cbs = new Map<Element, (v: boolean) => void>()
    const io = new IntersectionObserver(
      (items) => {
        for (const it of items) cbs.get(it.target)?.(it.isIntersecting)
      },
      { root, rootMargin: '320px 0px' },
    )
    entry = { io, cbs }
    observers.set(root, entry)
  }
  entry.cbs.set(el, cb)
  entry.io.observe(el)
  const e = entry
  return () => {
    e.cbs.delete(el)
    e.io.unobserve(el)
  }
}

/** True once `ref` is within ~a screen of being visible inside `root` (or the viewport). */
export function useNearViewport(ref: RefObject<Element | null>, root: Element | null = null): boolean {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    return observe(el, root, setVisible)
  }, [ref, root])
  return visible
}

/** Saves the original (for files from this computer) or a full-size render. */
export async function downloadPhoto(p: Photo) {
  let href = p.url
  let revoke = false
  if (!href) {
    const [w, h] = [p.width, p.height]
    const scale = Math.min(1, 3000 / Math.max(w, h))
    const [cv, c] = layer(w * scale, h * scale)
    paintPhoto(c, cv.width, cv.height, p)
    href = await canvasToUrl(cv)
    revoke = true
  }
  const a = document.createElement('a')
  a.href = href
  a.download = p.url ? p.name : p.name.replace(/\.\w+$/, '.jpg')
  document.body.appendChild(a)
  a.click()
  a.remove()
  if (revoke) setTimeout(() => URL.revokeObjectURL(href!), 4000)
}

// ---------------------------------------------------------------------------
// Demo library

const DAY = 86_400_000
const HOUR = 3_600_000

export const DEMO_ALBUMS: { id: string; name: string }[] = [
  { id: 'big-sur', name: 'Big Sur Road Trip' },
  { id: 'lofoten', name: 'Winter in Lofoten' },
  { id: 'kyoto', name: 'Kyoto in Spring' },
  { id: 'sahara', name: 'Sahara Nights' },
]

interface PlaceDef {
  name: string
  scenes: readonly Scene[]
}

const TRAVEL: PlaceDef[] = [
  { name: 'Lisbon, Portugal', scenes: ['sunset', 'city', 'beach', 'table'] },
  { name: 'Big Sur, California', scenes: ['sunset', 'mountains', 'beach', 'forest'] },
  { name: 'Lofoten, Norway', scenes: ['aurora', 'snow', 'mountains', 'lake'] },
  { name: 'Reykjavík, Iceland', scenes: ['aurora', 'snow', 'mountains'] },
  { name: 'Kyoto, Japan', scenes: ['forest', 'flowers', 'city', 'lake'] },
  { name: 'Tokyo, Japan', scenes: ['city', 'city', 'table'] },
  { name: 'New York, NY', scenes: ['city', 'city', 'table'] },
  { name: 'Merzouga, Morocco', scenes: ['desert', 'desert', 'sunset'] },
  { name: 'Moab, Utah', scenes: ['desert', 'mountains'] },
  { name: 'Banff, Canada', scenes: ['lake', 'mountains', 'forest', 'snow'] },
  { name: 'Amalfi, Italy', scenes: ['sunset', 'beach', 'table'] },
  { name: 'Tulum, Mexico', scenes: ['beach', 'beach', 'sunset'] },
  { name: 'Zermatt, Switzerland', scenes: ['snow', 'mountains'] },
  { name: 'Lake Tahoe, California', scenes: ['lake', 'forest', 'snow'] },
  { name: 'Cape Town, South Africa', scenes: ['sunset', 'mountains', 'beach'] },
  { name: 'Hong Kong', scenes: ['city', 'city'] },
  { name: 'Seattle, Washington', scenes: ['city', 'forest', 'lake'] },
  { name: 'Copenhagen, Denmark', scenes: ['city', 'table', 'flowers'] },
]

const HOME_PLACES = ['Home', 'Home', 'Home', 'Backyard', 'Riverside Park', 'Grandma’s garden', 'Community garden']
const HOME_SCENES: readonly (readonly [Scene, number])[] = [
  ['family', 3],
  ['table', 2],
  ['flowers', 2],
  ['forest', 0.7],
  ['sunset', 1],
  ['snow', 0.4],
]

// Invented camera names: realistic-sounding EXIF without borrowing anyone's brand.
const PHONES_BY_ERA: [number, string[]][] = [
  [2024, ['Lumio 9 Pro', 'Lumio 9']],
  [2022, ['Lumio 8 Pro', 'Corvid X2']],
  [2019, ['Lumio 6', 'Aster S11']],
  [2016, ['Aster S7', 'Lumio 4']],
  [2013, ['Lumio 3', 'Nimbus One']],
  [0, ['Snapline S80', 'Tessar Mini 7', 'Brio Z5', 'Fennec D60']],
]

function cameraFor(year: number, r: Rng) {
  for (const [from, list] of PHONES_BY_ERA) if (year >= from) return pick(r, list)
  return 'Snapline S80'
}

function exifFor(scene: Scene, r: Rng): Exif {
  const night = scene === 'aurora' || scene === 'city'
  return {
    aperture: pick(r, [1.6, 1.78, 1.8, 2.2, 2.8, 4, 5.6, 8]),
    shutter: scene === 'aurora' ? pick(r, ['6"', '8"', '10"']) : night ? pick(r, ['1/15', '1/30', '1/60']) : pick(r, ['1/120', '1/250', '1/500', '1/1000', '1/2000']),
    iso: scene === 'aurora' ? pick(r, [1600, 3200]) : night ? pick(r, [640, 800, 1250]) : pick(r, [32, 50, 64, 100, 125, 200]),
    focal: pick(r, [13, 24, 24, 26, 35, 48, 77, 120]),
  }
}

const HOURS: Partial<Record<Scene, [number, number]>> = {
  sunset: [18.5, 20.5],
  aurora: [21.5, 23.8],
  city: [19.5, 23],
  table: [8, 10.5],
  family: [16, 19.5],
}

let fileCounter = 1200

interface MakeOptions {
  id: string
  seed: number
  date: number
  place: string | null
  scene: Scene
  owner: 'me' | 'shared'
  source: PhotoSource
  albums?: string[]
  vintage?: boolean
  stamp?: boolean
}

function makePhoto(r: Rng, o: MakeOptions): Photo {
  const year = new Date(o.date).getFullYear()
  const old = o.vintage ?? year < 2014
  const shot = o.scene === 'screenshot'
  const video = !shot && r() < (old ? 0.03 : 0.085)
  let dims: [number, number] = shot
    ? [1179, 2556]
    : video
      ? [3840, 2160]
      : old
        ? pick(r, [[3264, 2448], [2592, 1944], [3872, 2592]] as [number, number][])
        : pick(r, [[4032, 3024], [4032, 3024], [5712, 4284], [4000, 3000]] as [number, number][])
  if (!shot && r() < (old ? 0.18 : 0.32)) dims = [dims[1], dims[0]]
  const duration = video ? Math.round(r() < 0.85 ? between(r, 4, 70) : between(r, 90, 240)) : 0
  const mp = (dims[0] * dims[1]) / 1e6
  const n = fileCounter++
  const d = new Date(o.date)
  const pad = (x: number) => String(x).padStart(2, '0')
  const name = shot
    ? `Screenshot ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} at ${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(d.getSeconds())}.png`
    : old
      ? `DSC${String(n).padStart(5, '0')}.JPG`
      : `IMG_${String(n).padStart(4, '0')}.${video ? 'MOV' : 'HEIC'}`
  const favChance = o.scene === 'sunset' || o.scene === 'aurora' || o.scene === 'family' ? 0.2 : 0.07
  return {
    id: o.id,
    seed: o.seed,
    scene: o.scene,
    date: o.date,
    place: shot ? null : o.place,
    camera: shot ? 'Screenshot' : cameraFor(year, r),
    width: dims[0],
    height: dims[1],
    favorite: !shot && r() < favChance,
    video: video ? { duration } : undefined,
    owner: o.owner,
    albums: o.albums ?? [],
    source: o.source,
    name,
    bytes: Math.round(shot ? between(r, 0.6e6, 2.2e6) : video ? duration * 2.8e6 : mp * (old ? 0.33e6 : 0.24e6) * between(r, 0.8, 1.2)),
    exif: shot ? undefined : exifFor(o.scene, r),
    vintage: old || undefined,
    stamp: o.stamp || undefined,
  }
}

function timeFor(r: Rng, scene: Scene, dayStart: number, fallbackHour: number, now: number) {
  const range = HOURS[scene]
  const hour = range ? between(r, range[0], range[1]) : fallbackHour
  const t = dayStart + hour * HOUR + Math.floor(r() * 60) * 1000
  return t > now ? now - Math.floor(between(r, 2, 90)) * 60_000 : t
}

let library: Photo[] | null = null

/** The ~470 photo demo library: dense recent months, sparser as the years go back. */
export function demoLibrary(): Photo[] {
  if (library) return library
  const now = Date.now()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const dayStart = (daysAgo: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - daysAgo)
    return d.getTime()
  }
  const r = mulberry32(0x5eed1)
  const out: Photo[] = []
  let i = 0
  const add = (o: Omit<MakeOptions, 'id' | 'seed' | 'source'>) => {
    const id = `p${i}`
    out.push(makePhoto(r, { ...o, id, seed: hashString(`plumos-photo-${i}`), source: 'library' }))
    i++
  }

  // Named trips, each with its own album.
  const trips: { album: string; place: string; daysAgo: number; days: number; count: number; scenes: Scene[] }[] = [
    { album: 'big-sur', place: 'Big Sur, California', daysAgo: 64, days: 4, count: 22, scenes: ['sunset', 'mountains', 'beach', 'forest', 'sunset'] },
    { album: 'lofoten', place: 'Lofoten, Norway', daysAgo: 590, days: 5, count: 18, scenes: ['aurora', 'snow', 'mountains', 'lake', 'aurora'] },
    { album: 'kyoto', place: 'Kyoto, Japan', daysAgo: 900, days: 4, count: 16, scenes: ['flowers', 'forest', 'city', 'lake', 'table'] },
    { album: 'sahara', place: 'Merzouga, Morocco', daysAgo: 1510, days: 3, count: 12, scenes: ['desert', 'desert', 'sunset', 'family'] },
  ]
  for (const t of trips) {
    for (let k = 0; k < t.count; k++) {
      const day = t.daysAgo - Math.floor((k / t.count) * t.days)
      const scene = pick(r, t.scenes)
      add({
        date: timeFor(r, scene, dayStart(day), between(r, 9, 18), now),
        place: t.place,
        scene,
        owner: r() < 0.2 ? 'shared' : 'me',
        albums: [t.album],
      })
    }
  }

  // Everyday life and smaller trips.
  const buckets: [number, number, number, number, number][] = [
    [0, 50, 104, 3, 11],
    [50, 365, 116, 3, 9],
    [365, 3 * 365, 90, 2, 7],
    [3 * 365, 8 * 365, 56, 2, 6],
    [8 * 365, 15 * 365, 30, 1, 4],
  ]
  for (const [from, to, target, minN, maxN] of buckets) {
    let made = 0
    while (made < target) {
      const daysAgo = Math.floor(between(r, from, to))
      const travel = r() < 0.34
      const place = travel ? pick(r, TRAVEL) : null
      const homeName = pick(r, HOME_PLACES)
      const n = Math.min(target - made, intIn(r, minN, maxN) + (travel ? 2 : 0))
      const hour = between(r, 8, 17)
      for (let k = 0; k < n; k++) {
        const scene = place ? pick(r, place.scenes) : weighted(r, HOME_SCENES)
        add({
          date: timeFor(r, scene, dayStart(daysAgo), hour + k * between(r, 0.05, 0.5), now),
          place: place?.name ?? homeName,
          scene,
          owner: r() < (travel ? 0.15 : 0.42) ? 'shared' : 'me',
        })
      }
      made += n
    }
  }

  // Screenshots, sprinkled over the last two years.
  for (let k = 0; k < 16; k++) {
    const daysAgo = Math.floor(Math.pow(r(), 1.6) * 700)
    add({ date: timeFor(r, 'screenshot', dayStart(daysAgo), between(r, 8, 23), now), place: null, scene: 'screenshot', owner: 'me' })
  }

  library = out.sort((a, b) => b.date - a.date)
  return library
}

const BACKUP_SCENES: readonly (readonly [Scene, number])[] = [
  ['family', 3],
  ['table', 2],
  ['flowers', 2],
  ['sunset', 1.5],
  ['city', 1],
  ['forest', 1],
  ['screenshot', 0.6],
]

/** A photo arriving from the phone backup. */
export function makeBackupPhoto(n: number, date: number): Photo {
  const seed = hashString(`plumos-phone-${n}-${Math.floor(date / 1000)}`)
  const r = mulberry32(seed)
  const scene = weighted(r, BACKUP_SCENES)
  const photo = makePhoto(r, {
    id: `phone-${seed.toString(36)}-${n}`,
    seed,
    date,
    place: pick(r, ['Home', 'Home', 'Riverside Park', 'Backyard', 'Downtown']),
    scene,
    owner: 'me',
    source: 'phone',
  })
  return { ...photo, addedAt: Date.now() }
}

export const OLD_DRIVE_COUNT = 152

/** The photos found on the old USB drive: 2008–2012, straight off early compacts. */
export function makeDrivePhotos(driveId: string): Photo[] {
  const r = mulberry32(hashString(`plumos-drive-${driveId}`))
  const start = new Date(2008, 0, 1).getTime()
  const end = new Date(2012, 11, 31).getTime()
  const out: Photo[] = []
  let n = 0
  while (n < OLD_DRIVE_COUNT) {
    const day = start + Math.floor(r() * ((end - start) / DAY)) * DAY
    const travel = r() < 0.45
    const place = travel ? pick(r, TRAVEL) : null
    const count = Math.min(OLD_DRIVE_COUNT - n, intIn(r, 2, 8))
    const hour = between(r, 9, 17)
    const stamps = r() < 0.4
    for (let k = 0; k < count; k++) {
      const scene = place ? pick(r, place.scenes) : weighted(r, HOME_SCENES)
      const seed = hashString(`plumos-drive-${driveId}-${n}`)
      out.push(
        makePhoto(r, {
          id: `drive-${driveId}-${n}`,
          seed,
          date: timeFor(r, scene, day, hour + k * 0.3, Date.now()),
          place: place?.name ?? pick(r, HOME_PLACES),
          scene,
          owner: 'me',
          source: 'drive',
          vintage: true,
          stamp: stamps,
        }),
      )
      n++
    }
  }
  return out.sort((a, b) => a.date - b.date)
}

/** Builds a library item from a file dropped onto the window. */
export async function photoFromFile(file: File): Promise<Photo | null> {
  const isVideo = file.type.startsWith('video/')
  if (!isVideo && !file.type.startsWith('image/')) return null
  const url = URL.createObjectURL(file)
  let width = 1600
  let height = 1200
  let duration = 0
  try {
    if (isVideo) {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.src = url
      await new Promise<void>((resolve, reject) => {
        v.onloadedmetadata = () => resolve()
        v.onerror = () => reject(new Error('Unsupported video'))
        setTimeout(resolve, 3000)
      })
      width = v.videoWidth || 1920
      height = v.videoHeight || 1080
      duration = Number.isFinite(v.duration) ? Math.round(v.duration) : 0
    } else {
      const img = new Image()
      img.src = url
      await img.decode()
      width = img.naturalWidth || width
      height = img.naturalHeight || height
    }
  } catch {
    URL.revokeObjectURL(url)
    return null
  }
  const now = Date.now()
  const seed = hashString(`${file.name}-${file.size}-${file.lastModified}-${now}`)
  return {
    id: `file-${seed.toString(36)}`,
    seed,
    scene: 'table',
    date: now,
    place: null,
    camera: isVideo ? 'Video file' : 'Added from this computer',
    width,
    height,
    favorite: false,
    video: isVideo ? { duration } : undefined,
    owner: 'me',
    albums: [],
    source: 'computer',
    name: file.name,
    bytes: file.size,
    url,
    mime: file.type,
    addedAt: now,
  }
}
