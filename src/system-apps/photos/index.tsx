import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { motion } from 'motion/react'
import {
  CheckCircle2,
  Download,
  FolderPlus,
  HardDrive,
  Heart,
  ImagePlus,
  Maximize2,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { downloadPhoto, type Photo } from '@/lib/photos'
import { useContextMenu, type MenuEntry } from '@/components/ui/ContextMenu'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toasts'
import { useSettings } from '@/stores/settings'
import { useLibrary, usePhotos } from '@/stores/photos'
import type { SheetProps } from '../registry'
import { TopBar, type Tab } from './TopBar'
import { PhotoGrid, type GridHandle } from './PhotoGrid'
import { AlbumsView } from './AlbumsView'
import { AlbumHeader, EmptyState, SharedHeader } from './Headers'
import { SelectionBar } from './SelectionBar'
import { Viewer } from './Viewer'
import { toRect, type Rect } from './ViewerImage'
import { BackupDialog } from './BackupDialog'
import { DriveImportDialog } from './DriveImportDialog'
import { NameDialog } from './NameDialog'
import { DropOverlay } from './DropOverlay'
import { UndoBar, type UndoAction } from './UndoBar'
import { Avatar } from './Avatar'
import { buildAlbums, type AlbumView } from './albums'
import { contributorOf, usePeople } from './people'
import { plural } from './format'
import { useSelection } from './useSelection'
import { useFileDrop } from './useFileDrop'
import type { Grouping } from './layout'

type DialogKind = 'backup' | 'drive' | 'new-album' | 'rename'
type Target = { kind: 'album'; id: string; name: string } | { kind: 'family'; name: string }

interface ViewerState {
  ids: string[]
  index: number
  origin: Rect | null
  closing: boolean
  closeTo: Rect | null
}

const TABS: Tab[] = ['library', 'favorites', 'albums', 'shared']
const MENU_ITEM_H = 36

export default function Photos({ params }: SheetProps) {
  const library = useLibrary()
  const people = usePeople()
  const userName = useSettings((s) => s.userName)
  const userAlbums = usePhotos((s) => s.albums)
  const density = usePhotos((s) => s.density)
  const store = usePhotos.getState

  const [tab, setTab] = useState<Tab>(() => (params.album ? 'albums' : TABS.includes(params.tab as Tab) ? (params.tab as Tab) : 'library'))
  const [albumId, setAlbumId] = useState<string | null>(params.album ?? null)
  const [who, setWho] = useState('all')
  const [target, setTarget] = useState<Target | null>(null)
  const [viewer, setViewer] = useState<ViewerState | null>(null)
  const [dialog, setDialog] = useState<DialogKind | null>(null)
  const [pendingIds, setPendingIds] = useState<string[] | null>(null)
  const [undo, setUndo] = useState<UndoAction | null>(null)
  const gridRef = useRef<GridHandle>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const menu = useContextMenu()

  // ----- Data for each view -----
  const { smart, mine } = useMemo(() => buildAlbums(library, userAlbums), [library, userAlbums])
  const album = albumId ? ([...smart, ...mine].find((a) => a.id === albumId) ?? null) : null
  const own = useMemo(() => library.filter((p) => p.owner === 'me'), [library])
  const favorites = useMemo(() => library.filter((p) => p.favorite), [library])
  const shared = useMemo(() => library.filter((p) => p.owner === 'shared'), [library])
  const sharedShown = useMemo(
    () => (who === 'all' ? shared : shared.filter((p) => contributorOf(p, people).id === who)),
    [shared, who, people],
  )
  const view: { key: string; items: Photo[]; grouping: Grouping } | null =
    tab === 'library'
      ? { key: 'library', items: own, grouping: 'month' }
      : tab === 'favorites'
        ? { key: 'favorites', items: favorites, grouping: 'month' }
        : tab === 'shared'
          ? { key: `shared-${who}`, items: sharedShown, grouping: 'month' }
          : album
            ? { key: `album-${album.id}`, items: album.photos, grouping: album.photos.length > 48 ? 'month' : 'none' }
            : null

  const selection = useSelection(view?.items ?? [])
  const { selecting, selected } = selection
  const byId = useMemo(() => new Map(library.map((p) => [p.id, p])), [library])
  const selectedPhotos = useMemo(() => [...selected].map((id) => byId.get(id)).filter((p): p is Photo => Boolean(p)), [selected, byId])

  const pushUndo = useCallback((label: string, fn: () => void) => setUndo({ id: Date.now(), label, undo: fn }), [])
  const dismissUndo = useCallback(() => setUndo(null), [])

  const switchTab = useCallback(
    (next: Tab) => {
      selection.clear()
      setTarget(null)
      setTab(next)
    },
    [selection],
  )

  // ----- Actions -----
  const deletePhotos = useCallback(
    (ids: string[]) => {
      if (!ids.length) return
      store().remove(ids)
      pushUndo(`Deleted ${plural(ids.length, 'item')}`, () => store().restore(ids))
    },
    [pushUndo, store],
  )

  const toggleFavorite = useCallback(
    (photos: Photo[]) => {
      const all = photos.every((p) => p.favorite)
      store().setFavorite(
        photos.map((p) => p.id),
        !all,
      )
    },
    [store],
  )

  const shareToggle = useCallback(
    (photos: Photo[]) => {
      const ids = photos.map((p) => p.id)
      const toMe = photos.every((p) => p.owner === 'shared')
      const before = new Map(photos.map((p) => [p.id, p.owner]))
      store().setOwner(ids, toMe ? 'me' : 'shared')
      pushUndo(toMe ? `Moved ${plural(ids.length, 'item')} to your library` : `Shared ${plural(ids.length, 'item')} with Family`, () => {
        for (const [id, owner] of before) store().setOwner([id], owner)
      })
    },
    [pushUndo, store],
  )

  const addToAlbum = useCallback(
    (a: { id: string; name: string }, ids: string[]) => {
      store().addToAlbum(a.id, ids)
      toast(`Added to “${a.name}”`, { description: plural(ids.length, 'item'), icon: <FolderPlus size={18} className="text-accent" /> })
    },
    [store],
  )

  const albumMenu = useCallback(
    (ids: string[], x: number, y: number, upward: boolean) => {
      const items: MenuEntry[] = [
        ...mine.map((a) => ({ label: a.name, icon: <FolderPlus size={15} />, onSelect: () => (addToAlbum(a, ids), selection.clear()) })),
        ...(mine.length ? (['separator'] as MenuEntry[]) : []),
        {
          label: 'New Album…',
          icon: <Plus size={15} />,
          onSelect: () => {
            setPendingIds(ids)
            setDialog('new-album')
          },
        },
      ]
      const h = items.length * MENU_ITEM_H + 16
      menu.openAt(x, upward ? Math.max(8, y - h - 10) : y, items)
    },
    [mine, addToAlbum, selection, menu],
  )

  const importFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return
      const added = await store().addFiles(files)
      if (!added.length) {
        toast('Nothing to add', { description: 'Drop photos or videos your browser can open (JPEG, PNG, WebP, MP4…)' })
        return
      }
      switchTab('library')
      requestAnimationFrame(() => gridRef.current?.scrollToTop())
      toast(`Added ${plural(added.length, 'item')} to your library`, { icon: <ImagePlus size={18} className="text-accent" /> })
    },
    [store, switchTab],
  )
  const dragging = useFileDrop((files) => void importFiles(files))

  // ----- Viewer -----
  const viewerRef = useRef(viewer)
  viewerRef.current = viewer
  const openViewer = useCallback((photo: Photo, rect: DOMRect | null, list: Photo[]) => {
    const index = list.findIndex((p) => p.id === photo.id)
    if (index < 0) return
    setViewer({ ids: list.map((p) => p.id), index, origin: rect ? toRect(rect) : null, closing: false, closeTo: null })
  }, [])
  const closeViewer = useCallback(() => {
    const v = viewerRef.current
    if (!v || v.closing) return
    const rect = gridRef.current?.rectOf(v.ids[v.index]) ?? null
    setViewer({ ...v, closing: true, closeTo: rect ? toRect(rect) : null })
  }, [])
  const viewerPhotos = useMemo(
    () => (viewer ? viewer.ids.map((id) => byId.get(id)).filter((p): p is Photo => Boolean(p)) : []),
    [viewer, byId],
  )
  const deleteFromViewer = useCallback(
    (p: Photo) => {
      deletePhotos([p.id])
      setViewer((v) => {
        if (!v) return v
        const ids = v.ids.filter((id) => id !== p.id)
        if (!ids.length) return null
        return { ...v, ids, index: Math.min(v.index, ids.length - 1) }
      })
    },
    [deletePhotos],
  )

  // Open straight to a photo or album when asked to.
  const handledParams = useRef(false)
  useEffect(() => {
    if (handledParams.current) return
    handledParams.current = true
    const photo = params.photoId ? byId.get(params.photoId) : undefined
    if (!photo) return
    const list = photo.owner === 'shared' ? shared : own
    setTab(photo.owner === 'shared' ? 'shared' : 'library')
    openViewer(photo, null, list)
  }, [params.photoId, byId, shared, own, openViewer])

  // ----- Keyboard -----
  const keyState = useRef({ viewer, dialog, selecting, selected, tab, albumId, view })
  keyState.current = { viewer, dialog, selecting, selected, tab, albumId, view }
  const actions = useRef({ deletePhotos, clear: selection.clear, selectAll: selection.selectAll })
  actions.current = { deletePhotos, clear: selection.clear, selectAll: selection.selectAll }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = keyState.current
      if (s.viewer || s.dialog || e.defaultPrevented) return
      if ((e.target as HTMLElement | null)?.closest('input, textarea, [contenteditable="true"]')) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        store().setDensity(store().density + 1)
      } else if (mod && (e.key === '-' || e.key === '_')) {
        e.preventDefault()
        store().setDensity(store().density - 1)
      } else if (mod && e.key.toLowerCase() === 'a' && s.view?.items.length) {
        e.preventDefault()
        actions.current.selectAll()
      } else if (e.key === 'Escape') {
        // An open menu closes itself; don't let the sheet close underneath it.
        if (document.querySelector('[role="menu"]')) e.preventDefault()
        else if (s.selecting) {
          e.preventDefault()
          actions.current.clear()
          setTarget(null)
        } else if (s.tab === 'albums' && s.albumId) {
          e.preventDefault()
          setAlbumId(null)
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && s.selecting && s.selected.size) {
        e.preventDefault()
        actions.current.deletePhotos([...s.selected])
        actions.current.clear()
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [store])

  // ----- Menus -----
  const onImportMenu = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    menu.openAt(Math.max(8, r.right - 250), r.bottom + 8, [
      { label: 'Add from This Computer…', icon: <Upload size={15} />, onSelect: () => fileInput.current?.click() },
      { label: 'Import from Old Backup Drive', icon: <HardDrive size={15} />, onSelect: () => setDialog('drive') },
      'separator',
      { label: 'Back Up Your Phone', icon: <Smartphone size={15} />, onSelect: () => setDialog('backup') },
    ])
  }

  const onTileMenu = useCallback(
    (photo: Photo, e: MouseEvent<HTMLElement>) => {
      const rect = (e.currentTarget.parentElement ?? e.currentTarget).getBoundingClientRect()
      const group = selected.has(photo.id) && selected.size > 1 ? selectedPhotos : [photo]
      const ids = group.map((p) => p.id)
      const many = group.length > 1
      const { clientX: x, clientY: y } = e
      menu.handler(() => [
        ...(!many
          ? [{ label: 'Open', icon: <Maximize2 size={15} />, onSelect: () => openViewer(photo, rect, keyState.current.view?.items ?? [photo]) }]
          : []),
        { label: group.every((p) => p.favorite) ? 'Unfavorite' : 'Favorite', icon: <Heart size={15} />, onSelect: () => toggleFavorite(group) },
        { label: 'Add to Album…', icon: <FolderPlus size={15} />, onSelect: () => albumMenu(ids, x, y, false) },
        {
          label: group.every((p) => p.owner === 'shared') ? 'Move to My Library' : 'Share with Family',
          icon: <Users size={15} />,
          onSelect: () => shareToggle(group),
        },
        ...(!many ? [{ label: photo.url ? 'Download Original' : 'Download', icon: <Download size={15} />, onSelect: () => void downloadPhoto(photo) }] : []),
        ...(!selecting ? [{ label: 'Select', icon: <CheckCircle2 size={15} />, onSelect: () => selection.toggle(photo, keyState.current.view?.items.indexOf(photo) ?? 0, { shift: false }) }] : []),
        'separator',
        {
          label: many ? `Delete ${group.length} Items` : 'Delete',
          icon: <Trash2 size={15} />,
          danger: true,
          onSelect: () => {
            deletePhotos(ids)
            selection.clear()
          },
        },
      ])(e)
    },
    [selected, selectedPhotos, menu, openViewer, toggleFavorite, albumMenu, shareToggle, selecting, selection, deletePhotos],
  )

  const onAlbumMenu = useCallback(
    (a: AlbumView, e: MouseEvent<HTMLElement>) => {
      menu.handler(() => [
        { label: 'Rename…', icon: <Pencil size={15} />, onSelect: () => (setAlbumId(a.id), setDialog('rename')) },
        {
          label: 'Delete Album',
          icon: <Trash2 size={15} />,
          danger: true,
          onSelect: () => {
            const removed = store().deleteAlbum(a.id)
            if (albumId === a.id) setAlbumId(null)
            if (removed) pushUndo(`Deleted “${removed.name}”`, () => store().restoreAlbum(removed))
          },
        },
      ])(e)
    },
    [menu, store, albumId, pushUndo],
  )

  // ----- Selection bar actions -----
  const finishTarget = () => {
    if (!target) return
    const ids = [...selected]
    if (target.kind === 'album') {
      addToAlbum(target, ids)
      setAlbumId(target.id)
      switchTab('albums')
    } else {
      store().setOwner(ids, 'shared')
      toast(`Shared ${plural(ids.length, 'item')} with Family`, { icon: <Users size={18} className="text-accent" /> })
      switchTab('shared')
    }
  }

  const startTarget = (t: Target) => {
    selection.clear()
    setTab('library')
    setTarget(t)
    selection.start()
  }

  // ----- Rendering -----
  const videos = own.filter((p) => p.video).length
  const subtitle =
    tab === 'library'
      ? `${userName ? `${userName}’s` : 'Your'} library · ${plural(own.length - videos, 'photo')}, ${plural(videos, 'video')}`
      : tab === 'favorites'
        ? plural(favorites.length, 'favorite')
        : tab === 'albums'
          ? `${plural(mine.length, 'album')} and ${smart.length} collections`
          : `Family space · ${plural(shared.length, 'item')}`

  const badge = useCallback(
    (p: Photo) => (
      <span className="absolute top-1.5 right-1.5 rounded-full shadow-[0_0_0_1.5px_rgb(255_255_255/0.9),0_1px_4px_rgb(0_0_0/0.4)]">
        <Avatar person={contributorOf(p, people)} size={19} />
      </span>
    ),
    [people],
  )

  const renderGrid = () => {
    if (!view) return null
    let header = null
    let empty = null
    if (tab === 'shared') {
      header = <SharedHeader people={people} photos={shared} who={who} onWho={setWho} onAddPhotos={() => startTarget({ kind: 'family', name: 'Family' })} />
      empty = (
        <EmptyState
          icon={<Users size={28} />}
          title="Nothing here yet"
          body="Photos added to the family space by this person will show up here."
        />
      )
    } else if (tab === 'albums' && album) {
      const isUser = album.kind === 'user'
      header = (
        <AlbumHeader
          album={album}
          onBack={() => (selection.clear(), setAlbumId(null))}
          onAddPhotos={isUser ? () => startTarget({ kind: 'album', id: album.id, name: album.name }) : undefined}
          onImport={album.id === 'old-drive' && album.photos.length > 0 ? () => setDialog('drive') : undefined}
          onMore={isUser ? (e) => onAlbumMenu(album, e) : undefined}
        />
      )
      empty =
        album.id === 'old-drive' ? (
          <EmptyState
            icon={<HardDrive size={28} />}
            title="Nothing imported yet"
            body="Plug in an old drive and bring its photos home. They keep their original dates."
            action={
              <Button variant="primary" icon={<HardDrive size={16} />} onClick={() => setDialog('drive')}>
                Import from Old Backup Drive
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<ImagePlus size={28} />}
            title="This album is empty"
            body={isUser ? 'Pick photos from your library to add them here.' : 'Photos that fit this collection will appear here.'}
            action={
              isUser ? (
                <Button variant="primary" icon={<Plus size={16} />} onClick={() => startTarget({ kind: 'album', id: album.id, name: album.name })}>
                  Add Photos
                </Button>
              ) : undefined
            }
          />
        )
    } else if (tab === 'favorites') {
      empty = <EmptyState icon={<Heart size={28} />} title="No favorites yet" body="Tap the heart on any photo to keep it here." />
    } else {
      empty = (
        <EmptyState
          icon={<ImagePlus size={28} />}
          title="Your library is empty"
          body="Back up your phone, import an old drive, or drop photos onto this window."
          action={
            <Button variant="primary" icon={<Smartphone size={16} />} onClick={() => setDialog('backup')}>
              Back Up Your Phone
            </Button>
          }
        />
      )
    }
    return (
      <PhotoGrid
        ref={gridRef}
        key={view.key}
        items={view.items}
        grouping={view.grouping}
        density={density}
        selecting={selecting}
        selected={selected}
        hiddenId={viewer ? viewer.ids[viewer.index] ?? null : null}
        header={header}
        empty={empty}
        badge={tab === 'shared' ? badge : undefined}
        showFavorite={tab !== 'favorites'}
        scrollKey={view.key}
        onOpen={openViewer}
        onSelect={selection.toggle}
        onSelectMany={selection.setMany}
        onMenu={onTileMenu}
        onZoom={(d) => store().setDensity(store().density + d)}
      />
    )
  }

  const renaming = dialog === 'rename' ? mine.find((a) => a.id === albumId) : undefined
  const inUserAlbum = tab === 'albums' && album?.kind === 'user'

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <TopBar
        tab={tab}
        onTab={(t) => {
          if (t === 'albums' && tab === 'albums') setAlbumId(null)
          switchTab(t)
        }}
        subtitle={subtitle}
        canZoom={Boolean(view)}
        canSelect={Boolean(view?.items.length)}
        selecting={selecting}
        onToggleSelect={() => (selecting ? (selection.clear(), setTarget(null)) : selection.start())}
        onImport={onImportMenu}
        onBackup={() => setDialog('backup')}
      />

      <motion.div
        key={view?.key ?? 'albums'}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        className="relative flex min-h-0 flex-1 flex-col"
      >
        {view ? (
          renderGrid()
        ) : (
          <AlbumsView
            smart={smart}
            mine={mine}
            onOpen={(a) => (a.id === 'old-drive' && !a.photos.length ? setDialog('drive') : setAlbumId(a.id))}
            onNew={() => {
              setPendingIds(null)
              setDialog('new-album')
            }}
            onMenu={onAlbumMenu}
          />
        )}
      </motion.div>

      <SelectionBar
        open={selecting}
        count={selected.size}
        allFavorite={selectedPhotos.length > 0 && selectedPhotos.every((p) => p.favorite)}
        allShared={selectedPhotos.length > 0 && selectedPhotos.every((p) => p.owner === 'shared')}
        targetAlbum={target ? target.name : null}
        inAlbum={inUserAlbum}
        onDone={() => {
          selection.clear()
          setTarget(null)
        }}
        onFavorite={() => toggleFavorite(selectedPhotos)}
        onAddToAlbum={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          albumMenu([...selected], r.left, r.top, true)
        }}
        onAddToTarget={finishTarget}
        onRemoveFromAlbum={() => {
          if (!album) return
          const ids = [...selected]
          store().removeFromAlbum(album.id, ids)
          pushUndo(`Removed ${plural(ids.length, 'item')} from “${album.name}”`, () => store().addToAlbum(album.id, ids))
          selection.clear()
        }}
        onShare={() => {
          shareToggle(selectedPhotos)
          selection.clear()
        }}
        onDelete={() => {
          deletePhotos([...selected])
          selection.clear()
        }}
      />

      <DropOverlay visible={dragging} />

      {viewer && viewerPhotos.length > 0 && (
        <Viewer
          photos={viewerPhotos}
          index={Math.min(viewer.index, viewerPhotos.length - 1)}
          origin={viewer.origin}
          closing={viewer.closing}
          closeTo={viewer.closeTo}
          people={people}
          onIndexChange={(index) => setViewer((v) => (v ? { ...v, index } : v))}
          onRequestClose={closeViewer}
          onClosed={() => setViewer(null)}
          onFavorite={(p) => store().setFavorite([p.id], !p.favorite)}
          onDelete={deleteFromViewer}
        />
      )}

      <BackupDialog open={dialog === 'backup'} onClose={() => setDialog(null)} onShowLibrary={() => (switchTab('library'), gridRef.current?.scrollToTop())} />
      <DriveImportDialog
        open={dialog === 'drive'}
        onClose={() => setDialog(null)}
        onViewAlbum={() => {
          switchTab('albums')
          setAlbumId('old-drive')
        }}
      />
      <NameDialog
        open={dialog === 'new-album'}
        title="New Album"
        description={pendingIds?.length ? `With ${plural(pendingIds.length, 'item')} you selected.` : 'Give it a name. You can add photos next.'}
        confirmLabel="Create"
        onClose={() => setDialog(null)}
        onSubmit={(name) => {
          const created = store().createAlbum(name, pendingIds ?? [])
          if (pendingIds?.length) {
            toast(`Created “${created.name}”`, { description: plural(pendingIds.length, 'item'), icon: <FolderPlus size={18} className="text-accent" /> })
            selection.clear()
          } else {
            switchTab('albums')
            setAlbumId(created.id)
          }
          setPendingIds(null)
        }}
      />
      <NameDialog
        open={dialog === 'rename' && Boolean(renaming)}
        title="Rename Album"
        initial={renaming?.name ?? ''}
        confirmLabel="Rename"
        onClose={() => setDialog(null)}
        onSubmit={(name) => renaming && store().renameAlbum(renaming.id, name)}
      />

      <UndoBar action={undo} onDismiss={dismissUndo} />
      {menu.element}
      <input
        ref={fileInput}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          void importFiles(Array.from(e.target.files ?? []))
          e.target.value = ''
        }}
      />
    </div>
  )
}
