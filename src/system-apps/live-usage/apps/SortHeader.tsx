import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/cn'

export type SortKey = 'name' | 'cpu' | 'memory'
export interface SortState {
  key: SortKey
  /** 1 ascending, -1 descending. */
  dir: 1 | -1
}

/** A column header that sorts the table; click again to flip the order. */
export function SortHeader({
  label,
  column,
  sort,
  onSort,
  align = 'left',
}: {
  label: string
  column: SortKey
  sort: SortState
  onSort: (key: SortKey) => void
  align?: 'left' | 'right'
}) {
  const active = sort.key === column
  const Icon = sort.dir === 1 ? ChevronUp : ChevronDown
  return (
    <div
      role="columnheader"
      aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
      className={cn('flex', align === 'right' && 'justify-end')}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          '-mx-1.5 inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[12px] font-semibold tracking-wide uppercase transition outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          active ? 'text-white/85' : 'text-white/45 hover:text-white/75',
        )}
      >
        {align === 'right' && <Icon size={13} strokeWidth={2.5} className={cn('transition-opacity', !active && 'opacity-0')} />}
        {label}
        {align === 'left' && <Icon size={13} strokeWidth={2.5} className={cn('transition-opacity', !active && 'opacity-0')} />}
      </button>
    </div>
  )
}
