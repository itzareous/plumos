// "Vestra" — sunset over jagged dark mountains and a black-sand beach, with
// wet sand mirroring the sky and a wave of foam lace rolling in.
// The default Plumos wallpaper.
import {
  W, H, image, eachPixel, toMarkup, perlin, fbm, ridged, worley, blur, hex, ramp, clamp, smoothstep, mix,
  profile, at, roughen,
} from './raster.mjs'

const HORIZON = 880
const img = image()
const { w, h } = img
const K = W / w

const pts = (list) => list.map(([u, v]) => [u * W, v * H])

const mainTop = roughen(
  profile(
    pts([
      [-0.2, 0.6], [-0.02, 0.55], [0.08, 0.54], [0.13, 0.49], [0.17, 0.44], [0.2, 0.38], [0.235, 0.31],
      [0.27, 0.26], [0.3, 0.215], [0.325, 0.25], [0.345, 0.205], [0.37, 0.27], [0.4, 0.33], [0.43, 0.38],
      [0.46, 0.415], [0.5, 0.43], [0.54, 0.41], [0.57, 0.39], [0.6, 0.365], [0.63, 0.35], [0.66, 0.375],
      [0.69, 0.325], [0.72, 0.355], [0.75, 0.335], [0.78, 0.3], [0.81, 0.325], [0.835, 0.265], [0.855, 0.32],
      [0.88, 0.37], [0.91, 0.41], [0.94, 0.395], [0.97, 0.43], [1.02, 0.46], [1.2, 0.5],
    ]),
  ),
  11, 62, 0.0055,
)
const farTop = roughen(
  profile(
    pts([
      [-0.2, 0.52], [-0.02, 0.5], [0.05, 0.47], [0.1, 0.45], [0.14, 0.43], [0.2, 0.46], [0.26, 0.5],
      [0.4, 0.45], [0.48, 0.4], [0.55, 0.38], [0.62, 0.41], [0.72, 0.43], [0.86, 0.42], [0.93, 0.44],
      [1.02, 0.47], [1.2, 0.49],
    ]),
  ),
  5, 26, 0.004,
)
const waveTop = profile(
  pts([
    [-0.3, 1.0], [-0.05, 0.92], [0.05, 0.88], [0.15, 0.83], [0.26, 0.79], [0.38, 0.765], [0.5, 0.75],
    [0.62, 0.742], [0.75, 0.735], [0.88, 0.728], [1.05, 0.72], [1.3, 0.71],
  ]),
)

// ---------- Sky ----------

const skyRamp = ramp([
  [0, '#132a5e'],
  [0.26, '#34498f'],
  [0.48, '#8174ae'],
  [0.66, '#d493a4'],
  [0.82, '#f2b784'],
  [1, '#fbd6a0'],
])
const cloudLit = ramp([
  [0, '#aaa5dc'],
  [0.35, '#f1cde0'],
  [0.6, '#ffdcc9'],
  [0.8, '#ffd29c'],
  [1, '#f4b087'],
])
const cloudShade = ramp([
  [0, '#3f4388'],
  [0.5, '#8d6ea0'],
  [1, '#cf8a84'],
])
const SUN = [0.74 * W, 0.535 * H]
const SUN_C = hex('#fff0c2')
const SUN_GLOW = hex('#ffc27d')

const cn = perlin(21)
const cw = perlin(22)
const pn = perlin(8)
const ROT = (14 * Math.PI) / 180
const RC = Math.cos(ROT)
const RS = Math.sin(ROT)

function sky(x, y, out) {
  const t = clamp((y + 0.22 * x) / (HORIZON + 0.22 * W))
  const base = skyRamp(t)
  let r = base[0]
  let g = base[1]
  let b = base[2]
  // Sun glow near the horizon on the right.
  const dx = (x - SUN[0]) / W
  const dy = (y - SUN[1]) / H
  const d2 = dx * dx + dy * dy * 2
  const core = Math.exp(-d2 / 0.004)
  const glow = Math.exp(-d2 / 0.06)
  r += SUN_C[0] * core * 0.9 + SUN_GLOW[0] * glow * 0.5
  g += SUN_C[1] * core * 0.9 + SUN_GLOW[1] * glow * 0.5
  b += SUN_C[2] * core * 0.9 + SUN_GLOW[2] * glow * 0.5
  // Darker, deeper blue in the top-left corner.
  const vig = Math.exp(-(((x / W - 0.05) / 0.6) ** 2 + ((y / H) / 0.5) ** 2)) * 0.45
  r *= 1 - vig
  g *= 1 - vig
  b *= 1 - vig * 0.6

  // Clouds live in the upper part of the sky, in a frame rotated 14°.
  const region = 1 - smoothstep(0.3 * H, 0.58 * H, y)
  if (region > 0) {
    const p = x * RC + y * RS
    const q = -x * RS + y * RC
    // Wispy cirrus: long strands, warped so they hook and fray.
    const wq = q + 60 * fbm(cw, p * 0.0012, q * 0.004, 3)
    const cir = fbm(cn, p * 0.0008, wq * 0.0068, 6)
    const cirrus = smoothstep(0.02, 0.42, cir) * region
    // Soft, darker cloud banks behind them.
    const puff = smoothstep(-0.05, 0.4, fbm(pn, p * 0.0019, q * 0.005, 5)) * region
    const k = clamp(x / W * 0.85 + (y / H) * 0.3)
    const shade = cloudShade(k)
    const lit = cloudLit(k)
    const pa = puff * 0.5
    r = mix(r, shade[0], pa)
    g = mix(g, shade[1], pa)
    b = mix(b, shade[2], pa)
    const ca = cirrus * 0.9
    r = mix(r, lit[0], ca)
    g = mix(g, lit[1], ca)
    b = mix(b, lit[2], ca)
  }
  out[0] = r
  out[1] = g
  out[2] = b
  return out
}

// ---------- Mountains ----------

const rib = perlin(41)
const rib2 = perlin(42)
const tex = perlin(43)
const ROCK_SHADE = hex('#17161d')
const ROCK_WARM = hex('#533024')
const RIM = hex('#ffa45c')
const HAZE = hex('#2c2d44')

function mountain(x, y, out) {
  const top = at(mainTop, x)
  const d = y - top
  const win = 14 + d * 0.8
  const slope = (at(mainTop, x + win) - at(mainTop, x - win)) / (2 * win) // + = face turns right
  const wide = 90 + d * 1.3
  const lean = clamp((at(mainTop, x + wide) - at(mainTop, x - wide)) / (2 * wide), -0.9, 0.9)
  const lx = x - d * lean * 0.85
  // Steep ribs and gullies up high, running straight down the fall line.
  const z = ridged(rib, lx * 0.011, y * 0.0013, 3) * 0.7 + ridged(rib2, lx * 0.034, y * 0.0035, 2) * 0.3
  const zx = ridged(rib, (lx + 4) * 0.011, y * 0.0013, 3) * 0.7 + ridged(rib2, (lx + 4) * 0.034, y * 0.0035, 2) * 0.3 - z
  // Smooth scree aprons spread out at the foot of the cliffs.
  const scree = smoothstep(HORIZON - 260 + 90 * fbm(tex, x * 0.003, 1.7, 3), HORIZON - 40, y)
  const streaks = 0.9 + 0.1 * tex(lx * 0.05, y * 0.004)
  const rock = 0.4 + 1.1 * z * z
  const detail = mix(rock, streaks * 0.75, scree)
  // Faces turned towards the sunset catch a little warm light.
  const facing = clamp(slope * 1.6 + zx * 14 * (1 - scree) + 0.05)
  const sunward = 1 - smoothstep(0, 0.6 * W, Math.abs(x - SUN[0]))
  const warm = facing * (0.25 + 0.75 * sunward) * (1 - smoothstep(0, 420, d)) * 0.6
  // A crisp rim of light along the ridge where it faces the glow.
  const rim = Math.exp(-d / 2.2) * clamp(slope * 2.5 + 0.35) * (0.35 + 0.65 * sunward)
  const haze = smoothstep(HORIZON - 150, HORIZON, y) * 0.22
  for (let c = 0; c < 3; c++) {
    let v = mix(ROCK_SHADE[c], ROCK_WARM[c], warm) * detail
    v += RIM[c] * rim * 0.7
    out[c] = mix(v, HAZE[c], haze)
  }
  return out
}

const FAR = hex('#4d4870')
const FAR_LOW = hex('#3a3656')
function farMountain(x, y, skyC, out) {
  const d = y - at(farTop, x)
  const n = 0.85 + 0.15 * ridged(rib, x * 0.01, y * 0.003, 3)
  const t = smoothstep(0, 180, d)
  for (let c = 0; c < 3; c++) out[c] = mix(mix(FAR[c], FAR_LOW[c], t) * n, skyC[c], 0.18)
  return out
}

// ---------- Paint the sky and mountains ----------

const tmp = [0, 0, 0]
const tmp2 = [0, 0, 0]
eachPixel(img, (x, y, i) => {
  if (y > HORIZON + 3) return
  sky(x, y, tmp)
  let r = tmp[0]
  let g = tmp[1]
  let b = tmp[2]
  const farCov = clamp((y - at(farTop, x)) / K + 0.5)
  if (farCov > 0) {
    farMountain(x, y, tmp, tmp2)
    r = mix(r, tmp2[0], farCov)
    g = mix(g, tmp2[1], farCov)
    b = mix(b, tmp2[2], farCov)
  }
  const cov = clamp((y - at(mainTop, x)) / K + 0.5)
  if (cov > 0) {
    mountain(x, y, tmp2)
    r = mix(r, tmp2[0], cov)
    g = mix(g, tmp2[1], cov)
    b = mix(b, tmp2[2], cov)
  }
  img.r[i] = r
  img.g[i] = g
  img.b[i] = b
})

// ---------- Beach and wave ----------

// Reflections: a crisp copy for the wet sand, a glossier one for the wave.
const horizonRow = Math.ceil((HORIZON + 3) / K)
const copy = (sx, sy) => {
  const out = {}
  for (const k of ['r', 'g', 'b']) out[k] = blur(img[k].slice(), w, h, sx / K, sy / K)
  return out
}
const sharp = copy(1.5, 7)
const glossy = copy(22, 60)

function sample(buf, ch, x, y) {
  const fx = clamp(x / K - 0.5, 0, w - 1.001)
  const fy = clamp(y / K - 0.5, 0, horizonRow - 2.001)
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const tx = fx - x0
  const ty = fy - y0
  const a = buf[ch]
  const j = y0 * w + x0
  const top = a[j] + (a[j + 1] - a[j]) * tx
  const bot = a[j + w] + (a[j + w + 1] - a[j + w]) * tx
  return top + (bot - top) * ty
}

const sandN = perlin(51)
const poolN = perlin(52)
const edgeN = perlin(53)
const waterN = perlin(54)
const lace = worley(55)
const lace2 = worley(56)
const SAND_FAR = hex('#1b1a21')
const SAND_NEAR = hex('#09090c')
const WATER = hex('#080b12')
const FOAM = hex('#f1ebe8')
const FOAM_SHADE = hex('#8f95a8')

/** 0..1 amount of standing water on the sand. */
function wetness(x, y, edge) {
  const v = y / H
  const sheet = 1 - smoothstep(HORIZON + 4, HORIZON + 22 + 14 * poolN(x * 0.004, 1), y)
  // Long, flat pools, more of them towards the horizon and in two broad areas.
  const bias =
    0.7 * Math.exp(-(((x / W - 0.2) / 0.24) ** 2 + ((v - 0.585) / 0.03) ** 2)) +
    0.62 * Math.exp(-(((x / W - 0.78) / 0.26) ** 2 + ((v - 0.585) / 0.028) ** 2)) +
    0.3 * Math.exp(-(((x / W - 0.3) / 0.1) ** 2 + ((v - 0.665) / 0.012) ** 2)) +
    0.3 * Math.exp(-(((x / W - 0.8) / 0.12) ** 2 + ((v - 0.66) / 0.012) ** 2))
  const n = fbm(poolN, x * 0.0016, y * 0.016, 4) + bias - 0.24 - 0.3 * smoothstep(HORIZON, H, y)
  const pools = smoothstep(0.0, 0.05, n)
  // The swash zone just above the wave stays wet and glassy.
  const swash = 1 - smoothstep(0, 40 + 40 * fbm(poolN, x * 0.003, 7, 2), edge - y)
  return clamp(Math.max(sheet, pools, swash))
}

eachPixel(img, (x, y, i) => {
  if (y <= HORIZON + 2) return
  const my = 2 * HORIZON - y // mirrored row
  const near = smoothstep(HORIZON, H, y) // 0 far, 1 near
  const edge = at(waveTop, x) + 7 * fbm(edgeN, x * 0.012, 0.5, 3) + 3 * edgeN(x * 0.06, 2.5)
  const dist = y - edge // > 0 inside the wave

  let r
  let g
  let b
  if (dist < 0) {
    // Black sand: dry and matte, or wet and mirror-like.
    const grain = 0.85 + 0.3 * fbm(sandN, x * 0.004, y * 0.04, 4)
    const sr = mix(SAND_FAR[0], SAND_NEAR[0], near) * grain
    const sg = mix(SAND_FAR[1], SAND_NEAR[1], near) * grain
    const sb = mix(SAND_FAR[2], SAND_NEAR[2], near) * grain
    const wet = wetness(x, y, edge)
    const k = mix(0.82, 0.62, near) * wet
    // Even the damp sand between the pools holds a faint, blurry sheen of sky.
    const damp = 0.07 * (1 - wet) * (0.6 + 0.4 * fbm(poolN, x * 0.002, y * 0.02 + 5, 3))
    r = sr * (1 - wet * 0.6) + sample(sharp, 'r', x, my) * k + sample(glossy, 'r', x, my) * damp
    g = sg * (1 - wet * 0.6) + sample(sharp, 'g', x, my) * k + sample(glossy, 'g', x, my) * damp
    b = sb * (1 - wet * 0.6) + sample(sharp, 'b', x, my) * k + sample(glossy, 'b', x, my) * damp
    // A thin film of water runs ahead of the foam.
    const film = Math.exp(dist / 5) * 0.3
    r = mix(r, FOAM_SHADE[0] * 0.5, film)
    g = mix(g, FOAM_SHADE[1] * 0.5, film)
    b = mix(b, FOAM_SHADE[2] * 0.5, film)
  } else {
    // A thin sheet of water over black sand: it mirrors the sky at a grazing
    // angle far away and turns darker and clearer close to the viewer.
    const streak = 0.7 + 0.6 * smoothstep(-0.4, 0.5, fbm(waterN, x * 0.0018, y * 0.035, 4))
    const fres = mix(0.3, 0.1, smoothstep(0, 1, near)) * (1 - 0.3 * smoothstep(0, 300, dist)) * streak
    r = WATER[0] + sample(glossy, 'r', x, my) * fres
    g = WATER[1] + sample(glossy, 'g', x, my) * fres
    b = WATER[2] + sample(glossy, 'b', x, my) * fres

    // Foam: a dense bubbly band at the leading edge. Behind it the foam
    // breaks into lace (small holes, thick ropes), which frays into a few
    // loose strands and then gives way to dark glossy water.
    const s = 1 + near * 1.5 // perspective: foam grows as it comes closer
    const d0 = dist / s
    const band = Math.exp(-d0 / 11)
    const drift = smoothstep(0.15, 0.55, fbm(edgeN, x * 0.0022, y * 0.007, 3)) * Math.exp(-d0 / 150) * 0.45
    const density = clamp(band + Math.exp(-d0 / 58) * 0.95 + drift)
    // Warp at two scales: broad drift plus a wiggle that curves the strands.
    const wx = x + 40 * fbm(waterN, x * 0.005, y * 0.015, 3) + 7 * s * waterN(x * 0.035 / s, y * 0.1 / s)
    const wy = y + 14 * fbm(sandN, x * 0.005, y * 0.015, 3) + 2.5 * s * sandN(x * 0.035 / s, y * 0.1 / s)
    const f1 = lace(wx / (32 * s), wy / (10 * s))
    const width = 0.02 + 0.34 * density ** 1.4 * (0.6 + 0.4 * sandN(wx * 0.02, wy * 0.06))
    const fray = smoothstep(-0.15, 0.25, fbm(sandN, wx * 0.006 + 3, wy * 0.02, 3) + density - 0.55)
    const rope = (1 - smoothstep(width * 0.35, width, lace.f2 - f1)) * smoothstep(0.15, 0.5, density) * fray
    // A finer lace fills in where the foam is dense.
    const g1 = lace2(wx / (12 * s), wy / (5 * s))
    const fineRope = (1 - smoothstep(0.02, 0.05 + 0.25 * density, lace2.f2 - g1)) * smoothstep(0.45, 0.9, density) * 0.75
    let foam = clamp(band * 1.25 + rope * 0.95 + fineRope)
    foam *= 0.78 + 0.22 * fbm(sandN, x * 0.06, y * 0.18, 2) // bubbly texture
    // Foam is lit by the sunset: bright on top, cooler in its folds.
    const light = 0.55 + 0.45 * Math.exp(-dist / (220 * s))
    r = mix(r, mix(FOAM_SHADE[0], FOAM[0], foam) * light, foam)
    g = mix(g, mix(FOAM_SHADE[1], FOAM[1], foam) * light, foam)
    b = mix(b, mix(FOAM_SHADE[2], FOAM[2], foam) * light, foam)
  }
  img.r[i] = r
  img.g[i] = g
  img.b[i] = b
})

export default toMarkup(img, { grain: 4, seed: 3 })
