import { useId, useMemo } from 'react'
import { hashString, mulberry32 } from '@/lib/photos'

/** A small, stylised street map for a place, drawn from its name. Not a real map, just a sense of place. */
export function MiniMap({ place, className }: { place: string; className?: string }) {
  const id = useId().replace(/:/g, '')
  const shapes = useMemo(() => {
    const r = mulberry32(hashString(place))
    const tilt = (r() - 0.5) * 18
    const coast = r() < 0.55
    const side = r() < 0.5 ? -1 : 1
    const coastPath = (() => {
      const pts: string[] = []
      const base = side < 0 ? 40 + r() * 30 : 200 - r() * 30
      for (let i = 0; i <= 8; i++) pts.push(`${base + Math.sin(i * 0.9 + r() * 2) * 14},${i * 16 - 4}`)
      const edge = side < 0 ? -10 : 250
      return `M${edge},-4 L${pts.join(' L')} L${edge},132 Z`
    })()
    const major = Array.from({ length: 3 }, () => ({ x: 30 + r() * 180, y: 15 + r() * 100 }))
    const minorX = Array.from({ length: 9 }, () => r() * 240)
    const minorY = Array.from({ length: 6 }, () => r() * 128)
    const parks = Array.from({ length: 2 }, () => ({ x: r() * 200, y: r() * 90, w: 24 + r() * 30, h: 18 + r() * 22 }))
    return { tilt, coast, coastPath, major, minorX, minorY, parks }
  }, [place])

  return (
    <svg viewBox="0 0 240 128" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`${id}-pulse`}>
          <stop offset="0" stopColor="var(--plumos-accent)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--plumos-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="128" fill="#23252d" />
      <g transform={`rotate(${shapes.tilt} 120 64)`}>
        {shapes.parks.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx="5" fill="#27402f" />
        ))}
        {shapes.minorX.map((x, i) => (
          <line key={`x${i}`} x1={x} y1={-40} x2={x} y2={170} stroke="#34373f" strokeWidth="2" />
        ))}
        {shapes.minorY.map((y, i) => (
          <line key={`y${i}`} x1={-40} y1={y} x2={280} y2={y} stroke="#34373f" strokeWidth="2" />
        ))}
        {shapes.major.map((m, i) => (
          <g key={`m${i}`} stroke="#4a4e59" strokeWidth="4" strokeLinecap="round">
            <line x1={m.x} y1={-40} x2={m.x + 20} y2={170} />
            <line x1={-40} y1={m.y} x2={280} y2={m.y - 10} />
          </g>
        ))}
      </g>
      {shapes.coast && <path d={shapes.coastPath} fill="#1d3448" />}
      <circle cx="120" cy="64" r="26" fill={`url(#${id}-pulse)`} />
      <circle cx="120" cy="64" r="8" fill="white" />
      <circle cx="120" cy="64" r="5.5" fill="var(--plumos-accent)" />
    </svg>
  )
}
