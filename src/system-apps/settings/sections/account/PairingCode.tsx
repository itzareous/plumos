import { useMemo } from 'react'
import { Logo } from '@/components/icons/Logo'

const N = 29

function rng(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Squares kept clear for the corner markers and the mark in the middle. */
function reserved(x: number, y: number) {
  const inCorner = (cx: number, cy: number) => x >= cx - 1 && x <= cx + 7 && y >= cy - 1 && y <= cy + 7
  if (inCorner(0, 0) || inCorner(N - 7, 0) || inCorner(0, N - 7)) return true
  const c = (N - 1) / 2
  return Math.abs(x - c) <= 3 && Math.abs(y - c) <= 3
}

function Marker({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={2} fill="none" stroke="currentColor" strokeWidth={1} />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={1} fill="currentColor" />
    </g>
  )
}

/**
 * A pairing code for authenticator apps, drawn from the secret. Round dots,
 * soft corner markers and the Plumos mark in the middle.
 */
export function PairingCode({ secret, size = 184 }: { secret: string; size?: number }) {
  const dots = useMemo(() => {
    const r = rng(secret)
    const out: [number, number][] = []
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!reserved(x, y) && r() < 0.48) out.push([x, y])
    return out
  }, [secret])

  return (
    <div className="relative rounded-[22px] bg-white p-3.5 text-[#15131f] shadow-[0_10px_30px_-10px_rgb(0_0_0/0.6)]" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${N} ${N}`} className="size-full" role="img" aria-label="Pairing code for your authenticator app">
        {dots.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x + 0.5} cy={y + 0.5} r={0.42} fill="currentColor" />
        ))}
        <Marker x={0} y={0} />
        <Marker x={N - 7} y={0} />
        <Marker x={0} y={N - 7} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-9 items-center justify-center rounded-[11px] bg-accent text-white shadow-[0_0_0_3px_white]">
          <Logo size={24} />
        </span>
      </span>
    </div>
  )
}
