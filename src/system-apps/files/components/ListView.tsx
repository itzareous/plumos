import { memo } from 'react'
import { ChevronDown, ChevronUp, Star } from 'lucide-react'
import type { FileNode, SortKey, SortPrefs } from '@/stores/files'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import { kindLabel } from '../lib/kinds'
import { formatFileDate, type FolderStats } from '../lib/tree'
import { RenameField, type BindItem, type ItemBinding, type RenameApi } from './items'
import { Thumb } from './Thumb'

interface ListViewProps {
  items: FileNode[]
  bind: BindItem
  rename: RenameApi
  names: (node: FileNode) => string
  label: string
  stats: Map<string, FolderStats>
  sort: SortPrefs
  /** Null when this view has a fixed order (Recents, Trash). */
  onSort: ((s: SortPrefs) => void) | null
  dateLabel: string
  dateOf: (node: FileNode) => number
}

const COLS = 'grid-cols-[minmax(0,1fr)_76px] sm:grid-cols-[minmax(0,1fr)_176px_84px] lg:grid-cols-[minmax(0,1fr)_196px_92px_156px]'

export function ListView({ items, bind, rename, names, label, stats, sort, onSort, dateLabel, dateOf }: ListViewProps) {
  const header = (key: SortKey, text: string, className?: string) => {
    const active = sort.key === key && onSort
    return (
      <button
        type="button"
        disabled={!onSort}
        onClick={() => onSort?.({ key, dir: sort.key === key ? (sort.dir === 'asc' ? 'desc' : 'asc') : key === 'name' || key === 'kind' ? 'asc' : 'desc' })}
        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
        className={cn(
          'flex items-center gap-1 rounded-md py-1 text-left text-[12px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          active ? 'text-white/85' : 'text-white/45',
          onSort && 'hover:text-white/85',
          className,
        )}
      >
        {text}
        {active && (sort.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
      </button>
    )
  }

  return (
    <div role="listbox" aria-multiselectable="true" aria-label={label} className="min-w-0">
      <div
        className={cn(
          'sticky top-0 z-10 -mx-2 mb-1 grid items-center gap-3 border-b border-white/[0.06] bg-[rgb(24_24_32/0.82)] px-5 py-1.5 backdrop-blur-xl sm:-mx-3 sm:px-6',
          COLS,
        )}
      >
        {header('name', 'Name')}
        {header('modified', dateLabel, 'hidden sm:flex')}
        {header('size', 'Size', 'justify-end sm:justify-start')}
        {header('kind', 'Kind', 'hidden lg:flex')}
      </div>
      {items.map((node) => (
        <ListRow
          key={node.id}
          node={node}
          name={names(node)}
          binding={bind(node)}
          rename={rename}
          size={node.kind === 'folder' ? (stats.get(node.id)?.bytes ?? 0) : node.size}
          date={dateOf(node)}
        />
      ))}
    </div>
  )
}

const ListRow = memo(
  function ListRow({
    node,
    name,
    binding,
    rename,
    size,
    date,
  }: {
    node: FileNode
    name: string
    binding: ItemBinding
    rename: RenameApi
    size: number
    date: number
  }) {
    const { selected, focused, renaming, dropping, hint, handlers } = binding
    return (
      <div
        role="option"
        aria-selected={selected}
        aria-label={name}
        data-file-id={node.id}
        tabIndex={focused ? 0 : -1}
        className={cn(
          'grid h-10 cursor-default [-webkit-touch-callout:none] items-center gap-3 rounded-[10px] px-3 text-[13px] outline-none even:bg-white/[0.022] focus-visible:ring-2 focus-visible:ring-white/40',
          COLS,
          selected ? 'bg-accent-soft! text-white' : 'hover:bg-white/[0.045]',
          dropping && 'bg-accent-soft! ring-2 ring-accent ring-inset',
        )}
        {...handlers}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center">
            <Thumb node={node} size={26} />
          </span>
          {renaming ? (
            <RenameField node={node} api={rename} className="min-w-0 flex-1 text-[13px]" />
          ) : (
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-medium text-white/90">{name}</span>
              {hint && <span className="hidden truncate text-[12px] text-white/35 sm:inline">{hint}</span>}
            </span>
          )}
          {node.favorite && !renaming && <Star size={12} className="shrink-0 fill-amber-300 text-amber-300" aria-label="Favorite" />}
        </div>
        <span className="hidden truncate text-white/50 tabular-nums sm:block">{formatFileDate(date)}</span>
        <span className="truncate text-right text-white/50 tabular-nums sm:text-left">
          {node.kind === 'folder' && !size ? '—' : formatBytes(size)}
        </span>
        <span className="hidden truncate text-white/50 lg:block">{kindLabel(node.kind, node.name)}</span>
      </div>
    )
  },
  (a, b) =>
    a.node === b.node &&
    a.name === b.name &&
    a.size === b.size &&
    a.date === b.date &&
    a.rename === b.rename &&
    a.binding.selected === b.binding.selected &&
    a.binding.focused === b.binding.focused &&
    a.binding.renaming === b.binding.renaming &&
    a.binding.dropping === b.binding.dropping &&
    a.binding.hint === b.binding.hint &&
    a.binding.handlers === b.binding.handlers,
)
