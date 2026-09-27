import { memo } from 'react'
import { cn } from '@/lib/cn'
import { HEADER_H, groupAtY, type GridLayout, type Group } from './layout'
import { plural } from './format'

interface HeaderProps {
  group: Group
  selecting: boolean
  allSelected: boolean
  onSelectGroup: (group: Group, select: boolean) => void
}

function HeaderContent({ group, selecting, allSelected, onSelectGroup }: HeaderProps) {
  return (
    <div className="flex h-full items-end justify-between gap-3 pb-2.5">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <h3 className="shrink-0 text-[17px] font-semibold tracking-tight text-white">{group.label}</h3>
        {group.places && <span className="truncate text-[13px] text-white/45">{group.places}</span>}
      </div>
      {selecting ? (
        <button
          type="button"
          onClick={() => onSelectGroup(group, !allSelected)}
          className="pointer-events-auto shrink-0 rounded-full px-2 py-0.5 text-[13px] font-medium text-accent outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {allSelected ? 'Deselect' : 'Select'}
        </button>
      ) : (
        <span className="hidden shrink-0 text-[12px] text-white/35 tabular-nums sm:block">{plural(group.count, 'item')}</span>
      )}
    </div>
  )
}

/** A month header in the flow of the grid. */
export const GroupHeader = memo(function GroupHeader(props: HeaderProps) {
  return (
    <div className="absolute inset-x-0 top-0" style={{ height: HEADER_H, transform: `translateY(${props.group.start}px)` }}>
      <HeaderContent {...props} />
    </div>
  )
})

/** The header of whichever month is at the top, pinned while its photos scroll past. */
export function StickyHeader({
  layout,
  y,
  selecting,
  isAllSelected,
  onSelectGroup,
  className,
}: {
  layout: GridLayout
  /** Scroll position relative to the grid content. */
  y: number
  selecting: boolean
  isAllSelected: (g: Group) => boolean
  onSelectGroup: (group: Group, select: boolean) => void
  className?: string
}) {
  if (layout.grouping !== 'month' || !layout.groups.length) return null
  const gi = groupAtY(layout, y)
  const group = layout.groups[gi]
  const next = layout.groups[gi + 1]
  const visible = y > group.start + 0.5
  const push = next ? Math.min(0, next.start - y - HEADER_H) : 0
  return (
    <div
      className={cn('pointer-events-none absolute top-0 z-10 transition-opacity duration-150', visible ? 'opacity-100' : 'opacity-0', className)}
      style={{ transform: `translateY(${push}px)` }}
      aria-hidden={!visible}
    >
      <div
        className="absolute -inset-x-8 top-0 -bottom-9"
        style={{
          background: 'linear-gradient(180deg, rgb(20 20 28 / 0.88) 0%, rgb(20 20 28 / 0.7) 55%, rgb(20 20 28 / 0) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          maskImage: 'linear-gradient(180deg, black 50%, rgb(0 0 0 / 0.6) 72%, transparent)',
          WebkitMaskImage: 'linear-gradient(180deg, black 50%, rgb(0 0 0 / 0.6) 72%, transparent)',
        }}
      />
      <div className="relative" style={{ height: HEADER_H }}>
        <HeaderContent group={group} selecting={selecting} allSelected={isAllSelected(group)} onSelectGroup={onSelectGroup} />
      </div>
    </div>
  )
}
