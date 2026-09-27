import type { ReactNode } from 'react'
import { Glass } from '@/components/ui/Glass'
import { cn } from '@/lib/cn'

export const WIDGET_WIDTH = 268
export const WIDGET_HEIGHT = 148

/** A glass widget tile with its label underneath, like on the home screen. */
export function WidgetFrame({
  label,
  children,
  onClick,
  className,
  padded = true,
}: {
  label: string
  children: ReactNode
  onClick?: () => void
  className?: string
  padded?: boolean
}) {
  return (
    <div className="flex shrink-0 snap-center flex-col items-center gap-2.5">
      <Glass
        as={onClick ? 'button' : 'div'}
        onClick={onClick}
        radius={26}
        refraction={45}
        depth={0.2}
        className={cn(
          'text-left transition-transform duration-300 ease-(--ease-spring)',
          onClick && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
          padded && 'p-4',
          className,
        )}
        style={{ width: WIDGET_WIDTH, height: WIDGET_HEIGHT }}
      >
        {children}
      </Glass>
      <span className="text-on-wallpaper text-[13px] font-semibold text-white/90">{label}</span>
    </div>
  )
}
