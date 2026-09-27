// "Lagoon" — a tropical lagoon from above: deep ocean, a surf-lined reef and
// turquoise shallows flowing around soft white sand bars.
import { W, H, image, eachPixel, toMarkup, perlin, fbm, hex, ramp, clamp, smoothstep, mix } from './raster.mjs'

const img = image()
const A = W / H

const nA = perlin(601)
const nB = perlin(602)
const nC = perlin(603)
const nD = perlin(604)
const nE = perlin(605)

/** Signed distance-ish from the reef line (negative on the ocean side). */
function reefSide(u, v) {
  const reef = 0.43 - 0.26 * u + 0.06 * Math.sin(u * 4.4 + 0.3) + 0.045 * fbm(nA, u * 3.5, 0.5, 5)
  return v - reef
}

/** Flow coordinate: sand ribbons and the channel run along lines of constant psi. */
function psi(u, v) {
  const wx = fbm(nB, u * 1.5, v * 1.5, 3)
  const wy = fbm(nC, u * 1.5 + 4.2, v * 1.5 - 1.3, 3)
  const uu = u + 0.1 * wx
  const vv = v + 0.1 * wy
  return vv + uu * 0.42 + 0.08 * Math.sin(uu * 5 + 1.1)
}

/** Water depth in metres (negative = dry sand). */
function depth(x, y) {
  const u = x / W
  const v = y / H
  const s = reefSide(u, v)
  const p = psi(u, v)
  // Sand ribbons: a few flowing banks of varying width, broken into bars.
  const band = 0.5 + 0.5 * Math.cos(p * Math.PI * 2 * 1.9 + 1.2 * fbm(nD, u * 2.5, v * 2.5, 6))
  const breakup = smoothstep(-0.35, 0.35, fbm(nE, u * 1.8 + p * 3, v * 1.5, 6))
  const bar = smoothstep(0.25, 1, band) ** 1.4 * breakup
  // Near the reef the flat is shallow and patchy.
  const flat = Math.exp(-(((s - 0.05) / 0.05) ** 2))
  const floor =
    3.6 +
    1.6 * fbm(nC, u * 6, v * 6, 4) +
    3 * smoothstep(0.15, 0.6, fbm(nA, u * 1.6 + 7, v * 1.6, 3)) +
    0.5 * fbm(nB, u * 30, v * 30, 4)
  const lagoon = floor - 5.4 * bar - 2.2 * flat
  // A sharp drop-off at the reef edge, then the long slope into the deep.
  const drop = smoothstep(0, 0.018, -s)
  const ocean = 1 + 12 * drop + 70 * smoothstep(0.012, 0.25, -s) ** 1.1 + 2 * fbm(nB, u * 20, v * 20, 3) * (1 - drop)
  const t = smoothstep(-0.004, 0.012, s)
  return mix(ocean, lagoon, t)
}

// Surface wavelets: a handful of directional waves (wind from the upper left),
// warped by noise so they never look like a regular grid.
const waves = []
{
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let k = 0; k < 12; k++) {
    const ang = 0.55 + (rnd() - 0.5) * 2.6
    const len = 9 + rnd() * 30
    waves.push({ kx: (Math.cos(ang) * Math.PI * 2) / len, ky: (Math.sin(ang) * Math.PI * 2) / len, a: len / 60, ph: rnd() * 6.28 })
  }
}
function waveSlope(x, y) {
  const wx = x + 18 * nD(x * 0.004, y * 0.004)
  const wy = y + 18 * nE(x * 0.004 + 3, y * 0.004)
  let sx = 0
  let sy = 0
  for (const w of waves) {
    const c = Math.cos(wx * w.kx + wy * w.ky + w.ph) * w.a
    sx += c * w.kx
    sy += c * w.ky
  }
  return sx * 0.6 + sy * 0.8 // slope towards the bright part of the sky
}

// Water colour by depth, as seen from above on a bright day (sRGB design colours).
const waterRamp = ramp([
  [0, '#d9f5ea'],
  [0.4, '#b4eee2'],
  [1.4, '#6fdcd2'],
  [2.8, '#2cbcc6'],
  [4.5, '#169fbd'],
  [7, '#0f82b0'],
  [11, '#0b659c'],
  [22, '#0a4d86'],
  [45, '#093a6c'],
  [90, '#072c56'],
])
const SAND_DRY = hex('#f3ecdc')
const SAND_WET = hex('#dccfb4')
const GRASS = hex('#2f6b6a')
const CORAL = hex('#3f6a66')
const FOAM = hex('#f6fbfb')
const AERATED = hex('#a6e9e6')

eachPixel(img, (x, y, i) => {
  const u = x / W
  const v = y / H
  const d = depth(x, y)
  const s = reefSide(u, v)

  let r
  let g
  let b
  if (d < 0) {
    // Exposed sand: brightest on top, wetter and darker at the waterline.
    const wet = (1 - smoothstep(-0.02, -0.9, d)) * 0.6
    // Gentle relief, wind ripples and damp patches on the sand.
    const e = 3
    const relief = clamp(1 + ((depth(x + e, y) - d) * 0.8 + (depth(x, y + e) - d) * 1.0) * 0.6, 0.9, 1.08)
    const ripple = Math.sin(x * 0.16 + y * 0.09 + 5 * nC(x * 0.005, y * 0.005))
    const damp = smoothstep(0.1, 0.5, fbm(nB, x * 0.006, y * 0.006, 4)) * 0.06
    const grain = relief * (1 + 0.007 * ripple + 0.025 * nE(x * 0.06, y * 0.06) - damp)
    r = mix(SAND_DRY[0], SAND_WET[0], wet) * grain
    g = mix(SAND_DRY[1], SAND_WET[1], wet) * grain
    b = mix(SAND_DRY[2], SAND_WET[2], wet) * grain
    // A thin wash line where the water laps the sand.
    const wash = Math.exp(-(((d + 0.03) / 0.04) ** 2)) * 0.12
    r = mix(r, FOAM[0], wash)
    g = mix(g, FOAM[1], wash)
    b = mix(b, FOAM[2], wash)
  } else {
    const c = waterRamp(d)
    r = c[0]
    g = c[1]
    b = c[2]
    // Seagrass meadows: crisp-edged darker patches in the mid-depth lagoon.
    // (stretched along the flow, soft-edged, denser in the middle)
    const gn = fbm(nE, x * 0.0045 - y * 0.002, y * 0.009 + x * 0.002, 6)
    const inner = 0.75 + 0.25 * fbm(nB, x * 0.02, y * 0.02, 3)
    const grass = smoothstep(0.2, 0.32, gn) * inner * smoothstep(2.2, 3.5, d) * (1 - smoothstep(7, 10, d))
    r = mix(r, GRASS[0], grass * 0.3)
    g = mix(g, GRASS[1], grass * 0.3)
    b = mix(b, GRASS[2], grass * 0.3)
    // Coral heads scattered over the reef flat and the upper slope.
    const coralZone = Math.exp(-(((s - 0.02) / 0.04) ** 2)) * smoothstep(0.5, 1.5, d) * smoothstep(0, 0.012, s)
    const coral = smoothstep(0.1, 0.35, fbm(nA, x * 0.01, y * 0.01, 4)) * coralZone
    r = mix(r, CORAL[0], coral * 0.55)
    g = mix(g, CORAL[1], coral * 0.55)
    b = mix(b, CORAL[2], coral * 0.55)
    // Sand ripples show through the shallows.
    const rp = Math.sin((x * 0.09 + y * 0.05 + 6 * nC(x * 0.004, y * 0.004)) * 1.0) * (1 - smoothstep(0.5, 3.5, d))
    // Wind waves on the surface; long swell in the open ocean.
    const wave = fbm(nD, x * 0.006 + y * 0.003, y * 0.03 - x * 0.006, 4)
    const swellTex = fbm(nC, x * 0.003 + y * 0.0015, y * 0.012 - x * 0.002, 5) * smoothstep(4, 20, d)
    const glint = waveSlope(x, y) * (0.09 + 0.1 * smoothstep(2, 12, d))
    const sheen = 1 + 0.06 * rp + 0.04 * wave + 0.14 * swellTex + glint
    r *= sheen
    g *= sheen
    b *= sheen
  }

  // Surf breaking along the reef, with fainter swell lines beyond it.
  const brk = smoothstep(-0.2, 0.3, fbm(nA, u * 9, 3.3, 4))
  const streak = 0.55 + 0.45 * smoothstep(-0.3, 0.4, fbm(nC, u * 90, s * 260, 3))
  const surf = Math.exp(-(((s + 0.003 + 0.003 * nB(u * 40, 5)) / 0.005) ** 2)) * brk * streak
  const froth = Math.exp(-(((s - 0.012) / 0.018) ** 2)) * 0.4 * brk * smoothstep(0.05, 0.5, fbm(nE, u * 45, s * 70, 3))
  // Thin foam is aerated water, so it reads pale aqua; only dense foam is white.
  const foam = clamp(surf + froth)
  const k = foam ** 0.8
  img.r[i] = mix(r, mix(AERATED[0], FOAM[0], foam), k)
  img.g[i] = mix(g, mix(AERATED[1], FOAM[1], foam), k)
  img.b[i] = mix(b, mix(AERATED[2], FOAM[2], foam), k)
  void A
})

export default toMarkup(img, { grain: 3, seed: 9 })
