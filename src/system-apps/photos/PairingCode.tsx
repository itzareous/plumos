import { useMemo } from 'react'
import { hashString, mulberry32 } from '@/lib/photos'
import { Logo } from '@/components/icons/Logo'

const N = 27

/**
 * A pairing code drawn from a short secret: rounded dots, three corner
 * markers and the Plumos mark in the middle. It's for show in the demo; the
 * mobile app would pair using the text code underneath it.
 */
export function PairingCode({ value, size = 180 }: { value: string; size?: number }) {
  const dots = useMemo(() => {
    const r = mulberry32(hashString(value))
    const out: [number, number][] = []
    const inMarker = (x: number, y: number) =>
      (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
    const inCenter = (x: number, y: number) => Math.abs(x - (N - 1) / 2) < 4 && Math.abs(y - (N - 1) / 2) < 4
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (inMarker(x, y) || inCenter(x, y)) continue
        if (r() < 0.47) out.push([x, y])
      }
    }
    return out
  }, [value])

  const marker = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={1.9} fill="none" stroke="#111318" strokeWidth={1} />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.9} fill="#111318" />
    </g>
  )

  return (
    <svg width={size} height={size} viewBox={`-1 -1 ${N + 2} ${N + 2}`} role="img" aria-label={`Pairing code ${value}`}>
      <rect x={-1} y={-1} width={N + 2} height={N + 2} rx={3} fill="#fff" />
      {dots.map(([x, y]) => (
        <circle key={`${x}.${y}`} cx={x + 0.5} cy={y + 0.5} r={0.42} fill="#111318" />
      ))}
      {marker(0, 0)}
      {marker(N - 7, 0)}
      {marker(0, N - 7)}
      <rect x={(N - 7) / 2} y={(N - 7) / 2} width={7} height={7} rx={2.2} fill="var(--plumos-accent)" />
      <g transform={`translate(${(N - 5.4) / 2} ${(N - 5.4) / 2})`} color="#fff">
        <Logo size={5.4} />
      </g>
    </svg>
  )
}

/** "PLM-4K7Q-92XD": the human-readable half of the pairing code. */
export function pairingText(seed: string) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const r = mulberry32(hashString(`pair-${seed}`))
  const chunk = () => Array.from({ length: 4 }, () => alphabet[Math.floor(r() * alphabet.length)]).join('')
  return `PLM-${chunk()}-${chunk()}`
}
