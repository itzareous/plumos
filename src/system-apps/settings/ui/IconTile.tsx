import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

/** A rounded, coloured square holding a glyph, like the icons in the Settings sidebar. */
export function IconTile({ icon: Icon, color, size = 28, className }: { icon: LucideIcon; color: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-flex shrink-0 items-center justify-center text-white', className)}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: `linear-gradient(180deg, color-mix(in oklab, ${color} 72%, white), ${color})`,
        boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.28), inset 0 0 0 0.5px rgb(255 255 255 / 0.12), 0 1px 3px rgb(0 0 0 / 0.3)',
      }}
    >
      <Icon size={Math.round(size * 0.58)} strokeWidth={2.1} />
    </span>
  )
}
