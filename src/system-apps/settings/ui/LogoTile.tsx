import { Logo } from '@/components/icons/Logo'

/** The Plumos mark on an accent tile. */
export function LogoTile({ size = 56 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center text-white shadow-[0_10px_30px_-10px_var(--plumos-accent)]"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        background: 'linear-gradient(160deg, color-mix(in oklab, var(--plumos-accent) 70%, white), var(--plumos-accent) 45%, color-mix(in oklab, var(--plumos-accent) 55%, black))',
      }}
    >
      <Logo size={size * 0.66} />
    </span>
  )
}
