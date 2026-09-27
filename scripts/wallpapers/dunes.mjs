// "Dunes" — a sea of sand dunes at golden hour: sharp sweeping crests,
// sunlit windward slopes, cool shadowed slip faces and fine wind ripples.
//
// The dunes are a heightfield rendered column by column (front to back,
// like a voxel-space terrain renderer), with 4 vertical sub-samples per pixel
// for smooth silhouettes.
import { W, H, image, toMarkup, perlin, fbm, hex, clamp, smoothstep, mix } from './raster.mjs'

const img = image()
const { w, h } = img
const K = W / w

// ---------- Terrain ----------

const n1 = perlin(501)
const n2 = perlin(502)
const n3 = perlin(503)
const n4 = perlin(504)

const WIND = 0.5 // radians; crests run across this direction
const CW = Math.cos(WIND)
const SW = Math.sin(WIND)
const LAMBDA = 150 // dune spacing (m)
const CREST = 0.74 // where the crest sits within a dune (0..1)

/** Asymmetric dune profile: long convex windward slope, sharp crest, steep slip face. */
function profile(t) {
  if (t < CREST) {
    const f = 1 - t / CREST
    return 1 - f * f * 0.7 - f * 0.3
  }
  const g = (t - CREST) / (1 - CREST)
  return (1 - g) ** 1.35
}

let lastPhase = 0 // phase of the last height() call, for ripples

function height(x, z) {
  const a = x * CW + z * SW // along the wind
  const b = -x * SW + z * CW // along the crests
  const warp = 90 * fbm(n1, b * 0.0021, a * 0.0011, 3) + 14 * n2(b * 0.009, a * 0.006)
  const ph = (a + warp) / LAMBDA
  const cell = Math.floor(ph)
  const t = ph - cell
  lastPhase = t
  const amp = 26 * (0.25 + 0.75 * smoothstep(-0.6, 0.5, n3(b * 0.0032 + cell * 3.7, cell * 1.31)))
  const broad = 10 * fbm(n2, x * 0.0016 + 3, z * 0.0016, 2) + 2.5 * n4(x * 0.01, z * 0.01)
  return amp * profile(t) + broad
}

// ---------- Camera ----------

const CAM_X = 0
const CAM_Z = 350
const CAM_Y = 38
const YAW = 0.08 // radians, + turns right
const CY = Math.cos(YAW)
const SY = Math.sin(YAW)
const HORIZON = 0.385 * H // design px
const TAN = Math.tan((52 * Math.PI) / 180 / 2) // horizontal half-FOV
const F = W / 2 / TAN // focal length in design px
const Z_NEAR = 8
const Z_FAR = 5200
const SUB = 4

// ---------- Column pass: find the surface under every sub-row ----------

const rows = h * SUB
const hitZ = new Float32Array(w * rows).fill(Infinity)
for (let px = 0; px < w; px++) {
  const sx = ((px + 0.5) * K - W / 2) / F // ray slope in x
  let ymin = rows // sub-rows >= ymin are already filled
  let zPrev = Z_NEAR
  let yPrev = Infinity
  for (let z = Z_NEAR; z < Z_FAR && ymin > 0; z += Math.max(0.04, z * 0.0022)) {
    const hh = height(CAM_X + sx * z * CY + z * SY, CAM_Z - sx * z * SY + z * CY)
    const ys = ((HORIZON - ((hh - CAM_Y) / z) * F) / K) * SUB // sub-row, float
    if (ys < ymin) {
      const top = Math.max(0, Math.ceil(ys - 0.5))
      for (let r = top; r < ymin; r++) {
        const t = yPrev === Infinity ? 1 : clamp((r + 0.5 - yPrev) / (ys - yPrev))
        hitZ[r * w + px] = mix(zPrev, z, t)
      }
      ymin = top
    }
    zPrev = z
    yPrev = ys
  }
}

// ---------- Shading ----------

const norm = (v) => {
  const l = Math.hypot(v[0], v[1], v[2])
  return [v[0] / l, v[1] / l, v[2] / l]
}
const SUN = norm([-0.72, 0.11, 0.67]) // low sun, ahead and to the left
const SUN_C = hex('#ffbf73').map((c) => c * 3.6)
const SKY_C = hex('#7d8fd0').map((c) => c * 0.36)
const BOUNCE_C = hex('#e08a52').map((c) => c * 0.1)
const SAND = hex('#dba06a')
const HAZE_NEAR = hex('#c98f72')
const HAZE_FAR = hex('#efc49b')

/** Gentle filmic shoulder so the sunlit sand stays rich instead of clipping. */
const tone = (v) => {
  const x = v * 1.05
  return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)
}

const rip = perlin(505)

const rayShadow = (x, y, z) => {
  // Soft shadow: march toward the sun, remembering how closely the ray grazes the sand.
  let res = 1
  let d = 0.6
  for (let i = 0; i < 44 && d < 900; i++) {
    const px = x + SUN[0] * d
    const pz = z + SUN[2] * d
    const py = y + SUN[1] * d
    const gap = py - height(px, pz)
    if (gap < 0) return 0
    res = Math.min(res, (gap / d) * 9)
    d *= 1.16
  }
  return smoothstep(0, 1, res)
}

function ground(sx, depth, out) {
  const x = CAM_X + sx * depth * CY + depth * SY
  const z = CAM_Z - sx * depth * SY + depth * CY
  const eps = Math.max(0.02, (depth * K) / F)
  const y = height(x, z)
  const t = lastPhase
  const dx = (height(x + eps, z) - y) / eps
  const dz = (height(x, z + eps) - y) / eps
  let n = norm([-dx, 1, -dz])

  // Wind ripples on the windward slopes, fading out before they alias.
  const lam = 0.55
  const foot = (depth * K) / F
  const rv = (1 - smoothstep(lam / 6, lam / 2.5, foot)) * (t < CREST ? smoothstep(0.02, 0.2, t) * (1 - smoothstep(CREST - 0.06, CREST, t)) : 0)
  if (rv > 0) {
    const a = x * CW + z * SW
    const b = -x * SW + z * CW
    const phase = (a + 1.6 * rip(b * 0.08, a * 0.05) + 0.5 * rip(b * 0.3, a * 0.2)) / lam
    const f = phase - Math.floor(phase)
    const s = (f < 0.7 ? 1 : -2.33) * 0.07 * rv // gentle stoss, steep lee — like real ripples
    n = norm([n[0] + s * CW, n[1], n[2] + s * SW])
  }

  let sun = clamp(n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2])
  if (sun > 0) sun *= rayShadow(x, y + 0.05, z)
  const sky = 0.55 + 0.45 * n[1]
  const bounce = clamp(0.5 - 0.5 * n[1]) + 0.25
  const dist = Math.hypot(depth * sx, depth, CAM_Y - y)
  // Aerial perspective: distant dunes dissolve into the glow at the horizon.
  const fog = 1 - Math.exp(-((dist / 1700) ** 1.3))
  const hz = smoothstep(0.3, 1, fog)
  for (let c = 0; c < 3; c++) {
    const lit = tone(SAND[c] * (SUN_C[c] * sun + SKY_C[c] * sky + BOUNCE_C[c] * bounce))
    out[c] = mix(lit, mix(HAZE_NEAR[c], SKY_HZ[c] * 0.92, hz), fog)
  }
  return out
}

const SKY_TOP = hex('#26336a')
const SKY_MID = hex('#8a7fb0')
const SKY_LOW = hex('#e99a86')
const SKY_HZ = hex('#f5b878')

function sky(X, Y, out) {
  const e = (HORIZON - Y) / HORIZON // 0 at the horizon, 1 at the top
  const t1 = smoothstep(0, 0.35, e)
  const t2 = smoothstep(0.25, 1, e)
  const scx = SUN[0] * CY - SUN[2] * SY
  const scz = SUN[0] * SY + SUN[2] * CY
  const sunX = scz > 0.05 ? W / 2 + (scx / scz) * F : scx < 0 ? -W : 2 * W
  const glow = Math.exp(-(((X - sunX) / W) ** 2) * 2.2 - (e / 0.5) ** 2)
  for (let c = 0; c < 3; c++) {
    const base = mix(mix(SKY_HZ[c], SKY_LOW[c], t1), mix(SKY_MID[c], SKY_TOP[c], t2), smoothstep(0.1, 0.55, e))
    out[c] = base + glow * SUN_C[c] * 0.18
  }
  return out
}

const tmp = [0, 0, 0]
for (let py = 0; py < h; py++) {
  for (let px = 0; px < w; px++) {
    const i = py * w + px
    const X = (px + 0.5) * K
    const sx = (X - W / 2) / F
    let r = 0
    let g = 0
    let b = 0
    // Shade once if all sub-rows see the same surface, otherwise each one.
    let zmin = Infinity
    let zmax = 0
    for (let s = 0; s < SUB; s++) {
      const z = hitZ[(py * SUB + s) * w + px]
      zmin = Math.min(zmin, z)
      zmax = Math.max(zmax, z)
    }
    if (zmax !== Infinity && zmax - zmin < zmin * 0.02) {
      const z = (zmin + zmax) / 2
      ground(sx, z, tmp)
      r = tmp[0]
      g = tmp[1]
      b = tmp[2]
    } else {
      for (let s = 0; s < SUB; s++) {
        const z = hitZ[(py * SUB + s) * w + px]
        if (z === Infinity) sky(X, (py + (s + 0.5) / SUB) * K, tmp)
        else ground(sx, z, tmp)
        r += tmp[0] / SUB
        g += tmp[1] / SUB
        b += tmp[2] / SUB
      }
    }
    img.r[i] = r
    img.g[i] = g
    img.b[i] = b
  }
}

export default toMarkup(img, { grain: 3, seed: 5 })
