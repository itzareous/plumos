// "Midnight" — a calm, dark mesh gradient: deep indigo, violet and magenta
// light pooling softly out of the dark, with fine film grain.
import { W, H, image, eachPixel, toMarkup, perlin, fbm, clamp } from './raster.mjs'

const A = W / H
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const srgb = (h) => {
  const n = parseInt(h.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

// Soft colour fields painted in order, like a soft brush in a paint program
// (blended in gamma space so dark transitions stay smooth). Each is a rotated
// ellipse: [x, y, radius x, radius y (image heights), angle°, colour, opacity].
const fields = [
  [0.9, 0.1, 0.55, 0.3, 15, '#1a1460', 0.7],
  [0.06, 0.62, 0.55, 0.34, -25, '#1e2390', 0.85],
  [0.44, 0.86, 0.62, 0.22, -16, '#5320b0', 0.85],
  [0.3, 0.46, 0.42, 0.18, -20, '#06051a', 0.6],
  [0.62, 0.46, 0.36, 0.17, -30, '#3d1a8a', 0.5],
  [0.97, 0.98, 0.5, 0.3, -30, '#8e1a78', 0.9],
  [0.84, 0.72, 0.52, 0.2, -34, '#b4207f', 0.9],
  [0.9, 0.84, 0.26, 0.11, -34, '#ff5a8e', 0.5],
  [0.8, 0.3, 0.45, 0.16, -25, '#2b1d86', 0.55],
  [0.4, -0.06, 0.8, 0.4, 0, '#04030f', 0.85],
].map(([x, y, rx, ry, deg, c, a]) => {
  const t = (deg * Math.PI) / 180
  return { x, y, rx, ry, cos: Math.cos(t), sin: Math.sin(t), c: srgb(c), a }
})

// Soft folds: a light edge with a faint shadow just above it, like light
// catching silk. [curve y(u), fade-in u, fade-out u, strength]
const folds = [
  [(u) => 1.18 - 0.78 * u + 0.1 * Math.sin(u * 3.2 + 0.3), 0.3, 1.1, 1],
  [(u) => 0.98 - 0.36 * u - 0.05 * Math.sin(u * 4 + 1), -0.1, 0.62, 0.55],
  [(u) => 0.86 - 0.62 * u + 0.06 * Math.sin(u * 3 + 2.4), 0.42, 1.15, 0.6],
]
const LIGHT = srgb('#ff8fc0')

const BASE = srgb('#050414')
const wa = perlin(31)
const wb = perlin(32)
const img = image()

eachPixel(img, (X, Y, i) => {
  let u = X / W
  let v = Y / H
  // A slow, gentle warp bends the fields into curving, liquid shapes.
  u += fbm(wa, u * 0.9, v * 0.9, 2) * 0.09
  v += fbm(wb, u * 0.9 + 4.1, v * 0.9 - 2.3, 2) * 0.09

  let r = BASE[0]
  let g = BASE[1]
  let b = BASE[2]
  for (const f of fields) {
    const dx = (u - f.x) * A
    const dy = v - f.y
    const ex = (dx * f.cos + dy * f.sin) / f.rx
    const ey = (dy * f.cos - dx * f.sin) / f.ry
    const t = f.a * Math.exp(-(ex * ex + ey * ey))
    r += (f.c[0] - r) * t
    g += (f.c[1] - g) * t
    b += (f.c[2] - b) * t
  }
  for (const [c, a0, a1, k] of folds) {
    const y0 = c(u)
    const slope = (c(u + 0.002) - y0) / 0.002 / A
    const sd = (v - y0) / Math.sqrt(1 + slope * slope)
    const env = k * Math.sin(Math.PI * clamp((u - a0) / (a1 - a0))) ** 2
    const light = env * (sd > 0 ? 0.5 * Math.exp(-sd / 0.05) + 0.5 * Math.exp(-sd / 0.012) : Math.exp(-((sd / 0.004) ** 2)))
    const shade = env * (sd < 0 ? 0.55 * Math.exp(-(-sd) / 0.03) : 0)
    // The light only shows where there is colour to catch it.
    const lt = 0.5 * light * clamp(Math.max(r, g, b) * 2.2 - 0.2)
    const dk = 1 - shade * 0.45
    r = (r + (LIGHT[0] - r) * lt) * dk
    g = (g + (LIGHT[1] - g) * lt) * dk
    b = (b + (LIGHT[2] - b) * lt) * dk
  }
  img.r[i] = toLin(clamp(r))
  img.g[i] = toLin(clamp(g))
  img.b[i] = toLin(clamp(b))
})

export default toMarkup(img, { grain: 6, seed: 11 })
