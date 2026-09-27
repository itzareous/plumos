import type { MouseEvent, RefObject } from 'react'
import { Users } from 'lucide-react'
import { ancestry, type FileNode, type SortPrefs, type ViewMode } from '@/stores/files'
import type { Drive } from '@/stores/storage'
import { useUsers } from '@/stores/users'
import { useFiles } from '@/stores/files'
import { driveFolderId } from '../lib/seed'
import { FAVORITES, RECENTS, TRASH, type FolderStats, type Loc } from '../lib/tree'
import { DriveBanner, Notice } from './Banners'
import { EmptyState } from './EmptyState'
import { GridView } from './GridView'
import type { BindItem, RenameApi } from './items'
import { ListView } from './ListView'

interface BrowserProps {
  scrollRef: RefObject<HTMLDivElement | null>
  loc: Loc
  folder: FileNode | undefined
  items: FileNode[]
  query: string
  view: ViewMode
  sort: SortPrefs
  onSort: ((s: SortPrefs) => void) | null
  stats: Map<string, FolderStats>
  userName: string
  drives: Drive[]
  canWrite: boolean
  bind: BindItem
  rename: RenameApi
  names: (n: FileNode) => string
  onColumns: (n: number) => void
  onBackgroundClick: () => void
  onBackgroundMenu: (e: MouseEvent) => void
  onUpload: () => void
  onNewFolder: () => void
  onClearSearch: () => void
  onShowFolder: (id: string) => void
  onEject: (driveId: string) => void
}

/** The scrolling area: banners, then the items (or an empty state). */
export function Browser(p: BrowserProps) {
  const nodes = useFiles((s) => s.nodes)
  const chain = p.folder ? ancestry(nodes, p.folder.id) : []
  const drive = chain[0]?.id === 'external' ? p.drives.find((d) => driveFolderId(d.id) === chain[1]?.id) : undefined
  const inApps = chain[0]?.id === 'apps'
  const title = p.folder ? p.names(p.folder) : ''

  const emptyKind = p.query
    ? 'search'
    : p.loc === TRASH
      ? 'trash'
      : p.loc === FAVORITES
        ? 'favorites'
        : p.loc === RECENTS
          ? 'recents'
          : p.folder?.parent === 'home' && p.folder.name === 'Imported'
            ? 'imported'
            : 'folder'

  const onTrash = p.loc === TRASH
  const dateLabel = onTrash ? 'Date Deleted' : p.loc === RECENTS ? 'Last Used' : 'Date Modified'
  const dateOf = (n: FileNode) =>
    onTrash && n.trashed ? n.trashed.at : p.loc === RECENTS ? Math.max(n.modified, n.opened ?? 0, n.added ?? 0) : n.modified

  return (
    <div
      ref={p.scrollRef}
      className="scrollbar-thin relative min-h-0 flex-1 overflow-y-auto px-3 pt-1 pb-36 sm:px-5 md:pb-28"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('[data-file-id], button, input, a')) p.onBackgroundClick()
      }}
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest('[data-file-id]')) return
        e.preventDefault()
        p.onBackgroundMenu(e)
      }}
    >
      {drive && !p.query && (
        <DriveBanner drive={drive} userName={p.userName} onShow={p.onShowFolder} onEject={() => p.onEject(drive.id)} />
      )}
      {inApps && !p.query && (
        <Notice>App data is looked after by each app, so it's read-only here. Changing it by hand could break an app.</Notice>
      )}
      {p.folder?.id === 'shared' && !p.query && <SharedNotice userName={p.userName} />}
      {onTrash && p.items.length > 0 && !p.query && <Notice>Items in the Trash are deleted forever after 30 days.</Notice>}

      {p.items.length === 0 ? (
        <EmptyState
          kind={emptyKind}
          query={p.query}
          where={title || undefined}
          canWrite={p.canWrite}
          onUpload={p.onUpload}
          onNewFolder={p.onNewFolder}
          onClearSearch={p.onClearSearch}
        />
      ) : p.view === 'grid' ? (
        <GridView key={p.loc} items={p.items} bind={p.bind} rename={p.rename} names={p.names} label={title || 'Files'} onColumns={p.onColumns} />
      ) : (
        <ListView
          items={p.items}
          bind={p.bind}
          rename={p.rename}
          names={p.names}
          label={title || 'Files'}
          stats={p.stats}
          sort={p.sort}
          onSort={p.onSort}
          dateLabel={dateLabel}
          dateOf={dateOf}
        />
      )}
    </div>
  )
}

function SharedNotice({ userName }: { userName: string }) {
  const members = useUsers((s) => s.members)
  const people = [{ name: userName, color: 'var(--color-accent)' }, ...members]
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/[0.045] px-4 py-3 ring-1 ring-inset ring-white/[0.07]">
      <div className="flex shrink-0 -space-x-2">
        {people.slice(0, 5).map((m, i) => (
          <span
            key={m.name + i}
            title={m.name}
            className="flex size-7 items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-[#20202a]"
            style={{ background: m.color }}
          >
            {m.name[0]?.toUpperCase()}
          </span>
        ))}
      </div>
      <p className="min-w-0 text-[13px] leading-snug text-white/60">
        <Users size={14} className="mr-1.5 -mt-0.5 inline text-accent" />
        The family space. Everyone at home can see, add and edit what's in Shared.
      </p>
    </div>
  )
}
