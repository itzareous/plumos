// Pixel-level toolkit for the wallpapers that are painted in Node rather than
// described as SVG: seeded noise, blur, colour helpers and a tiny PNG encoder.
// A scene fills linear-light float buffers and `toMarkup` turns them into an
// <img> that scripts/render-wallpapers.mjs screenshots like any other scene.
//
// Set WP_SCALE (e.g. 0.5) to paint a smaller preview while iterating.
import { deflateSync, crc32 } from 'node:zlib'
import { W, H, rng } from './util.mjs'

export const SCALE = Number(process.env.WP_SCALE) || 1

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x)
export const mix = (a, b, t) => a + (b - a) * t
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

// ---------- Colour ----------

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

/** '#rrggbb' → linear-light [r, g, b]. */
export function hex(h) {
  const n = parseInt(h.slice(1), 16)
  return [toLin(((n >> 16) & 255) / 255), toLin(((n >> 8) & 255) / 255), toLin((n & 255) / 255)]
}

/** Samples a list of [offset, '#hex'] stops (offsets ascending) at t, in linear light. */
export function ramp(stops) {
  const s = stops.map(([o, c]) => [o, typeof c === 'string' ? hex(c) : c])
  const out = [0, 0, 0]
  return (t) => {
    if (t <= s[0][0]) return s[0][1]
    for (let i = 1; i < s.length; i++) {
      if (t <= s[i][0]) {
        const [o0, c0] = s[i - 1]
        const [o1, c1] = s[i]
        const k = (t - o0) / (o1 - o0)
        const e = k * k * (3 - 2 * k) * 0.35 + k * 0.65 // gentle easing hides stop seams
        out[0] = c0[0] + (c1[0] - c0[0]) * e
        out[1] = c0[1] + (c1[1] - c0[1]) * e
        out[2] = c0[2] + (c1[2] - c0[2]) * e
        return out
      }
    }
    return s[s.length - 1][1]
  }
}

// ---------- Noise ----------

/** Seeded 2D gradient noise, roughly in [-1, 1]. */
export function perlin(seed = 1) {
  const rand = rng(seed)
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const t = p[i]
    p[i] = p[j]
    p[j] = t
  }
  const perm = new Uint8Array(512)
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
  const gx = new Float32Array(256)
  const gy = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    const a = rand() * Math.PI * 2
    gx[i] = Math.cos(a)
    gy[i] = Math.sin(a)
  }
  return (x, y) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const X = xi & 255
    const Y = yi & 255
    const a = perm[X] + Y
    const b = perm[X + 1] + Y
    const aa = perm[a]
    const ab = perm[a + 1]
    const ba = perm[b]
    const bb = perm[b + 1]
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
    const n00 = gx[aa] * xf + gy[aa] * yf
    const n10 = gx[ba] * (xf - 1) + gy[ba] * yf
    const n01 = gx[ab] * xf + gy[ab] * (yf - 1)
    const n11 = gx[bb] * (xf - 1) + gy[bb] * (yf - 1)
    const x0 = n00 + (n10 - n00) * u
    const x1 = n01 + (n11 - n01) * u
    return (x0 + (x1 - x0) * v) * 1.41
  }
}

const ROT_C = Math.cos(0.62)
const ROT_S = Math.sin(0.62)

/** Fractal sum of `noise`, each octave rotated to avoid grid-aligned artefacts. */
export function fbm(noise, x, y, octaves = 5, lacunarity = 2, gain = 0.5) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x, y)
    norm += amp
    const nx = (x * ROT_C - y * ROT_S) * lacunarity + 17.3
    y = (x * ROT_S + y * ROT_C) * lacunarity - 9.1
    x = nx
    amp *= gain
  }
  return sum / norm
}

/** Ridged multifractal: sharp creases where the noise crosses zero, in [0, 1]. */
export function ridged(noise, x, y, octaves = 5, lacunarity = 2.1, gain = 0.5) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  let weight = 1
  for (let i = 0; i < octaves; i++) {
    let n = 1 - Math.abs(noise(x, y))
    n *= n
    n *= weight
    weight = clamp(n * 1.6)
    sum += amp * n
    norm += amp
    const nx = (x * ROT_C - y * ROT_S) * lacunarity + 5.7
    y = (x * ROT_S + y * ROT_C) * lacunarity + 11.3
    x = nx
    amp *= gain
  }
  return sum / norm
}

/**
 * Cellular (Worley) noise. Returns F1 (distance to the nearest feature point)
 * and leaves F2 in `cell.f2`, so F2 - F1 gives the lacy cell-edge network.
 */
export function worley(seed = 1) {
  const s = (seed * 2654435761) >>> 0
  const hash = (x, y, k) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(k, 2246822519) + s) | 0
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
  const cell = (x, y) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    let f1 = 9
    let f2 = 9
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const cx = xi + i
        const cy = yi + j
        const dx = cx + hash(cx, cy, 1) - x
        const dy = cy + hash(cx, cy, 2) - y
        const d = dx * dx + dy * dy
        if (d < f1) {
          f2 = f1
          f1 = d
        } else if (d < f2) f2 = d
      }
    }
    cell.f2 = Math.sqrt(f2)
    return Math.sqrt(f1)
  }
  cell.f2 = 0
  return cell
}

// ---------- Images ----------

/** Planar linear-light RGB image. */
export function image(w = Math.round(W * SCALE), h = Math.round(H * SCALE)) {
  const n = w * h
  return { w, h, r: new Float32Array(n), g: new Float32Array(n), b: new Float32Array(n) }
}

export const channel = (img) => new Float32Array(img.w * img.h)

function boxBlurH(src, dst, w, h, r) {
  const k = 1 / (r + r + 1)
  for (let y = 0; y < h; y++) {
    const row = y * w
    let acc = src[row] * (r + 1)
    for (let i = 0; i < r; i++) acc += src[row + Math.min(i, w - 1)]
    for (let x = 0; x < w; x++) {
      acc += src[row + Math.min(x + r, w - 1)] - src[row + Math.max(x - r - 1, 0)]
      dst[row + x] = acc * k
    }
  }
}

function boxBlurV(src, dst, w, h, r) {
  const k = 1 / (r + r + 1)
  for (let x = 0; x < w; x++) {
    let acc = src[x] * (r + 1)
    for (let i = 0; i < r; i++) acc += src[Math.min(i, h - 1) * w + x]
    for (let y = 0; y < h; y++) {
      acc += src[Math.min(y + r, h - 1) * w + x] - src[Math.max(y - r - 1, 0) * w + x]
      dst[y * w + x] = acc * k
    }
  }
}

/** Approximate Gaussian blur (three box passes) of one channel, with separate x/y sigma. */
export function blur(ch, w, h, sx, sy = sx) {
  const tmp = new Float32Array(ch.length)
  const radii = (s) => {
    if (s < 0.5) return [0, 0, 0]
    const wIdeal = Math.sqrt((12 * s * s) / 3 + 1)
    let wl = Math.floor(wIdeal)
    if (wl % 2 === 0) wl--
    const m = Math.round((12 * s * s - 3 * wl * wl - 12 * wl - 9) / (-4 * wl - 4))
    return [0, 1, 2].map((i) => ((i < m ? wl : wl + 2) - 1) / 2)
  }
  for (const r of radii(sx)) if (r > 0) (boxBlurH(ch, tmp, w, h, r), ch.set(tmp))
  for (const r of radii(sy)) if (r > 0) (boxBlurV(ch, tmp, w, h, r), ch.set(tmp))
  return ch
}

// ---------- Output ----------

function png(w, h, rgb) {
  const stride = w * 3 + 1
  const raw = Buffer.alloc(stride * h)
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0
    rgb.copy(raw, y * stride + 1, y * w * 3, (y + 1) * w * 3)
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body))
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr.set([8, 2, 0, 0, 0], 8)
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 4 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * Encodes a linear-light image to an <img> tag. Dithering removes gradient
 * banding; `grain` adds monochrome film grain (in 8-bit levels, strongest in
 * the mid-tones).
 */
export function toMarkup(img, { grain = 0, seed = 7 } = {}) {
  const { w, h, r, g, b } = img
  const LUT = 4096
  const lut = new Float32Array(LUT + 1)
  for (let i = 0; i <= LUT; i++) {
    const l = i / LUT
    lut[i] = (l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055) * 255
  }
  const enc = (v) => (v <= 0 ? 0 : v >= 1 ? lut[LUT] : lut[(v * LUT) | 0])
  const rand = rng(seed)
  const out = Buffer.alloc(w * h * 3)
  for (let i = 0; i < w * h; i++) {
    const R = enc(r[i])
    const G = enc(g[i])
    const B = enc(b[i])
    let n = rand() - rand() // triangular dither, ±1 level
    if (grain) {
      const lum = (R * 0.3 + G * 0.55 + B * 0.15) / 255
      n += (rand() + rand() + rand() - 1.5) * grain * (0.35 + 1.3 * lum * (1 - lum))
    }
    out[i * 3] = clamp(Math.round(R + n), 0, 255)
    out[i * 3 + 1] = clamp(Math.round(G + n), 0, 255)
    out[i * 3 + 2] = clamp(Math.round(B + n), 0, 255)
  }
  const data = png(w, h, out).toString('base64')
  return `<img alt="" src="data:image/png;base64,${data}" style="display:block;width:100vw;height:100vh">`
}

/** Calls `fn(x, y)` for every pixel in design-space (2560×1600) coordinates. */
export function eachPixel(img, fn) {
  const { w, h } = img
  const k = W / w
  for (let y = 0; y < h; y++) {
    const Y = (y + 0.5) * k
    for (let x = 0; x < w; x++) fn((x + 0.5) * k, Y, y * w + x)
  }
}

export { W, H, rng }
