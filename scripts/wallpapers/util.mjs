// Small helpers shared by the wallpaper generators.

export const W = 2560
export const H = 1600

/** Deterministic PRNG so every render of a wallpaper is identical. */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Turns a handful of control points (in 0..1 units) into a jagged ridge line
 * using midpoint displacement.
 */
export function ridge(points, { seed = 1, roughness = 0.5, depth = 5, amp = 40 } = {}) {
  const rand = rng(seed)
  let pts = points.map(([x, y]) => [x * W, y * H])
  let a = amp
  for (let d = 0; d < depth; d++) {
    const next = [pts[0]]
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1]
      const [x1, y1] = pts[i]
      const mx = (x0 + x1) / 2 + (rand() - 0.5) * a * 0.3
      const my = (y0 + y1) / 2 + (rand() - 0.5) * a
      next.push([mx, my], [x1, y1])
    }
    pts = next
    a *= roughness
  }
  return pts
}

export const toPath = (pts, close = []) =>
  'M' +
  pts
    .concat(close)
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' L') +
  (close.length ? ' Z' : '')

/** Smooth closed/open path through points using Catmull-Rom → cubic Bézier. */
export function smooth(points, closed = false) {
  const p = points.map(([x, y]) => [x * W, y * H])
  const n = p.length
  const get = (i) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))])
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`
  const last = closed ? n : n - 1
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1)
    const p1 = get(i)
    const p2 = get(i + 1)
    const p3 = get(i + 2)
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d + (closed ? ' Z' : '')
}

/** Film grain overlay, applied last to every wallpaper. */
export const grain = (opacity = 0.08) => `
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="${opacity}" style="mix-blend-mode:overlay"/>`

export const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`
