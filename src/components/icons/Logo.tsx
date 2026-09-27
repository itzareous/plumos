/** The Plumos mark: a plum — oval body, its seam line, a stem and a leaf. */
export function Logo({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-label="Plumos">
      <ellipse cx="31" cy="38" rx="18" ry="19.5" stroke="currentColor" strokeWidth="4.4" />
      <path d="M31 19.5c-6.5 5-8.5 13-6 22" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" opacity="0.75" />
      <path d="M31 19c.6-4 2.6-7.4 6-10" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M37.5 12.5c3.5-4.2 9.6-5.6 14.5-3.6-2.4 5.3-8.6 7.4-14.5 3.6z" fill="currentColor" />
    </svg>
  )
}
