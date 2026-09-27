import { useId } from 'react'

/** The warm gradient folder used throughout Files. */
export function FolderIcon({ size = 24, className, tint }: { size?: number; className?: string; tint?: [string, string] }) {
  const id = useId()
  const [from, to] = tint ?? ['#ffc766', '#ff8a3d']
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h6.4l2.6 2.6h12a2.5 2.5 0 0 1 2.5 2.5V13H3z" fill={to} opacity="0.85" />
      <rect x="3" y="11" width="26" height="16" rx="2.8" fill={`url(#${id}f)`} />
      <rect x="3" y="11" width="26" height="1.6" rx="0.8" fill="#fff" opacity="0.35" />
    </svg>
  )
}
