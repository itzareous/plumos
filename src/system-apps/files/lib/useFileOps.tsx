import type { ReactNode } from 'react'
import {
  Download,
  Eye,
  FileUp,
  FolderOpen,
  FolderPlus,
  FolderUp,
  Info,
  LayoutGrid,
  List,
  Pencil,
  RotateCcw,
  Star,
  StarOff,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { MenuEntry } from '@/components/ui/ContextMenu'
import {
  canModify,
  displayName,
  hasBlob,
  isTrashed,
  rootOf,
  useFiles,
  useTransfers,
  type FileNode,
  type ViewMode,
} from '@/stores/files'
import { useStorage } from '@/stores/storage'
import { toast } from '@/stores/toasts'
import type { ConfirmRequest } from '../components/Dialogs'
import { downloadFile, type DroppedTree } from './io'
import { TRASH, type Loc } from './tree'

const icon = (Icon: LucideIcon) => <Icon size={15} />

/** A small round icon for toasts. */
export function toastIcon(Icon: LucideIcon, tone = 'bg-white/12 text-white/85'): ReactNode {
  return (
    <span className={`flex size-9 items-center justify-center rounded-full ${tone}`}>
      <Icon size={17} />
    </span>
  )
}

export interface OpsContext {
  loc: Loc
  userName: string
  view: ViewMode
  uploadTarget: string
  canWrite: boolean
  go: (loc: Loc) => void
  select: (ids: string[]) => void
  setRenaming: (id: string | null) => void
  setPreview: (id: string | null) => void
  setInfo: (id: string | null) => void
  setConfirm: (req: ConfirmRequest | null) => void
  clearQuery: () => void
  pickFiles: () => void
  pickFolder: () => void
}

/** Everything you can do to files, with the toasts and confirmations around it. */
export function useFileOps(ctx: OpsContext) {
  const files = () => useFiles.getState()
  const nameOf = (id: string) => {
    const n = files().nodes[id]
    return n ? displayName(n, ctx.userName) : 'item'
  }
  const count = (ids: string[]) => (ids.length === 1 ? `“${nameOf(ids[0])}”` : `${ids.length} items`)

  const open = (id: string) => {
    const { nodes, markOpened } = files()
    const n = nodes[id]
    if (!n) return
    if (n.kind === 'folder' && !isTrashed(nodes, id)) {
      ctx.go(id)
      return
    }
    ctx.select([id])
    ctx.setPreview(id)
    if (!n.trashed) markOpened(id)
  }

  const trash = (ids: string[]) => {
    const movable = ids.filter((id) => canModify(files().nodes, id))
    if (!movable.length) {
      toast("Can't move that to the Trash", { description: 'App data and drives are looked after by Plumos.', icon: toastIcon(Trash2) })
      return
    }
    const label = count(movable)
    files().trash(movable)
    toast(`Moved ${label} to the Trash`, { icon: toastIcon(Trash2) })
  }

  const restore = (ids: string[]) => {
    const label = count(ids)
    const n = files().restore(ids)
    if (n) toast(`Put back ${label}`, { icon: toastIcon(RotateCcw) })
  }

  const deleteForever = (ids: string[]) =>
    ctx.setConfirm({
      title: ids.length === 1 ? `Delete “${nameOf(ids[0])}” forever?` : `Delete ${ids.length} items forever?`,
      message: "This can't be undone.",
      confirmLabel: 'Delete',
      onConfirm: () => {
        const n = files().deleteForever(ids)
        if (n) toast(n === 1 ? 'Deleted forever' : `Deleted ${n} items forever`, { icon: toastIcon(Trash2, 'bg-red-500/20 text-red-300') })
      },
    })

  const emptyTrash = () => {
    const n = Object.values(files().nodes).filter((x) => x.trashed).length
    if (!n) return
    ctx.setConfirm({
      title: 'Empty the Trash?',
      message: `${n.toLocaleString()} ${n === 1 ? 'item' : 'items'} will be deleted forever. This can't be undone.`,
      confirmLabel: 'Empty Trash',
      onConfirm: () => {
        files().emptyTrash()
        toast('Trash emptied', { icon: toastIcon(Trash2, 'bg-red-500/20 text-red-300') })
      },
    })
  }

  const favorite = (ids: string[], value?: boolean) => {
    const { nodes, toggleFavorite } = files()
    const next = value ?? !ids.every((id) => nodes[id]?.favorite)
    toggleFavorite(ids, next)
    toast(next ? 'Added to Favorites' : 'Removed from Favorites', {
      description: ids.length === 1 ? nameOf(ids[0]) : `${ids.length} items`,
      icon: toastIcon(next ? Star : StarOff, next ? 'bg-amber-400/20 text-amber-300' : undefined),
    })
  }

  const copyToShared = (ids: string[]) => {
    const label = count(ids)
    const made = files().copyTo(ids, 'shared')
    if (made.length) toast(`Copied ${label} to Shared`, { description: 'Everyone at home can see it now.', icon: toastIcon(Users) })
  }

  const newFolder = () => {
    if (!ctx.canWrite) return
    ctx.clearQuery()
    const id = files().createFolder(ctx.uploadTarget)
    ctx.select([id])
    ctx.setRenaming(id)
  }

  const commitRename = (id: string, name: string) => {
    const result = files().rename(id, name)
    if (result === 'taken') toast(`“${name.trim()}” is already taken`, { description: 'Pick a different name for it.', icon: toastIcon(Pencil) })
    ctx.setRenaming(null)
  }

  const startRename = (id: string) => {
    if (!canModify(files().nodes, id)) return
    ctx.select([id])
    ctx.setRenaming(id)
  }

  const download = (id: string) => {
    if (!downloadFile(id, nameOf(id))) toast('Nothing to download', { description: 'Demo files have no contents to save.' })
  }

  const upload = (tree: DroppedTree, target: string) => {
    if (!tree.files.length && !tree.folders.length) return
    const store = files()
    for (const dirs of tree.folders) store.ensureFolders(target, dirs)
    if (tree.files.length) useTransfers.getState().upload(target, tree.files)
    else {
      const top = new Set(tree.folders.map((d) => d[0])).size
      toast(`Added ${top} ${top === 1 ? 'folder' : 'folders'}`, { icon: toastIcon(FolderPlus) })
    }
  }

  /** Moving onto a drive or out of one copies instead, like between disks. */
  const moveOrCopy = (ids: string[], target: string) => {
    const { nodes, move, copyTo } = files()
    const targetRoot = rootOf(nodes, target)
    const copies = ids.filter((id) => rootOf(nodes, id) !== targetRoot && (rootOf(nodes, id) === 'external' || targetRoot === 'external' || !canModify(nodes, id)))
    const moves = ids.filter((id) => !copies.includes(id))
    const moved = moves.length ? move(moves, target) : 0
    const copied = copies.length ? copyTo(copies, target).length : 0
    const where = nodes[target] ? displayName(nodes[target], ctx.userName) : 'there'
    if (moved) toast(`Moved ${moved === 1 && moves.length === 1 ? `“${nameOf(moves[0])}”` : `${moved} items`} to ${where}`, { icon: toastIcon(FolderOpen) })
    if (copied) toast(`Copied ${copied === 1 ? `“${nameOf(copies[0])}”` : `${copied} items`} to ${where}`, { icon: toastIcon(FolderOpen) })
  }

  const eject = (driveId: string) => {
    const drive = useStorage.getState().drives.find((d) => d.id === driveId)
    if (!drive) return
    useTransfers.getState().cancelImport(driveId)
    useStorage.getState().ejectDrive(driveId)
    toast(`“${drive.name}” ejected`, { description: "It's safe to unplug it now." })
  }

  const itemMenu = (ids: string[]): MenuEntry[] => {
    const { nodes } = files()
    const list = ids.map((id) => nodes[id]).filter((n): n is FileNode => Boolean(n))
    if (!list.length) return []
    const one = list.length === 1 ? list[0] : null
    const entries: (MenuEntry | false | null)[] = []

    if (list.some((n) => n.trashed)) {
      entries.push(
        one && { label: 'Quick Look', icon: icon(Eye), onSelect: () => open(one.id) },
        { label: 'Put Back', icon: icon(RotateCcw), onSelect: () => restore(ids) },
        one && { label: 'Get Info', icon: icon(Info), onSelect: () => ctx.setInfo(one.id) },
        'separator',
        { label: 'Delete Permanently…', icon: icon(Trash2), danger: true, onSelect: () => deleteForever(ids) },
      )
      return clean(entries)
    }

    const modifiable = list.every((n) => canModify(nodes, n.id))
    const allFav = list.every((n) => n.favorite)
    const allShared = list.every((n) => rootOf(nodes, n.id) === 'shared')
    entries.push(
      one
        ? { label: 'Open', icon: icon(one.kind === 'folder' ? FolderOpen : Eye), onSelect: () => open(one.id) }
        : { label: 'Quick Look', icon: icon(Eye), onSelect: () => open(list[0].id) },
      one && { label: 'Rename', icon: icon(Pencil), disabled: !modifiable, onSelect: () => startRename(one.id) },
      'separator',
      { label: allFav ? 'Remove from Favorites' : 'Add to Favorites', icon: icon(allFav ? StarOff : Star), onSelect: () => favorite(ids, !allFav) },
      !allShared && { label: 'Copy to Shared', icon: icon(Users), onSelect: () => copyToShared(ids) },
      one?.uploaded && hasBlob(one.id) ? { label: 'Download', icon: icon(Download), onSelect: () => download(one.id) } : null,
      one && { label: 'Get Info', icon: icon(Info), onSelect: () => ctx.setInfo(one.id) },
      'separator',
      { label: 'Move to Trash', icon: icon(Trash2), danger: true, disabled: !modifiable, onSelect: () => trash(ids) },
    )
    return clean(entries)
  }

  const backgroundMenu = (setView: (v: ViewMode) => void, folderId: string | null): MenuEntry[] =>
    clean([
      ctx.canWrite && { label: 'New Folder', icon: icon(FolderPlus), onSelect: newFolder },
      ctx.canWrite && { label: 'Upload Files…', icon: icon(FileUp), onSelect: ctx.pickFiles },
      ctx.canWrite && { label: 'Upload a Folder…', icon: icon(FolderUp), onSelect: ctx.pickFolder },
      'separator',
      ctx.view === 'grid'
        ? { label: 'View as List', icon: icon(List), onSelect: () => setView('list') }
        : { label: 'View as Icons', icon: icon(LayoutGrid), onSelect: () => setView('grid') },
      ctx.loc === TRASH && { label: 'Empty Trash…', icon: icon(Trash2), danger: true, onSelect: emptyTrash },
      folderId ? { label: 'Get Info', icon: icon(Info), onSelect: () => ctx.setInfo(folderId) } : null,
    ])

  return {
    open,
    trash,
    restore,
    deleteForever,
    emptyTrash,
    favorite,
    copyToShared,
    newFolder,
    commitRename,
    startRename,
    download,
    upload,
    moveOrCopy,
    eject,
    itemMenu,
    backgroundMenu,
  }
}

export type FileOps = ReturnType<typeof useFileOps>

/** Drops empty entries and stray separators. */
function clean(entries: (MenuEntry | false | null | undefined)[]): MenuEntry[] {
  const out: MenuEntry[] = []
  for (const e of entries) {
    if (!e) continue
    if (e === 'separator' && (!out.length || out[out.length - 1] === 'separator')) continue
    out.push(e)
  }
  while (out[out.length - 1] === 'separator') out.pop()
  return out
}
