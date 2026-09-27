import { memo, useId, type ReactNode } from 'react'

/**
 * A little generated "photo" for demo images: landscapes, sunsets, night
 * skies and city lights, varied by a seed. Pure SVG, original artwork.
 */

function rng(seed: number) {
  let a = seed || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hsl = (h: number, s: number, l: number) => `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`

/** A jagged ridge line across the frame. */
function ridge(r: () => number, base: number, amp: number, step: number) {
  let d = `M0 120 L0 ${base}`
  for (let x = 0; x <= 160; x += step) {
    const y = base - r() * amp
    d += ` L${x} ${y.toFixed(1)}`
  }
  return `${d} L160 ${base} L160 120 Z`
}

/** A smooth rolling hill line. */
function hill(r: () => number, base: number, amp: number) {
  const y1 = base - r() * amp
  const y2 = base - r() * amp
  const y3 = base - r() * amp
  return `M0 120 L0 ${y1.toFixed(1)} Q40 ${(y2 - amp * 0.6).toFixed(1)} 80 ${y2.toFixed(1)} T160 ${y3.toFixed(1)} L160 120 Z`
}

type Scene = (r: () => number, id: string) => ReactNode

const scenes: Scene[] = [
  // Mountains at golden hour.
  (r, id) => {
    const h = 190 + r() * 40
    return (
      <>
        <defs>
          <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hsl(h, 55, 58)} />
            <stop offset="1" stopColor={hsl(h - 170, 85, 82)} />
          </linearGradient>
        </defs>
        <rect width="160" height="120" fill={`url(#${id}sky)`} />
        <circle cx={30 + r() * 100} cy={34 + r() * 16} r={9 + r() * 5} fill="#fff4d6" opacity="0.9" />
        <path d={ridge(r, 70, 30, 16)} fill={hsl(h, 22, 62)} />
        <path d={ridge(r, 86, 26, 12)} fill={hsl(h + 10, 26, 42)} />
        <path d={ridge(r, 104, 20, 10)} fill={hsl(h + 20, 30, 24)} />
      </>
    )
  },
  // Sunset over the sea.
  (r, id) => {
    const h = 10 + r() * 30
    const sx = 40 + r() * 80
    return (
      <>
        <defs>
          <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hsl(h + 250, 45, 38)} />
            <stop offset="0.55" stopColor={hsl(h + 330, 70, 66)} />
            <stop offset="1" stopColor={hsl(h + 20, 95, 72)} />
          </linearGradient>
          <linearGradient id={`${id}sea`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hsl(h + 230, 40, 42)} />
            <stop offset="1" stopColor={hsl(h + 225, 50, 18)} />
          </linearGradient>
        </defs>
        <rect width="160" height="120" fill={`url(#${id}sky)`} />
        <circle cx={sx} cy="74" r="26" fill={hsl(h + 30, 100, 80)} opacity="0.25" />
        <circle cx={sx} cy="74" r="15" fill={hsl(h + 30, 100, 86)} />
        <rect y="74" width="160" height="46" fill={`url(#${id}sea)`} />
        <ellipse cx={sx} cy="78" rx="30" ry="3" fill={hsl(h + 30, 100, 80)} opacity="0.3" />
        {Array.from({ length: 8 }, (_, i) => {
          const w = 20 - i * 2 + r() * 6
          return (
            <rect
              key={i}
              x={sx - w / 2 + (r() - 0.5) * 6}
              y={77.5 + i * 4.6}
              width={w}
              height="0.9"
              rx="0.45"
              fill={hsl(h + 35, 100, 85)}
              opacity={0.55 - i * 0.06}
            />
          )
        })}
      </>
    )
  },
  // Green hills with a few trees.
  (r, id) => {
    const h = 95 + r() * 40
    return (
      <>
        <defs>
          <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hsl(205, 70, 62)} />
            <stop offset="1" stopColor={hsl(195, 70, 88)} />
          </linearGradient>
        </defs>
        <rect width="160" height="120" fill={`url(#${id}sky)`} />
        <ellipse cx={30 + r() * 100} cy={22 + r() * 10} rx="18" ry="5" fill="#fff" opacity="0.7" />
        <ellipse cx={20 + r() * 110} cy={30 + r() * 10} rx="12" ry="3.5" fill="#fff" opacity="0.55" />
        <path d={hill(r, 78, 14)} fill={hsl(h, 38, 58)} />
        <path d={hill(r, 94, 12)} fill={hsl(h + 5, 45, 42)} />
        {Array.from({ length: 5 }, (_, i) => {
          const x = 10 + r() * 140
          const y = 82 + r() * 10
          const s = 5 + r() * 4
          return <path key={i} d={`M${x} ${y - s * 2.2} L${x + s} ${y} L${x - s} ${y} Z`} fill={hsl(h + 20, 45, 22)} />
        })}
        <path d={hill(r, 112, 8)} fill={hsl(h + 10, 50, 30)} />
      </>
    )
  },
  // Night sky over a ridge.
  (r, id) => {
    const h = 225 + r() * 30
    return (
      <>
        <defs>
          <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hsl(h, 55, 10)} />
            <stop offset="1" stopColor={hsl(h + 30, 45, 32)} />
          </linearGradient>
        </defs>
        <rect width="160" height="120" fill={`url(#${id}sky)`} />
        {Array.from({ length: 34 }, (_, i) => (
          <circle key={i} cx={r() * 160} cy={r() * 80} r={0.3 + r() * 0.7} fill="#fff" opacity={0.4 + r() * 0.6} />
        ))}
        <circle cx={110 + r() * 30} cy={26} r="9" fill="#fdf6e3" />
        <circle cx={114 + r() * 30} cy={23} r="8" fill={hsl(h, 55, 12)} opacity="0.92" />
        <path d={ridge(r, 100, 22, 14)} fill={hsl(h, 40, 7)} />
      </>
    )
  },
  // Beach with turquoise water.
  (r, id) => {
    const shore = 78 + r() * 10
    return (
      <>
        <defs>
          <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5fb6f0" />
            <stop offset="1" stopColor="#c9ecff" />
          </linearGradient>
          <linearGradient id={`${id}sea`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f8fb8" />
            <stop offset="1" stopColor="#4fd6d0" />
          </linearGradient>
        </defs>
        <rect width="160" height="120" fill={`url(#${id}sky)`} />
        <rect y="52" width="160" height="40" fill={`url(#${id}sea)`} />
        <path d={`M0 ${shore} Q50 ${shore - 10} 90 ${shore - 2} T160 ${shore - 6} L160 120 L0 120 Z`} fill="#ffffff" opacity="0.7" />
        <path d={`M0 ${shore + 3} Q50 ${shore - 7} 90 ${shore + 1} T160 ${shore - 3} L160 120 L0 120 Z`} fill="#f1dcb2" />
        <circle cx={20 + r() * 120} cy={shore + 14 + r() * 10} r="4" fill="#ff6b6b" />
        <path
          d={`M${20 + r() * 120} ${shore + 18} m-10 0 a10 6 0 0 1 20 0 z`}
          fill={['#ffcf4a', '#ff7ab6', '#6be0a4'][Math.floor(r() * 3)]}
        />
      </>
    )
  },
  // City lights at dusk.
  (r, id) => {
    const h = 260 + r() * 40
    let x = 0
    const buildings: ReactNode[] = []
    let i = 0
    while (x < 160) {
      const w = 10 + r() * 16
      const top = 40 + r() * 46
      buildings.push(<rect key={`b${i}`} x={x} y={top} width={w - 1.5} height={120 - top} fill={hsl(h, 30, 12 + r() * 8)} />)
      for (let wy = top + 5; wy < 116; wy += 6) {
        for (let wx = x + 2.5; wx < x + w - 4; wx += 4.5) {
          if (r() > 0.55) buildings.push(<rect key={`w${i}-${wx}-${wy}`} x={wx} y={wy} width="2" height="2.6" fill="#ffd98a" opacity={0.5 + r() * 0.5} />)
        }
      }
      x += w
      i++
    }
    return (
      <>
        <defs>
          <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hsl(h, 50, 22)} />
            <stop offset="0.7" stopColor={hsl(h + 60, 65, 55)} />
            <stop offset="1" stopColor={hsl(h + 90, 85, 70)} />
          </linearGradient>
        </defs>
        <rect width="160" height="120" fill={`url(#${id}sky)`} />
        {buildings}
      </>
    )
  },
]

export const photoIsPortrait = (seed: number) => seed % 5 === 0

export const PhotoArt = memo(function PhotoArt({
  seed,
  className,
  vintage,
}: {
  seed: number
  className?: string
  /** A faded, warm look for photos from old cameras. */
  vintage?: boolean
}) {
  const id = `ph${useId().replace(/:/g, '')}`
  const r = rng(seed)
  const scene = scenes[seed % scenes.length]
  return (
    <svg
      viewBox="0 0 160 120"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={vintage ? { filter: 'sepia(0.4) saturate(0.8) contrast(0.92) brightness(1.04)' } : undefined}
      aria-hidden
    >
      {scene(r, id)}
      {/* A soft vignette so every scene feels like a photo. */}
      <defs>
        <radialGradient id={`${id}v`} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </radialGradient>
      </defs>
      <rect width="160" height="120" fill={`url(#${id}v)`} />
    </svg>
  )
})
