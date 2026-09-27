/**
 * Original marks for the guest systems. None of these are (or imitate) a real
 * operating system's logo; they only hint at each family's colours.
 */

/** Three overlapping petals: the desktop guest's start mark. */
export function PetalMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="vm-petal-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fe3ff" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="vm-petal-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="vm-petal-c" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <g style={{ mixBlendMode: 'screen' }} opacity="0.95">
        <ellipse cx="24" cy="15" rx="8.5" ry="12" fill="url(#vm-petal-a)" />
        <ellipse cx="24" cy="15" rx="8.5" ry="12" fill="url(#vm-petal-b)" transform="rotate(120 24 26)" />
        <ellipse cx="24" cy="15" rx="8.5" ry="12" fill="url(#vm-petal-c)" transform="rotate(240 24 26)" />
      </g>
      <circle cx="24" cy="26" r="3.2" fill="#fff" opacity="0.9" />
    </svg>
  )
}

/** A sprout in a pebble: the phone guest's boot mark. */
export function SproutMark({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="vm-sprout" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a7f3d0" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path d="M32 54V32" stroke="url(#vm-sprout)" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 34C31 22 21 15 10 16c0 11 9 19 22 18z" fill="url(#vm-sprout)" />
      <path d="M32 30c1-10 9-16 20-15 0 9-8 16-20 15z" fill="#34d399" opacity="0.85" />
      <ellipse cx="32" cy="55" rx="12" ry="3" fill="#10b981" opacity="0.35" />
    </svg>
  )
}

/** A peak under a rising sun: the Linux-style guest's mark. */
export function PeakMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id="vm-peak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <circle cx="31" cy="16" r="7" fill="url(#vm-peak)" />
      <path d="M4 40 18 18l8 12 5-6 13 16z" fill="#fff" opacity="0.92" />
      <path d="M18 18l-4 6.3 4 2.7 3-2.2z" fill="#c4b5fd" />
    </svg>
  )
}

/** Eight dots chasing each other around a circle. */
export function DotSpinner({ size = 36, color = 'white' }: { size?: number; color?: string }) {
  const dots = Array.from({ length: 8 }, (_, i) => i)
  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden>
      {dots.map((i) => (
        <span
          key={i}
          className="absolute top-0 left-1/2 h-1/2 w-0 origin-bottom"
          style={{ transform: `rotate(${i * 45}deg)` }}
        >
          <span
            className="absolute top-0 block rounded-full"
            style={{
              width: size * 0.14,
              height: size * 0.14,
              left: -size * 0.07,
              background: color,
              animation: `vm-dot 1s linear ${(i - 8) * 0.125}s infinite`,
            }}
          />
        </span>
      ))}
      <style>{'@keyframes vm-dot { 0% { opacity: 1 } 100% { opacity: 0.12 } }'}</style>
    </div>
  )
}
