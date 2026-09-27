import type { ReactNode, RefObject } from 'react'
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  FileUp,
  FolderPlus,
  FolderUp,
  LayoutGrid,
  List,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Input, Segmented } from '@/components/ui/controls'
import type { MenuEntry } from '@/components/ui/ContextMenu'
import type { SortKey, SortPrefs, ViewMode } from '@/stores/files'
import { cn } from '@/lib/cn'
import type { Loc } from '../lib/tree'
import type { BindDrop } from './Sidebar'

export interface Crumb {
  loc: Loc
  label: string
}

const SORT_LABELS: Record<SortKey, string> = { name: 'Name', modified: 'Date Modified', size: 'Size', kind: 'Kind' }

interface ToolbarProps {
  title: string
  crumbs: Crumb[]
  summary: string
  nav: { canBack: boolean; canForward: boolean; back: () => void; forward: () => void }
  onCrumb: (loc: Loc) => void
  bindDrop: BindDrop
  dropTarget: Loc | null
  query: string
  onQuery: (q: string) => void
  searchRef: RefObject<HTMLInputElement | null>
  searchPlaceholder: string
  view: ViewMode
  onView: (v: ViewMode) => void
  sort: SortPrefs
  onSort: (s: SortPrefs) => void
  showSort: boolean
  canWrite: boolean
  onNewFolder: () => void
  onUploadFiles: () => void
  onUploadFolder: () => void
  trashMode: boolean
  trashCount: number
  onEmptyTrash: () => void
  openMenu: (x: number, y: number, items: MenuEntry[]) => void
  children?: ReactNode
}

const blank = <span className="size-4" />

export function Toolbar(p: ToolbarProps) {
  const sortItems = (): MenuEntry[] => [
    ...(Object.keys(SORT_LABELS) as SortKey[]).map((key) => ({
      label: SORT_LABELS[key],
      icon: p.sort.key === key ? <Check size={15} /> : blank,
      onSelect: () => p.onSort({ key, dir: key === 'modified' || key === 'size' ? 'desc' : 'asc' }),
    })),
    'separator' as const,
    { label: 'Ascending', icon: p.sort.dir === 'asc' ? <Check size={15} /> : blank, onSelect: () => p.onSort({ ...p.sort, dir: 'asc' }) },
    { label: 'Descending', icon: p.sort.dir === 'desc' ? <Check size={15} /> : blank, onSelect: () => p.onSort({ ...p.sort, dir: 'desc' }) },
  ]

  const uploadItems = (): MenuEntry[] => [
    { label: 'Upload files…', icon: <FileUp size={15} />, onSelect: p.onUploadFiles },
    { label: 'Upload a folder…', icon: <FolderUp size={15} />, onSelect: p.onUploadFolder },
  ]

  const below = (e: React.MouseEvent<HTMLElement>, items: MenuEntry[]) => {
    const r = e.currentTarget.getBoundingClientRect()
    p.openMenu(r.left, r.bottom + 6, items)
  }

  const phoneMore = (): MenuEntry[] => {
    const items: MenuEntry[] = []
    if (p.trashMode) items.push({ label: 'Empty Trash', icon: <Trash2 size={15} />, danger: true, disabled: !p.trashCount, onSelect: p.onEmptyTrash })
    if (p.canWrite) {
      items.push({ label: 'New folder', icon: <FolderPlus size={15} />, onSelect: p.onNewFolder }, ...uploadItems())
    }
    if (p.showSort) {
      if (items.length) items.push('separator')
      items.push(...sortItems())
    }
    return items
  }

  const viewToggle = (
    <Segmented
      value={p.view}
      onChange={p.onView}
      options={[
        { value: 'grid', label: <LayoutGrid size={15} aria-label="Icons" /> },
        { value: 'list', label: <List size={15} aria-label="List" /> },
      ]}
      className="[&_button]:px-2.5"
    />
  )

  return (
    <header className="shrink-0 px-4 pt-3.5 sm:px-6">
      <div className="flex h-10 items-center gap-1.5 pr-14 md:gap-2 md:pr-16">
        <div className="-ml-1.5 flex shrink-0 items-center">
          <IconButton label="Back" onClick={p.nav.back} disabled={!p.nav.canBack} className="disabled:opacity-30">
            <ChevronLeft size={20} />
          </IconButton>
          <IconButton label="Forward" onClick={p.nav.forward} disabled={!p.nav.canForward} className="disabled:opacity-30">
            <ChevronRight size={20} />
          </IconButton>
        </div>
        <h2 className="min-w-0 flex-1 truncate text-[21px] font-bold tracking-tight sm:text-[24px]">{p.title}</h2>
        <div className="hidden items-center gap-1.5 md:flex">
          {p.canWrite && (
            <>
              <IconButton label="New folder (⇧⌘N)" onClick={p.onNewFolder}>
                <FolderPlus size={18} />
              </IconButton>
              <Button variant="primary" size="sm" icon={<Upload size={15} />} onClick={(e) => below(e, uploadItems())} className="ml-1">
                Upload
              </Button>
            </>
          )}
          {p.trashMode && (
            <Button variant="danger" size="sm" icon={<Trash2 size={15} />} disabled={!p.trashCount} onClick={p.onEmptyTrash} className="ml-1">
              Empty Trash
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2 md:hidden">{p.children}</div>
      {p.crumbs.length > 1 && (
        <Breadcrumbs
          crumbs={p.crumbs}
          onCrumb={p.onCrumb}
          bindDrop={p.bindDrop}
          dropTarget={p.dropTarget}
          max={3}
          className="mt-2 -ml-1.5 flex lg:hidden"
        />
      )}

      <div className="mt-2.5 flex items-center gap-2 pb-3 md:mt-2 md:gap-4">
        <Breadcrumbs
          crumbs={p.crumbs}
          onCrumb={p.onCrumb}
          bindDrop={p.bindDrop}
          dropTarget={p.dropTarget}
          className="hidden min-w-0 flex-1 lg:flex"
        />
        <span className="hidden shrink-0 text-[12.5px] text-white/40 tabular-nums xl:inline">{p.summary}</span>
        <div className="relative min-w-0 flex-1 lg:w-56 lg:flex-none xl:w-60">
          <Input
            ref={p.searchRef}
            icon={<Search size={15} />}
            value={p.query}
            onChange={(e) => p.onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                if (p.query) p.onQuery('')
                else e.currentTarget.blur()
              }
            }}
            placeholder={p.searchPlaceholder}
            aria-label="Search"
            className="[&_input]:h-9 [&_input]:rounded-full [&_input]:pr-9"
          />
          {p.query && (
            <button
              type="button"
              onClick={() => {
                p.onQuery('')
                p.searchRef.current?.focus()
              }}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white/80 hover:bg-white/30"
            >
              <X size={12} strokeWidth={2.6} />
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {viewToggle}
          {p.showSort && (
            <IconButton label="Sort by" onClick={(e) => below(e, sortItems())} className="max-md:hidden">
              <ArrowUpDown size={17} />
            </IconButton>
          )}
          <IconButton label="More" onClick={(e) => below(e, phoneMore())} className="md:hidden">
            <Ellipsis size={19} />
          </IconButton>
        </div>
      </div>
    </header>
  )
}

function Breadcrumbs({
  crumbs,
  onCrumb,
  bindDrop,
  dropTarget,
  max = 4,
  className,
}: {
  crumbs: Crumb[]
  onCrumb: (loc: Loc) => void
  bindDrop: BindDrop
  dropTarget: Loc | null
  /** Longer paths keep the first and the last two, with the middle collapsed. */
  max?: number
  className?: string
}) {
  const shown = crumbs.length > max ? [crumbs[0], null, ...crumbs.slice(-2)] : crumbs
  return (
    <nav aria-label="Path" className={cn('min-w-0 items-center', className)}>
      <ol className="flex min-w-0 items-center gap-0.5 text-[13px]">
        {shown.map((c, i) => (
          <li key={c?.loc ?? 'more'} className={cn('flex min-w-0 items-center gap-0.5', i === shown.length - 1 ? 'shrink' : 'shrink-[2]')}>
            {i > 0 && <ChevronRight size={13} className="shrink-0 text-white/25" />}
            {c ? (
              <button
                type="button"
                onClick={() => onCrumb(c.loc)}
                aria-current={i === shown.length - 1 ? 'location' : undefined}
                {...bindDrop(c.loc)}
                className={cn(
                  'min-w-0 truncate rounded-md px-1.5 py-0.5 transition outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                  i === shown.length - 1 ? 'font-medium text-white/85' : 'text-white/50 hover:bg-white/[0.07] hover:text-white',
                  dropTarget === c.loc && 'bg-accent-soft text-white ring-1 ring-accent',
                )}
              >
                {c.label}
              </button>
            ) : (
              <span className="px-1 text-white/35">…</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
