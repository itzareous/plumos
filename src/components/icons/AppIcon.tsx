import type { AppIconSpec } from '@/apps/types'
import { cn } from '@/lib/cn'
import { iconArt } from './art'

interface AppIconProps {
  icon: AppIconSpec
  /** Rendered size in px. */
  size?: number
  className?: string
}

/** A squircle app icon, drawn from artwork or a glyph on a gradient. */
export function AppIcon({ icon, size = 64, className }: AppIconProps) {
  const radius = size * 0.24
  return (
    <div
      className={cn('relative shrink-0 overflow-hidden', className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        boxShadow: `0 ${size * 0.06}px ${size * 0.2}px -${size * 0.04}px rgb(0 0 0 / 0.45)`,
      }}
    >
      {icon.type === 'art' ? (
        <svg viewBox="0 0 100 100" width={size} height={size} className="block">
          {iconArt[icon.art]}
        </svg>
      ) : (
        <div className="flex h-full w-full items-center justify-center" style={{ background: icon.background }}>
          <icon.glyph size={size * 0.5} strokeWidth={2} color={icon.color ?? '#fff'} />
        </div>
      )}
      {/* Soft top highlight and hairline edge. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          background: 'linear-gradient(180deg, rgb(255 255 255 / 0.18), transparent 45%)',
          boxShadow: 'inset 0 0 0 0.5px rgb(255 255 255 / 0.25), inset 0 1px 0 rgb(255 255 255 / 0.25)',
        }}
      />
    </div>
  )
}

/**
 * Renders every artwork once, invisibly, at the top of the page so the
 * gradient ids inside them always resolve — even when the first visible copy
 * of an icon is hidden or unmounted.
 */
export function IconDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }} aria-hidden>
      {Object.entries(iconArt).map(([id, art]) => (
        <g key={id}>{art}</g>
      ))}
    </svg>
  )
}
