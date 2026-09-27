/** The Plumos mark: a plum with a leaf, drawn as a single line. */
export function Logo({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-label="Plumos">
      <path
        d="M31.5 21.5c-9.5-3-19 3.5-19 15 0 11 8.5 19.5 19.5 19.5S51.5 47.5 51.5 36.5c0-11.5-9.5-18-19-15"
        stroke="currentColor"
        strokeWidth="4.6"
        strokeLinecap="round"
      />
      <path d="M32 22c.2-5 2-9 5.5-12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M37 13.5c3.2-4.6 9.5-6.6 15-5-1.8 5.8-8.3 8.4-15 5z" fill="currentColor" />
    </svg>
  )
}
