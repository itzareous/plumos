import type { MouseEvent, ReactNode } from 'react'
import { motion } from 'motion/react'
import { MoreHorizontal } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import { Badge } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import { Avatar } from '../../ui/Avatar'

export function PersonRow({
  name,
  color,
  you = false,
  badge,
  badgeTone = 'plain',
  onMenu,
}: {
  name: string
  color?: string
  you?: boolean
  badge: ReactNode
  badgeTone?: 'accent' | 'plain'
  /** Opens the row's actions at the given point. */
  onMenu?: (x: number, y: number) => void
}) {
  const openMenu = (e: MouseEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const box = e.currentTarget.getBoundingClientRect()
    // From the ⋯ button, drop the menu under it; from a right-click, at the pointer.
    if (e.type === 'click') onMenu?.(box.right - 200, box.bottom + 6)
    else onMenu?.(e.clientX, e.clientY)
  }
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 38 }}
      onContextMenu={onMenu ? openMenu : undefined}
      className="overflow-hidden [&+&]:border-t [&+&]:border-white/[0.06]"
    >
      <div className="flex items-center gap-3.5 px-4 py-3">
        <Avatar name={name} color={color} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {name}
            {you && <span className="text-white/45"> (you)</span>}
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-white/50">Private files & photos + Shared space</p>
        </div>
        <Badge className={cn(badgeTone === 'accent' && 'bg-accent-soft text-accent')}>{badge}</Badge>
        {onMenu ? (
          <IconButton label={`Options for ${name}`} onClick={openMenu} className="-mr-1.5 size-8">
            <MoreHorizontal size={18} />
          </IconButton>
        ) : (
          <span className="-mr-1.5 size-8 shrink-0" />
        )}
      </div>
    </motion.div>
  )
}
