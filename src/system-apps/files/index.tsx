import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useContextMenu, type MenuEntry } from '@/components/ui/ContextMenu'
import { useApps } from '@/stores/apps'
import { ancestry, displayName, isWritable, useFiles, type FileNode } from '@/stores/files'
import { useSettings } from '@/stores/settings'
import { useStorage } from '@/stores/storage'
import type { SheetProps } from '../registry'
import { Browser } from './components/Browser'
import { ConnectDialog } from './components/ConnectDialog'
import { ConfirmDialog, InfoDialog, type ConfirmRequest } from './components/Dialogs'
import { DropOverlay } from './components/DropOverlay'
import type { ItemBinding, RenameApi } from './components/items'
import { activeEntry, navEntries } from './components/navEntries'
import { PhoneNav } from './components/PhoneNav'
import { QuickLook } from './components/QuickLook'
import { Sidebar } from './components/Sidebar'
import { Toolbar, type Crumb } from './components/Toolbar'
import { UploadInputs, type Pickers } from './components/UploadInputs'
import { UploadTray } from './components/UploadTray'
import { usePhone, useSelection } from './lib/hooks'
import { menuPosition } from './lib/menu'
import {
  FAVORITES,
  RECENTS,
  TRASH,
  folderStats,
  isSmart,
  itemSubtitle,
  listItems,
  locationLabel,
  sortItems,
  summarize,
} from './lib/tree'
import { useDnd } from './lib/useDnd'
import { useFileOps } from './lib/useFileOps'
import { useItemHandlers } from './lib/useItemHandlers'
import { useKeyboard } from './lib/useKeyboard'
import { useLocation } from './lib/useLocation'

const SMART_TITLES: Record<string, string> = { [RECENTS]: 'Recents', [FAVORITES]: 'Favorites', [TRASH]: 'Trash' }

const focusItem = (id: string | null) => {
  if (!id) return
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>(`[data-file-id="${CSS.escape(id)}"]`)
    el?.focus({ preventScroll: true })
    el?.scrollIntoView({ block: 'nearest' })
  })
}

export default function FilesApp({ params }: SheetProps) {
  const nodes = useFiles((s) => s.nodes)
  const view = useFiles((s) => s.view)
  const sort = useFiles((s) => s.sort)
  const setView = useFiles((s) => s.setView)
  const setSort = useFiles((s) => s.setSort)
  const userName = useSettings((s) => s.userName) || 'Home'
  const allDrives = useStorage((s) => s.drives)
  const drives = useMemo(() => allDrives.filter((d) => d.location === 'external'), [allDrives])
  const installed = useApps((s) => s.installed)
  const phone = usePhone()

  // Every connected drive and installed app gets a folder.
  useEffect(() => useFiles.getState().ensureDrives(drives.map((d) => ({ id: d.id, name: d.name }))), [drives])
  useEffect(() => useFiles.getState().ensureAppFolders(installed), [installed])

  // ---------- Overlays ----------
  const [renaming, setRenaming] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [infoId, setInfoId] = useState<string | null>(null)
  const [connectOpen, setConnectOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)

  // ---------- What's here ----------
  const nav = useLocation(params.path, drives, () => setRenaming(null))
  const { loc, go, query, setQuery, pendingSelect } = nav
  const stats = useMemo(() => folderStats(nodes), [nodes])
  const folder = isSmart(loc) ? undefined : nodes[loc]
  const fixedOrder = loc === RECENTS || loc === TRASH
  const items = useMemo(() => {
    const list = listItems(nodes, loc, query)
    return fixedOrder ? list : sortItems(list, sort, stats)
  }, [nodes, loc, query, sort, stats, fixedOrder])
  const order = useMemo(() => items.map((n) => n.id), [items])
  const selection = useSelection(order)
  const names = useCallback((n: FileNode) => displayName(n, userName), [userName])

  const canWrite = Boolean(folder) && isWritable(nodes, loc)
  const uploadTarget = canWrite ? loc : 'home'
  const trashCount = useMemo(() => Object.values(nodes).filter((n) => n.trashed).length, [nodes])
  const title = SMART_TITLES[loc] ?? (folder ? names(folder) : '')

  // ---------- Actions ----------
  const menu = useContextMenu()
  const openMenu = (x: number, y: number, list: MenuEntry[]) => {
    const at = menuPosition(x, y, list)
    menu.openAt(at.x, at.y, list)
  }
  const pickers = useRef<Pickers>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const columns = useRef(1)

  const ops = useFileOps({
    loc,
    userName,
    view,
    uploadTarget,
    canWrite,
    go,
    select: selection.selectOnly,
    setRenaming,
    setPreview: setPreviewId,
    setInfo: setInfoId,
    setConfirm,
    clearQuery: () => setQuery(''),
    pickFiles: () => pickers.current?.files(),
    pickFolder: () => pickers.current?.folder(),
  })

  const dnd = useDnd({
    fallbackTarget: uploadTarget,
    onUpload: ops.upload,
    onMove: ops.moveOrCopy,
    onTrash: ops.trash,
    onFavorite: (ids) => ops.favorite(ids, true),
  })

  // Select what we were asked to (e.g. the folder we just came up from).
  useEffect(() => {
    const id = pendingSelect.current
    if (!id || !order.includes(id)) return
    pendingSelect.current = null
    selection.selectOnly([id])
    focusItem(id)
  }, [order, selection, pendingSelect])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [loc])

  // ---------- Items ----------
  const handlersFor = useItemHandlers({ selection, ops, dnd, openMenu })
  const showHint = Boolean(query) || loc === RECENTS || loc === FAVORITES
  const tabbable = selection.focusId ?? order[0]
  const bind = useCallback(
    (node: FileNode): ItemBinding => ({
      selected: selection.selected.has(node.id),
      focused: tabbable === node.id,
      renaming: renaming === node.id,
      dropping: dnd.dropTarget === node.id,
      subtitle: itemSubtitle(node, loc, stats, userName),
      hint: showHint ? locationLabel(nodes, node.id, userName) : undefined,
      handlers: handlersFor(node),
    }),
    [selection.selected, tabbable, renaming, dnd.dropTarget, stats, loc, userName, showHint, nodes, handlersFor],
  )

  const commitRename = ops.commitRename
  const commitRef = useRef(commitRename)
  useEffect(() => {
    commitRef.current = commitRename
  })
  const renameApi = useMemo<RenameApi>(
    () => ({ commit: (id, name) => commitRef.current(id, name), cancel: () => setRenaming(null) }),
    [],
  )

  // ---------- Keyboard ----------
  useKeyboard({
    enabled: !renaming,
    selectAll: selection.selectAll,
    focusSearch: () => searchRef.current?.focus(),
    newFolder: ops.newFolder,
    remove: () => {
      if (!selection.ids.length) return
      if (loc === TRASH) ops.deleteForever(selection.ids)
      else ops.trash(selection.ids)
    },
    rename: () => selection.ids.length === 1 && ops.startRename(selection.ids[0]),
    open: () => {
      if (selection.ids.length === 1) ops.open(selection.ids[0])
      else if (selection.ids.length) setPreviewId(selection.ids[0])
    },
    preview: () => {
      const id = selection.focusId ?? selection.ids[0] ?? order[0]
      if (!id) return
      selection.selectOnly([id])
      setPreviewId(id)
    },
    up: () => {
      if (!folder?.parent || folder.parent === 'external') return
      go(folder.parent, folder.id)
    },
    back: nav.back,
    forward: nav.forward,
    move: (dx, dy, extend) => {
      const delta = view === 'grid' ? dx + dy * columns.current : dy || dx
      focusItem(selection.moveBy(delta, extend))
    },
  })

  // ---------- Chrome ----------
  const entries = useMemo(() => navEntries(userName, drives, trashCount), [userName, drives, trashCount])
  const active = activeEntry(nodes, loc)

  const crumbs: Crumb[] = useMemo(() => {
    if (!folder) return [{ loc, label: title }]
    return ancestry(nodes, loc)
      .filter((n) => n.id !== 'external')
      .map((n) => ({ loc: n.id, label: names(n) }))
  }, [folder, nodes, loc, title, names])

  const summary = summarize(nodes, stats, {
    count: items.length,
    selected: selection.ids,
    folderId: folder?.id,
    searching: Boolean(query),
  })

  const dropTarget = dnd.dropTarget && nodes[dnd.dropTarget] ? nodes[dnd.dropTarget] : nodes[uploadTarget]
  const previewNode = previewId ? (nodes[previewId] ?? null) : null
  const previewList = useMemo(() => items.filter((n) => n.kind !== 'folder' || n.id === previewId), [items, previewId])
  const infoNode = infoId ? (nodes[infoId] ?? null) : null

  return (
    <div className="relative flex min-h-0 flex-1" {...dnd.rootHandlers}>
      <Sidebar
        entries={entries}
        active={active}
        dropTarget={dnd.dropTarget}
        onNavigate={(l) => go(l)}
        onEject={ops.eject}
        onConnect={() => setConnectOpen(true)}
        bindDrop={dnd.bindDrop}
      />
      <main className="relative flex min-w-0 flex-1 flex-col">
        <Toolbar
          title={title}
          crumbs={crumbs}
          summary={summary}
          nav={nav}
          onCrumb={(l) => go(l)}
          bindDrop={dnd.bindDrop}
          dropTarget={dnd.dropTarget}
          query={query}
          onQuery={setQuery}
          searchRef={searchRef}
          searchPlaceholder={phone && title.length > 11 ? 'Search' : `Search ${title}`}
          view={view}
          onView={setView}
          sort={sort}
          onSort={setSort}
          showSort={!fixedOrder}
          canWrite={canWrite}
          onNewFolder={ops.newFolder}
          onUploadFiles={() => pickers.current?.files()}
          onUploadFolder={() => pickers.current?.folder()}
          trashMode={loc === TRASH}
          trashCount={trashCount}
          onEmptyTrash={ops.emptyTrash}
          openMenu={openMenu}
        >
          <PhoneNav entries={entries} active={active} onNavigate={(l) => go(l)} onConnect={() => setConnectOpen(true)} />
        </Toolbar>

        <Browser
          scrollRef={scrollRef}
          loc={loc}
          folder={folder}
          items={items}
          query={query}
          view={view}
          sort={sort}
          onSort={fixedOrder ? null : setSort}
          stats={stats}
          userName={userName}
          drives={drives}
          canWrite={canWrite}
          bind={bind}
          rename={renameApi}
          names={names}
          onColumns={(n) => (columns.current = n)}
          onBackgroundClick={selection.clear}
          onMarquee={(additive) => {
            const base = additive ? selection.ids : []
            return (ids) => selection.selectOnly(additive ? [...new Set([...base, ...ids])] : ids)
          }}
          onBackgroundMenu={(e) => openMenu(e.clientX, e.clientY, ops.backgroundMenu(setView, folder?.id ?? null))}
          onUpload={() => pickers.current?.files()}
          onNewFolder={ops.newFolder}
          onClearSearch={() => setQuery('')}
          onShowFolder={(id) => go(id)}
          onEject={ops.eject}
        />

        <UploadTray onShow={(id) => go(id)} />
      </main>

      <DropOverlay open={dnd.external} target={dropTarget ? names(dropTarget) : userName} />
      <UploadInputs ref={pickers} onPick={(tree) => ops.upload(tree, uploadTarget)} />

      {menu.element}
      <QuickLook
        node={previewNode}
        list={previewList}
        stats={stats}
        displayName={names}
        onClose={() => {
          setPreviewId(null)
          focusItem(previewId)
        }}
        onNavigate={(id) => {
          setPreviewId(id)
          selection.selectOnly([id])
        }}
        onFavorite={(id) => ops.favorite([id])}
        onInfo={setInfoId}
        onDownload={ops.download}
      />
      <InfoDialog
        node={infoNode}
        onClose={() => setInfoId(null)}
        stats={stats}
        name={infoNode ? names(infoNode) : ''}
        where={infoNode ? locationLabel(nodes, infoNode.id, userName) : ''}
        onFavorite={(id, v) => useFiles.getState().toggleFavorite([id], v)}
      />
      <ConnectDialog open={connectOpen} onClose={() => setConnectOpen(false)} />
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </div>
  )
}
