import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useContextMenu } from '@/components/ui/ContextMenu'
import { useApps } from '@/stores/apps'
import {
  ancestry,
  displayName,
  isTrashed,
  isWritable,
  useFiles,
  type FileNode,
} from '@/stores/files'
import { useSettings } from '@/stores/settings'
import { useStorage } from '@/stores/storage'
import { formatBytes } from '@/lib/format'
import type { SheetProps } from '../registry'
import { Browser } from './components/Browser'
import { ConfirmDialog, InfoDialog, type ConfirmRequest } from './components/Dialogs'
import { ConnectDialog } from './components/ConnectDialog'
import { DropOverlay } from './components/DropOverlay'
import type { ItemBinding, ItemHandlers, RenameApi } from './components/items'
import { activeEntry, navEntries } from './components/navEntries'
import { PhoneNav } from './components/PhoneNav'
import { QuickLook } from './components/QuickLook'
import { Sidebar } from './components/Sidebar'
import { Toolbar, type Crumb } from './components/Toolbar'
import { UploadTray } from './components/UploadTray'
import { useHistoryNav, useSelection } from './lib/hooks'
import { readInput } from './lib/io'
import { driveFolderId } from './lib/seed'
import { resolveTarget } from './lib/target'
import {
  FAVORITES,
  RECENTS,
  TRASH,
  folderStats,
  formatFileDate,
  isSmart,
  itemsLabel,
  listItems,
  locationLabel,
  sortItems,
  type Loc,
} from './lib/tree'
import { useDnd } from './lib/useDnd'
import { useFileOps } from './lib/useFileOps'
import { useKeyboard } from './lib/useKeyboard'

const SMART_TITLES: Record<string, string> = { [RECENTS]: 'Recents', [FAVORITES]: 'Favorites', [TRASH]: 'Trash' }

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

  // Every connected drive and installed app gets a folder.
  useEffect(() => useFiles.getState().ensureDrives(drives.map((d) => ({ id: d.id, name: d.name }))), [drives])
  useEffect(() => useFiles.getState().ensureAppFolders(installed), [installed])

  // ---------- Overlays ----------
  const [renaming, setRenaming] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [infoId, setInfoId] = useState<string | null>(null)
  const [connectOpen, setConnectOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)

  // ---------- Where we are ----------
  const [initial] = useState(() => resolveTarget(params.path))
  const nav = useHistoryNav(initial.loc)
  const loc = nav.loc
  const [query, setQuery] = useState('')
  const pendingSelect = useRef<string | null>(initial.select ?? null)

  const go = useCallback(
    (next: Loc, select?: string) => {
      setQuery('')
      setRenaming(null)
      pendingSelect.current = select ?? null
      nav.go(next)
    },
    [nav],
  )

  // A standard folder the home screen links to was deleted: make it again.
  useEffect(() => {
    if (initial.missing) nav.replace(useFiles.getState().ensureHomeFolder(initial.missing))
  }, [initial, nav])

  // Opening Files again with a different path while it's already open.
  const lastPath = useRef(params.path)
  useEffect(() => {
    if (params.path === lastPath.current) return
    lastPath.current = params.path
    const t = resolveTarget(params.path)
    const loc = t.missing ? useFiles.getState().ensureHomeFolder(t.missing) : t.loc
    go(loc, t.select)
  }, [params.path, go])

  // If the folder disappears (trashed, deleted, drive ejected), go Home.
  useEffect(() => {
    if (isSmart(loc)) return
    const chain = nodes[loc] ? ancestry(nodes, loc) : []
    const driveGone = chain[0]?.id === 'external' && !drives.some((d) => driveFolderId(d.id) === chain[1]?.id)
    if (!chain.length || loc === 'external' || isTrashed(nodes, loc) || driveGone) nav.replace('home')
  }, [nodes, loc, drives, nav])

  // ---------- What's here ----------
  const stats = useMemo(() => folderStats(nodes), [nodes])
  const folder = isSmart(loc) ? undefined : nodes[loc]
  const fixedOrder = loc === RECENTS || loc === TRASH
  const items = useMemo(() => {
    const list = listItems(nodes, loc, query)
    return fixedOrder ? list : sortItems(list, sort, stats)
  }, [nodes, loc, query, sort, stats, fixedOrder])
  const order = useMemo(() => items.map((n) => n.id), [items])
  const selection = useSelection(order)
  const names = useCallback((n: FileNode) => (n.id === 'apps' ? 'App data' : displayName(n, userName)), [userName])

  const canWrite = Boolean(folder) && isWritable(nodes, loc)
  const uploadTarget = canWrite ? loc : 'home'
  const trashCount = useMemo(() => Object.values(nodes).filter((n) => n.trashed).length, [nodes])
  const title = SMART_TITLES[loc] ?? (folder ? names(folder) : '')

  const menu = useContextMenu()
  const searchRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
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
    pickFiles: () => fileInput.current?.click(),
    pickFolder: () => folderInput.current?.click(),
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
    requestAnimationFrame(() => document.querySelector(`[data-file-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest' }))
  }, [order, selection])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [loc])

  // ---------- Items ----------
  // One set of handlers shared by every item (they read the item's id from
  // the DOM), so memoised rows only re-render when their own state changes.
  const live = useRef({ selection, ops, dnd, nodes, menu, items })
  useEffect(() => {
    live.current = { selection, ops, dnd, nodes, menu, items }
  })
  const idOf = (e: { currentTarget: EventTarget }) => (e.currentTarget as HTMLElement).dataset.fileId ?? ''

  const press = useRef<{ timer: number; x: number; y: number; fired: boolean } | null>(null)
  const handlers = useMemo<ItemHandlers>(() => {
    const cancelPress = () => {
      if (press.current) clearTimeout(press.current.timer)
    }
    const openMenu = (id: string, x: number, y: number) => {
      const { selection, ops, menu } = live.current
      const ids = selection.selected.has(id) ? selection.ids : [id]
      if (!selection.selected.has(id)) selection.selectOnly([id])
      menu.openAt(x, y, ops.itemMenu(ids))
    }
    return {
      onPointerDown: (e) => {
        cancelPress()
        if (e.pointerType !== 'touch') return
        const id = idOf(e)
        const { clientX: x, clientY: y } = e
        const state = { x, y, fired: false, timer: 0 }
        state.timer = window.setTimeout(() => {
          state.fired = true
          navigator.vibrate?.(8)
          openMenu(id, x, y)
        }, 480)
        press.current = state
      },
      onPointerMove: (e) => {
        const p = press.current
        if (p && !p.fired && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) cancelPress()
      },
      onPointerUp: cancelPress,
      onPointerCancel: cancelPress,
      onClick: (e: MouseEvent) => {
        e.stopPropagation()
        if (press.current?.fired) {
          press.current = null
          return
        }
        const { selection, ops } = live.current
        const id = idOf(e)
        const touch = (e.nativeEvent as PointerEvent).pointerType === 'touch'
        if (touch && !e.shiftKey && !e.metaKey && !e.ctrlKey) ops.open(id)
        else selection.click(id, e)
      },
      onDoubleClick: (e: MouseEvent) => live.current.ops.open(idOf(e)),
      onContextMenu: (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        openMenu(idOf(e), e.clientX, e.clientY)
      },
      draggable: true,
      onDragStart: (e) => {
        const { selection, dnd } = live.current
        const id = idOf(e)
        const ids = selection.selected.has(id) ? selection.ids : [id]
        if (!selection.selected.has(id)) selection.selectOnly([id])
        dnd.startItemDrag(ids, e)
      },
      onDragEnd: () => live.current.dnd.endItemDrag(),
    }
  }, [])

  const folderHandlers = useRef(new Map<string, ItemHandlers>())
  const handlersFor = useCallback(
    (node: FileNode): ItemHandlers => {
      if (node.kind !== 'folder' || node.trashed) return handlers
      let h = folderHandlers.current.get(node.id)
      if (!h) {
        h = { ...handlers, ...dnd.bindDrop(node.id) }
        folderHandlers.current.set(node.id, h)
      }
      return h
    },
    [handlers, dnd],
  )

  const showHint = Boolean(query) || loc === RECENTS || loc === FAVORITES
  const tabbable = selection.focusId ?? order[0]
  const bind = useCallback(
    (node: FileNode): ItemBinding => {
      let subtitle: string
      if (node.trashed) subtitle = `From ${node.trashed.path.split('/').filter(Boolean).pop()?.replace(/^Home$/, userName) ?? ''}`
      else if (loc === RECENTS) subtitle = formatFileDate(Math.max(node.modified, node.opened ?? 0, node.added ?? 0), false)
      else if (node.kind === 'folder') subtitle = itemsLabel(stats.get(node.id)?.count ?? 0)
      else subtitle = formatBytes(node.size)
      return {
        selected: selection.selected.has(node.id),
        focused: tabbable === node.id,
        renaming: renaming === node.id,
        dropping: dnd.dropTarget === node.id,
        subtitle,
        hint: showHint ? locationLabel(nodes, node.id, userName) : undefined,
        handlers: handlersFor(node),
      }
    },
    [selection.selected, tabbable, renaming, dnd.dropTarget, stats, loc, userName, showHint, nodes, handlersFor],
  )

  const renameApi = useMemo<RenameApi>(
    () => ({ commit: (id, name) => live.current.ops.commitRename(id, name), cancel: () => setRenaming(null) }),
    [],
  )

  // ---------- Keyboard ----------
  const focusItem = (id: string | null) => {
    if (!id) return
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-file-id="${CSS.escape(id)}"]`)
      el?.focus({ preventScroll: true })
      el?.scrollIntoView({ block: 'nearest' })
    })
  }

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

  const summary = useMemo(() => {
    const parts = [query ? `${items.length.toLocaleString()} ${items.length === 1 ? 'result' : 'results'}` : itemsLabel(items.length)]
    if (selection.ids.length) {
      const bytes = selection.ids.reduce((a, id) => a + (nodes[id]?.kind === 'folder' ? (stats.get(id)?.bytes ?? 0) : (nodes[id]?.size ?? 0)), 0)
      parts[0] = `${selection.ids.length} of ${items.length} selected`
      parts.push(formatBytes(bytes))
    } else if (folder && !query) parts.push(formatBytes(stats.get(loc)?.bytes ?? 0))
    return parts.join(' · ')
  }, [items.length, selection.ids, nodes, stats, folder, loc, query])

  const dropLabel = (() => {
    const t = dnd.dropTarget && nodes[dnd.dropTarget] ? nodes[dnd.dropTarget] : nodes[uploadTarget]
    return t ? names(t) : userName
  })()

  const previewNode = previewId ? nodes[previewId] ?? null : null
  const previewList = useMemo(() => items.filter((n) => n.kind !== 'folder' || n.id === previewId), [items, previewId])
  const infoNode = infoId ? nodes[infoId] ?? null : null

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
          nav={{ canBack: nav.canBack, canForward: nav.canForward, back: nav.back, forward: nav.forward }}
          onCrumb={(l) => go(l)}
          bindDrop={dnd.bindDrop}
          dropTarget={dnd.dropTarget}
          query={query}
          onQuery={setQuery}
          searchRef={searchRef}
          searchPlaceholder={`Search ${title}`}
          view={view}
          onView={setView}
          sort={sort}
          onSort={setSort}
          showSort={!fixedOrder}
          canWrite={canWrite}
          onNewFolder={ops.newFolder}
          onUploadFiles={() => fileInput.current?.click()}
          onUploadFolder={() => folderInput.current?.click()}
          trashMode={loc === TRASH}
          trashCount={trashCount}
          onEmptyTrash={ops.emptyTrash}
          openMenu={menu.openAt}
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
          onBackgroundMenu={(e) => menu.openAt(e.clientX, e.clientY, ops.backgroundMenu(setView, folder?.id ?? null))}
          onUpload={() => fileInput.current?.click()}
          onNewFolder={ops.newFolder}
          onClearSearch={() => setQuery('')}
          onShowFolder={(id) => go(id)}
          onEject={ops.eject}
        />

        <UploadTray onShow={(id) => go(id)} />
      </main>

      <DropOverlay open={dnd.external} target={dropLabel} />

      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          ops.upload(readInput(e.target.files), uploadTarget)
          e.target.value = ''
        }}
      />
      <input
        ref={(el) => {
          folderInput.current = el
          el?.setAttribute('webkitdirectory', '')
        }}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          ops.upload(readInput(e.target.files), uploadTarget)
          e.target.value = ''
        }}
      />

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
