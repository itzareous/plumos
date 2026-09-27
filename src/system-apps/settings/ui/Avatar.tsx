import { cn } from '@/lib/cn'

/** A person's initial on their colour. The owner's colour follows the wallpaper accent. */
export function Avatar({
  name,
  color = 'var(--plumos-accent)',
  size = 36,
  className,
}: {
  name: string
  color?: string
  size?: number
  className?: string
}) {
  const initial = name.trim().slice(0, 1).toUpperCase() || '?'
  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white select-none',
        'shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_2px_8px_-2px_rgb(0_0_0/0.4)]',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.44),
        background: `linear-gradient(180deg, color-mix(in oklab, ${color} 78%, white), ${color} 55%, color-mix(in oklab, ${color} 82%, black))`,
      }}
    >
      {initial}
    </span>
  )
}
