/**
 * Monotone cubic interpolation (Fritsch–Carlson, the same curve as d3's
 * curveMonotoneX): smooth, but never overshoots the data, so a 0% sample
 * never dips below the baseline and peaks stay where they really are.
 */

/** Tangent (dy/dx) at each point. `xs` must be strictly increasing. */
export function tangents(xs: number[], ys: number[]): number[] {
  const n = xs.length
  const m = new Array<number>(n).fill(0)
  if (n < 2) return m
  const s: number[] = []
  for (let i = 0; i < n - 1; i++) s.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i] || 1))
  if (n === 2) {
    m[0] = m[1] = s[0]
    return m
  }
  for (let i = 1; i < n - 1; i++) {
    const h0 = xs[i] - xs[i - 1]
    const h1 = xs[i + 1] - xs[i]
    const s0 = s[i - 1]
    const s1 = s[i]
    const p = (s0 * h1 + s1 * h0) / (h0 + h1)
    m[i] = (Math.sign(s0) + Math.sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0
  }
  m[0] = (3 * s[0] - m[1]) / 2
  m[n - 1] = (3 * s[n - 2] - m[n - 2]) / 2
  return m
}

const r = (v: number) => Math.round(v * 100) / 100

/** SVG path data for the curve through the points, as cubic Béziers. */
export function curvePath(xs: number[], ys: number[], m: number[]): string {
  const n = xs.length
  if (!n) return ''
  let d = `M${r(xs[0])},${r(ys[0])}`
  for (let i = 0; i < n - 1; i++) {
    const h = (xs[i + 1] - xs[i]) / 3
    const c1 = `${r(xs[i] + h)},${r(ys[i] + m[i] * h)}`
    const c2 = `${r(xs[i + 1] - h)},${r(ys[i + 1] - m[i + 1] * h)}`
    d += `C${c1} ${c2} ${r(xs[i + 1])},${r(ys[i + 1])}`
  }
  return d
}

/** The curve's y at an arbitrary x (clamped to the data's range). */
export function curveAt(x: number, xs: number[], ys: number[], m: number[]): number {
  const n = xs.length
  if (!n) return 0
  if (n === 1 || x <= xs[0]) return ys[0]
  if (x >= xs[n - 1]) return ys[n - 1]
  let i = n - 2
  while (i > 0 && xs[i] > x) i--
  const h = xs[i + 1] - xs[i]
  const t = (x - xs[i]) / h
  const t2 = t * t
  const t3 = t2 * t
  return (
    (2 * t3 - 3 * t2 + 1) * ys[i] +
    (t3 - 2 * t2 + t) * h * m[i] +
    (-2 * t3 + 3 * t2) * ys[i + 1] +
    (t3 - t2) * h * m[i + 1]
  )
}

/** Rounds up to 1, 2 or 5 × 10ⁿ so axis labels (and their halves) stay clean. */
export function niceCeil(value: number): number {
  if (!(value > 0)) return 1
  const base = 10 ** Math.floor(Math.log10(value))
  const f = value / base
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * base
}
