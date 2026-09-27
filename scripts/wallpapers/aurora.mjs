// "Aurora" — green curtains of light over snowy peaks, mirrored in a
// still mountain lake on a clear, starry night.
import {
  W, H, SCALE, image, eachPixel, toMarkup, perlin, fbm, ridged, blur, hex, clamp, smoothstep, mix, rng,
} from './raster.mjs'

const SHORE = 1062 // waterline, in design px
const img = image()
const { w, h } = img
const K = W / w // design px per pixel

// ---------- 1D profiles ----------

/** Catmull-Rom through [x, y] points sorted by x, sampled every design px. */
function profile(points, pad = 400) {
  const out = new Float32Array(W + pad * 2)
  let seg = 0
  for (let i = 0; i < out.length; i++) {
    const x = i - pad
    while (seg < points.length - 2 && x > points[seg + 1][0]) seg++
    const p1 = points[seg]
    const p2 = points[seg + 1]
    const p0 = points[Math.max(0, seg - 1)]
    const p3 = points[Math.min(points.length - 1, seg + 2)]
    const t = clamp((x - p1[0]) / (p2[0] - p1[0]))
    const t2 = t * t
    const t3 = t2 * t
    out[i] =
      0.5 *
      (2 * p1[1] +
        (-p0[1] + p2[1]) * t +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
  }
  out.pad = pad
  return out
}

const at = (prof, x) => {
  const f = clamp(x + prof.pad, 0, prof.length - 2)
  const i = Math.floor(f)
  return prof[i] + (prof[i + 1] - prof[i]) * (f - i)
}

/** Adds sharp, jagged detail (sharp peaks, rounder saddles) to a ridge profile. */
function roughen(prof, seed, amp, base = 0.006, octaves = 7) {
  const n = perlin(seed)
  for (let i = 0; i < prof.length; i++) {
    const x = i - prof.pad
    let a = amp
    let f = base
    let d = 0
    for (let o = 0; o < octaves; o++) {
      d += a * (0.5 - Math.abs(n(x * f, o * 7.3)))
      a *= 0.5
      f *= 2.03
    }
    prof[i] -= d
  }
  return prof
}

const nearTop = roughen(
  profile([
    [-400, 860], [-60, 780], [120, 690], [250, 600], [330, 615], [430, 520], [530, 590], [650, 670],
    [780, 760], [900, 840], [1030, 910], [1160, 960], [1280, 985], [1400, 965], [1540, 905], [1680, 830],
    [1790, 760], [1880, 700], [1970, 612], [2050, 655], [2150, 600], [2270, 690], [2410, 760], [2600, 800],
    [2960, 860],
  ]),
  11, 70,
)
const farTop = roughen(
  profile([
    [-400, 900], [200, 870], [600, 850], [860, 800], [1010, 760], [1120, 718], [1230, 770], [1380, 800],
    [1520, 770], [1640, 800], [1900, 820], [2300, 840], [2960, 880],
  ]),
  23, 44,
)

// Conifer treeline along the far shore.
const trees = []
{
  const rand = rng(77)
  for (let x = -20; x < W + 20; x += 3 + rand() * 7) {
    const gap = Math.sin(x * 0.004 + 1.3) + Math.sin(x * 0.0113) * 0.6 > 1.05 // occasional clearings
    if (gap && rand() < 0.85) continue
    const hgt = 12 + rand() * 26 + (rand() < 0.1 ? 14 : 0)
    trees.push({ x, h: hgt, w: hgt * (0.3 + rand() * 0.12), tiers: 5 + rand() * 4, ph: rand() })
  }
}
const treeBuckets = Array.from({ length: Math.ceil(W / 16) + 2 }, () => [])
for (const t of trees) {
  for (let b = Math.floor((t.x - t.w) / 16); b <= Math.floor((t.x + t.w) / 16); b++) {
    if (b >= 0 && b < treeBuckets.length) treeBuckets[b].push(t)
  }
}
const TREE_BASE = SHORE - 3

/** Coverage (0..1) of the treeline at a design-space point. */
function treeCover(x, y) {
  if (y > SHORE + 1) return 0
  if (y > TREE_BASE - 4) return 1 // low shrub band along the shore
  const bucket = treeBuckets[Math.floor(x / 16)]
  if (!bucket) return 0
  let c = 0
  for (const t of bucket) {
    const top = TREE_BASE - t.h
    if (y < top) continue
    const s = (y - top) / t.h // 0 at the tip, 1 at the base
    const saw = (s * t.tiers + t.ph) % 1
    const hw = (t.w / 2) * s * (0.62 + 0.38 * saw) + 0.4
    c = Math.max(c, clamp((hw - Math.abs(x - t.x)) / K + 0.5))
  }
  return c
}

// ---------- Sky & aurora ----------

const skyTop = hex('#010208')
const skyMid = hex('#040b1c')
const skyLow = hex('#0a1c2c')

const nA = perlin(101)
const nB = perlin(102)
const nC = perlin(103)
const nD = perlin(104)

const GREEN = hex('#43ff9b')
const EDGE = hex('#b8ffcf')
const TEAL = hex('#1fd6c0')
const VIOLET = hex('#7b3cff')

const curtains = [
  {
    // The main curtain sweeps down from the upper left and dives behind the right-hand peaks.
    edge: (x) => 430 + 380 * smoothstep(-200, 1500, x) - 150 * smoothstep(1500, 2300, x) + 110 * smoothstep(2250, 2700, x),
    k: 1,
    decay: 210,
    slant: 0.22,
    seed: 0,
    span: () => 1,
  },
  {
    edge: (x) => 250 + 260 * smoothstep(300, 2400, x) + 60 * Math.sin(x * 0.0021 + 1),
    k: 0.4,
    decay: 240,
    slant: 0.12,
    seed: 40,
    span: (x) => smoothstep(500, 1100, x) * (1 - smoothstep(2000, 2500, x)),
  },
  {
    edge: (x) => 880 - 90 * smoothstep(700, 1300, x) + 40 * smoothstep(1300, 1900, x),
    k: 0.55,
    decay: 150,
    slant: 0.3,
    seed: 80,
    span: (x) => smoothstep(500, 800, x) * (1 - smoothstep(1700, 2000, x)),
  },
]

const auroraR = new Float32Array(w * h)
const auroraG = new Float32Array(w * h)
const auroraB = new Float32Array(w * h)

eachPixel(img, (x, y, i) => {
  if (y > SHORE + 2) return
  let r = 0
  let g = 0
  let b = 0
  for (const c of curtains) {
    const e =
      c.edge(x) +
      40 * fbm(nD, x * 0.0022, c.seed, 3) +
      26 * fbm(nD, x * 0.007, c.seed + 5, 3) +
      6 * fbm(nB, x * 0.03, c.seed + 8, 2)
    const hgt = e - y // height above the lower edge
    if (hgt < -60) continue
    const xr = x + hgt * c.slant + 30 * fbm(nC, x * 0.002, y * 0.002 + c.seed, 2)
    const coarse = 0.5 + 0.5 * nA(xr * 0.011, c.seed + 0.5)
    const fine = 0.5 + 0.5 * nB(xr * 0.045, c.seed + 3.1)
    const rays = 0.18 + 0.82 * (coarse * coarse * 0.8 + fine * fine * fine * 0.45)
    const len = c.decay * (0.5 + 1.1 * (0.5 + 0.5 * nA(xr * 0.0032, c.seed + 9.7)))
    const knots = smoothstep(-0.35, 0.6, fbm(nC, x * 0.0014, c.seed + 2.2, 3)) ** 1.3 * c.span(x)
    const bottom = smoothstep(-16, 12, hgt)
    const up = Math.max(hgt, 0)
    const green = bottom * Math.exp(-up / len) * rays * knots * c.k
    const edgeGlow = Math.exp(-((hgt - 6) ** 2) / 120) * rays * knots * knots * c.k
    const high = bottom * Math.exp(-up / (len * 2.6)) * smoothstep(len * 0.5, len * 2, up) * knots * c.k
    const tealMix = smoothstep(20, 160, up)
    r += green * mix(GREEN[0], TEAL[0], tealMix) * 0.55 + edgeGlow * EDGE[0] * 0.35 + high * VIOLET[0] * 0.12
    g += green * mix(GREEN[1], TEAL[1], tealMix) * 0.55 + edgeGlow * EDGE[1] * 0.35 + high * VIOLET[1] * 0.12
    b += green * mix(GREEN[2], TEAL[2], tealMix) * 0.55 + edgeGlow * EDGE[2] * 0.35 + high * VIOLET[2] * 0.12
  }
  auroraR[i] = r
  auroraG[i] = g
  auroraB[i] = b
})

// Bloom: the aurora lights up the air around it.
const glowR = blur(auroraR.slice(), w, h, 60 / K)
const glowG = blur(auroraG.slice(), w, h, 60 / K)
const glowB = blur(auroraB.slice(), w, h, 60 / K)

// Stars
const stars = channel()
function channel() {
  return new Float32Array(w * h)
}
{
  const rand = rng(5)
  for (let s = 0; s < 5200; s++) {
    const x = rand() * W
    const y = rand() ** 1.2 * (SHORE - 40)
    const m = rand() ** 16 // most stars are faint, a few are bright
    const bright = (0.006 + rand() * 0.02 + m * 0.9) * (1 - 0.75 * smoothstep(450, SHORE, y))
    const sigma = (0.5 + m * 0.8) / K
    const cx = x / K
    const cy = y / K
    const rad = Math.ceil(sigma * 3)
    for (let yy = Math.floor(cy - rad); yy <= cy + rad; yy++) {
      if (yy < 0 || yy >= h) continue
      for (let xx = Math.floor(cx - rad); xx <= cx + rad; xx++) {
        if (xx < 0 || xx >= w) continue
        const d2 = (xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2
        stars[yy * w + xx] += bright * Math.exp(-d2 / (2 * sigma * sigma)) / Math.max(1, sigma * sigma * 1.2)
      }
    }
  }
}

// ---------- Mountains ----------

const rib = perlin(201)
const rib2 = perlin(203)
const snowN = perlin(202)
const L = norm3([-0.62, 0.55, 0.5])
function norm3([x, y, z]) {
  const l = Math.hypot(x, y, z)
  return [x / l, y / l, z / l]
}

const SNOW_LIT = hex('#b9d4ee')
const SNOW_SHADE = hex('#1d3158')
const ROCK_LIT = hex('#3a4455')
const ROCK_SHADE = hex('#080c15')
const AURORA_TINT = hex('#6affc0')

/** Shades a mountain face point. Returns [r, g, b] in linear light. */
function mountain(top, x, y, far) {
  const d = y - at(top, x)
  const win = 18 + d * 0.8
  const slope = (at(top, x + win) - at(top, x - win)) / (2 * win) // + = face turns right
  // Ribs and gullies run down the fall line, which leans with the face
  // (measured over a wide window so the lean changes slowly).
  const wide = 90 + d * 1.2
  const lean = clamp((at(top, x + wide) - at(top, x - wide)) / (2 * wide), -0.9, 0.9)
  const lx = x - d * lean * 0.8
  // Major ribs and couloirs, plus smaller rock detail.
  const rz = (px, py) => ridged(rib, px * 0.0075, py * 0.0016, 3) * 0.7 + ridged(rib2, px * 0.024, py * 0.006, 3) * 0.3
  const z = rz(lx, y)
  const zx = rz(lx + 3, y) - z
  const zy = rz(lx, y + 3) - z
  const N = norm3([slope * 2.4 - zx * 22, 0.45 + zy * 10, 1])
  const lit = clamp(N[0] * L[0] + N[1] * L[1] + N[2] * L[2])
  // Snow above a ragged snowline; below it, it survives only in the gullies.
  const line = (far ? 940 : 900) + 60 * fbm(snowN, x * 0.004, 1.5, 4)
  let snow =
    Math.min((line - y) / 170, 0.9) +
    (0.62 - z) * 2 +
    0.3 * fbm(snowN, x * 0.03, y * 0.012, 3) -
    Math.abs(slope) * 0.35
  snow = smoothstep(0.34, 0.46, snow)
  const light = 0.08 + 0.92 * lit ** 1.6
  const tint = 0.22 * (1 - smoothstep(0, 350, d))
  const out = [0, 0, 0]
  const exposure = far ? 0.13 : 0.2
  for (let c = 0; c < 3; c++) {
    const snowC = mix(SNOW_SHADE[c], SNOW_LIT[c], light) * (1 - tint) + AURORA_TINT[c] * tint * light
    const rockC = mix(ROCK_SHADE[c], ROCK_LIT[c], light)
    out[c] = mix(rockC, snowC, snow) * exposure
  }
  return out
}

// ---------- Compose the upper half ----------

const HAZE = hex('#0d2231')

eachPixel(img, (x, y, i) => {
  if (y > SHORE + 2) return
  const t = y / SHORE
  const g1 = smoothstep(0, 0.65, t)
  const g2 = smoothstep(0.55, 1, t)
  let r = mix(mix(skyTop[0], skyMid[0], g1), skyLow[0], g2)
  let g = mix(mix(skyTop[1], skyMid[1], g1), skyLow[1], g2)
  let b = mix(mix(skyTop[2], skyMid[2], g1), skyLow[2], g2)
  const s = stars[i]
  r += auroraR[i] + glowR[i] * 0.6 + s * 0.9
  g += auroraG[i] + glowG[i] * 0.6 + s * 0.95
  b += auroraB[i] + glowB[i] * 0.6 + s

  const aa = K * 0.5
  const farCov = clamp((y - at(farTop, x)) / K + 0.5)
  if (farCov > 0) {
    const m = mountain(farTop, x, y, true)
    const haze = 0.45 + 0.4 * smoothstep(at(farTop, x), SHORE, y)
    r = mix(r, mix(m[0], HAZE[0] + glowR[i] * 0.3, haze), farCov)
    g = mix(g, mix(m[1], HAZE[1] + glowG[i] * 0.3, haze), farCov)
    b = mix(b, mix(m[2], HAZE[2] + glowB[i] * 0.3, haze), farCov)
  }
  const nearCov = clamp((y - at(nearTop, x)) / K + 0.5)
  if (nearCov > 0) {
    const m = mountain(nearTop, x, y, false)
    const haze = 0.35 * smoothstep(SHORE - 160, SHORE, y)
    r = mix(r, mix(m[0], HAZE[0], haze), nearCov)
    g = mix(g, mix(m[1], HAZE[1], haze), nearCov)
    b = mix(b, mix(m[2], HAZE[2], haze), nearCov)
  }
  const tc = treeCover(x, y)
  if (tc > 0) {
    r = mix(r, 0.002, tc)
    g = mix(g, 0.0035, tc)
    b = mix(b, 0.006, tc)
  }
  void aa
  img.r[i] = r
  img.g[i] = g
  img.b[i] = b
})

// ---------- Lake ----------

// Blurred copy of the upper half: a still lake reflects it slightly softened.
// Reflections soften with distance from the shore, so keep a sharp and a soft copy.
const refl = { r: img.r.slice(), g: img.g.slice(), b: img.b.slice() }
for (const ch of [refl.r, refl.g, refl.b]) blur(ch, w, h, 1 / K, 3 / K)
const soft = { r: img.r.slice(), g: img.g.slice(), b: img.b.slice() }
for (const ch of [soft.r, soft.g, soft.b]) blur(ch, w, h, 3 / K, 16 / K)

const ripple = perlin(301)
const WATER = hex('#02060c')
const shoreRow = SHORE / K

/** Bilinear sample of the reflection buffer at a design-space point. */
function sample(ch, x, y) {
  const fx = clamp(x / K - 0.5, 0, w - 1.001)
  const fy = clamp(y / K - 0.5, 0, shoreRow - 1.001)
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const tx = fx - x0
  const ty = fy - y0
  const j = y0 * w + x0
  const top = ch[j] + (ch[j + 1] - ch[j]) * tx
  const bot = ch[j + w] + (ch[j + w + 1] - ch[j + w]) * tx
  return top + (bot - top) * ty
}

eachPixel(img, (x, y, i) => {
  if (y <= SHORE) return
  const dist = y - SHORE
  const depth = dist / (H - SHORE) // 0 at the far shore, 1 at the bottom edge
  // Faint ripples: long horizontal wavelets that grow as they come closer.
  const rip = fbm(ripple, x * 0.002 / (0.4 + depth), dist ** 0.7 * 0.05, 2)
  const sy = 2 * SHORE - y + rip * (0.5 + depth * 5)
  const fres = mix(0.82, 0.5, smoothstep(0, 1, depth))
  const sheen = 1 + 0.08 * smoothstep(0.2, 0.7, fbm(ripple, x * 0.0006, dist ** 0.75 * 0.02 + 7, 2))
  const m = smoothstep(0.02, 0.75, depth)
  const k = fres * sheen
  img.r[i] = WATER[0] + mix(sample(refl.r, x, sy), sample(soft.r, x, sy), m) * k
  img.g[i] = WATER[1] + mix(sample(refl.g, x, sy), sample(soft.g, x, sy), m) * k
  img.b[i] = WATER[2] + mix(sample(refl.b, x, sy), sample(soft.b, x, sy), m) * k
})

void SCALE
export default toMarkup(img, { grain: 3, seed: 3 })
