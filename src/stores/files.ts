import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useSettings } from './settings'
import { toast } from './toasts'
import { kindFromName, type FileKind } from '@/system-apps/files/lib/kinds'
import { driveFolderId, seedAppFolder, seedDrive, seedFiles } from '@/system-apps/files/lib/seed'

export type { FileKind }

/**
 * The home server's file tree (demo). Folders and files live in one flat map
 * keyed by id; the tree is persisted, but the contents of files uploaded in
 * this session only live in memory as blobs.
 */
export interface FileNode {
  id: string
  /** Parent folder id; `null` for the roots (Home, Shared, Apps, External). */
  parent: string | null
  name: string
  kind: FileKind
  /** Bytes. Folders store 0; their size is the sum of what's inside. */
  size: number
  modified: number
  favorite?: boolean
  /** Set on the item that was moved to the Trash (not on its children). */
  trashed?: { at: number; from: string; path: string }
  /** Uploaded from this browser; the bytes may be gone after a reload. */
  uploaded?: boolean
  mime?: string
  /** Demo text for seeded text and code files. */
  content?: string
  /** Last opened, for Recents. */
  opened?: number
  /** When it arrived on the server, for Recents. */
  added?: number
}

export type ViewMode = 'grid' | 'list'
export type SortKey = 'name' | 'modified' | 'size' | 'kind'
export interface SortPrefs {
  key: SortKey
  dir: 'asc' | 'desc'
}

export const ROOTS = ['home', 'shared', 'apps', 'external'] as const
export const ROOT_PATHS: Record<string, string> = { home: 'Home', shared: 'Shared', apps: 'Apps', external: 'External' }

// ---------- In-memory file contents ----------

const blobs = new Map<string, Blob>()
const urls = new Map<string, string>()

export const hasBlob = (id: string) => blobs.has(id)
export const getBlob = (id: string) => blobs.get(id)

/** An object URL for an uploaded file's bytes, if we still have them. */
export function blobUrl(id: string): string | undefined {
  const blob = blobs.get(id)
  if (!blob) return undefined
  let url = urls.get(id)
  if (!url) {
    url = URL.createObjectURL(blob)
    urls.set(id, url)
  }
  return url
}

function dropBlob(id: string) {
  const url = urls.get(id)
  if (url) URL.revokeObjectURL(url)
  urls.delete(id)
  blobs.delete(id)
}

// ---------- Tree helpers ----------

type Nodes = Record<string, FileNode>

let idCounter = 0
export const newId = (prefix = 'n') => `${prefix}${Date.now().toString(36)}${(idCounter++).toString(36)}`

export function childrenOf(nodes: Nodes, parentId: string): FileNode[] {
  const out: FileNode[] = []
  for (const id in nodes) {
    const n = nodes[id]
    if (n.parent === parentId && !n.trashed) out.push(n)
  }
  return out
}

/** Ancestors from the root down to (and including) the node. */
export function ancestry(nodes: Nodes, id: string): FileNode[] {
  const chain: FileNode[] = []
  let cur: FileNode | undefined = nodes[id]
  let guard = 0
  while (cur && guard++ < 64) {
    chain.unshift(cur)
    cur = cur.parent ? nodes[cur.parent] : undefined
  }
  return chain
}

export const rootOf = (nodes: Nodes, id: string) => ancestry(nodes, id)[0]?.id ?? null

/** True when the node or any folder above it is in the Trash. */
export function isTrashed(nodes: Nodes, id: string): boolean {
  return ancestry(nodes, id).some((n) => n.trashed)
}

export function isDescendant(nodes: Nodes, id: string, ancestorId: string): boolean {
  return ancestry(nodes, id).some((n) => n.id === ancestorId)
}

/** "/Home/Documents/Notes.md" */
export function pathOf(nodes: Nodes, id: string): string {
  return '/' + ancestry(nodes, id).map((n) => n.name).join('/')
}

/** Finds a node by path, e.g. "/Home/Downloads". Case-insensitive; ignores trashed items. */
export function resolvePath(nodes: Nodes, path: string): string | null {
  const parts = path.split('/').filter(Boolean)
  if (!parts.length) return null
  const root = Object.values(nodes).find((n) => !n.parent && n.name.toLowerCase() === parts[0].toLowerCase())
  if (!root) return null
  let cur = root.id
  for (const part of parts.slice(1)) {
    const next = childrenOf(nodes, cur).find((c) => c.name === part) ??
      childrenOf(nodes, cur).find((c) => c.name.toLowerCase() === part.toLowerCase())
    if (!next) return null
    cur = next.id
  }
  return cur
}

/** "Photo.jpg" → "Photo 2.jpg" when the name is taken in that folder. */
export function uniqueName(nodes: Nodes, parentId: string, name: string, exceptId?: string): string {
  const taken = new Set(
    childrenOf(nodes, parentId)
      .filter((n) => n.id !== exceptId)
      .map((n) => n.name.toLowerCase()),
  )
  if (!taken.has(name.toLowerCase())) return name
  const dot = name.lastIndexOf('.')
  const hasExt = dot > 0
  const stem = hasExt ? name.slice(0, dot) : name
  const ext = hasExt ? name.slice(dot) : ''
  for (let i = 2; i < 1000; i++) {
    const candidate = `${stem} ${i}${ext}`
    if (!taken.has(candidate.toLowerCase())) return candidate
  }
  return `${stem} ${Date.now()}${ext}`
}

/** Every node inside a folder (not including the folder). */
export function descendants(nodes: Nodes, id: string): FileNode[] {
  const byParent = new Map<string, FileNode[]>()
  for (const key in nodes) {
    const n = nodes[key]
    if (!n.parent) continue
    const list = byParent.get(n.parent)
    if (list) list.push(n)
    else byParent.set(n.parent, [n])
  }
  const out: FileNode[] = []
  const walk = (pid: string) => {
    for (const child of byParent.get(pid) ?? []) {
      if (child.trashed) continue
      out.push(child)
      if (child.kind === 'folder') walk(child.id)
    }
  }
  walk(id)
  return out
}

/** Deep-copies a node (and its contents) into another folder. Returns the new nodes and the copy's id. */
function copySubtree(nodes: Nodes, srcId: string, targetParent: string, name?: string): { added: Nodes; rootId: string } {
  const added: Nodes = {}
  const src = nodes[srcId]
  const rootId = newId('c')
  const root: FileNode = { ...src, id: rootId, parent: targetParent, name: name ?? src.name, favorite: undefined, trashed: undefined }
  added[rootId] = root
  if (src.uploaded && blobs.has(srcId)) blobs.set(rootId, blobs.get(srcId)!)
  const map = new Map<string, string>([[srcId, rootId]])
  for (const d of descendants(nodes, srcId)) {
    const id = newId('c')
    map.set(d.id, id)
    added[id] = { ...d, id, parent: map.get(d.parent!)!, favorite: undefined }
    if (d.uploaded && blobs.has(d.id)) blobs.set(id, blobs.get(d.id)!)
  }
  return { added, rootId }
}

function findOrCreateFolder(nodes: Nodes, parentId: string, name: string): { nodes: Nodes; id: string } {
  const existing = childrenOf(nodes, parentId).find((c) => c.kind === 'folder' && c.name.toLowerCase() === name.toLowerCase())
  if (existing) return { nodes, id: existing.id }
  const id = newId('f')
  return { nodes: { ...nodes, [id]: { id, parent: parentId, name, kind: 'folder', size: 0, modified: Date.now() } }, id }
}

/** Standard folders the home screen links to; recreated if they go missing. */
export const STANDARD_HOME_FOLDERS = ['Downloads', 'Documents', 'Photos', 'Videos', 'Music', 'Imported']

const isProtected = (n: FileNode) => !n.parent || n.parent === 'external' || n.parent === 'apps'

export function canModify(nodes: Nodes, id: string): boolean {
  const n = nodes[id]
  if (!n || isProtected(n)) return false
  return rootOf(nodes, id) !== 'apps'
}

/** Can new files be written into this folder? */
export function isWritable(nodes: Nodes, folderId: string): boolean {
  const n = nodes[folderId]
  if (!n || n.kind !== 'folder' || isTrashed(nodes, folderId)) return false
  const root = rootOf(nodes, folderId)
  return root !== 'apps' && folderId !== 'external'
}

// ---------- The persisted tree ----------

export type RenameResult = 'ok' | 'taken' | 'invalid'

interface FilesState {
  nodes: Nodes
  view: ViewMode
  sort: SortPrefs
  setView: (view: ViewMode) => void
  setSort: (sort: SortPrefs) => void

  createFolder: (parentId: string, name?: string) => string
  rename: (id: string, name: string) => RenameResult
  toggleFavorite: (ids: string[], value?: boolean) => void
  markOpened: (id: string) => void
  trash: (ids: string[]) => number
  restore: (ids: string[]) => number
  deleteForever: (ids: string[]) => number
  emptyTrash: () => number
  copyTo: (ids: string[], targetId: string) => string[]
  move: (ids: string[], targetId: string) => number
  /** Makes sure a folder exists at /Home/<name>; returns its id. */
  ensureHomeFolder: (name: string) => string
  /** Adds demo folders for connected drives and installed apps we haven't seen yet. */
  ensureDrives: (drives: { id: string; name: string }[]) => void
  ensureAppFolders: (appIds: string[]) => void
  /** Adds a finished upload to the tree. */
  addUploadedFile: (parentId: string, file: File) => string
  /** Creates (or reuses) the folders for an upload and returns the leaf folder's id. */
  ensureFolders: (parentId: string, dirs: string[]) => string
  reset: () => void
}

export const useFiles = create<FilesState>()(
  persist(
    (set, get) => ({
      nodes: seedFiles(),
      view: 'grid',
      sort: { key: 'name', dir: 'asc' },
      setView: (view) => set({ view }),
      setSort: (sort) => set({ sort }),

      createFolder: (parentId, name = 'untitled folder') => {
        const id = newId('f')
        set((s) => {
          const unique = uniqueName(s.nodes, parentId, name)
          return {
            nodes: {
              ...s.nodes,
              [id]: { id, parent: parentId, name: unique, kind: 'folder', size: 0, modified: Date.now(), added: Date.now() },
            },
          }
        })
        return id
      },

      rename: (id, raw) => {
        const name = raw.trim().replace(/[/\\]/g, '-')
        const { nodes } = get()
        const node = nodes[id]
        if (!node || !name || name === '.' || name === '..') return 'invalid'
        if (name === node.name) return 'ok'
        if (node.parent && uniqueName(nodes, node.parent, name, id) !== name) return 'taken'
        set((s) => ({
          nodes: {
            ...s.nodes,
            [id]: { ...node, name, kind: node.kind === 'folder' ? 'folder' : kindFromName(name, node.mime), modified: Date.now() },
          },
        }))
        return 'ok'
      },

      toggleFavorite: (ids, value) =>
        set((s) => {
          const nodes = { ...s.nodes }
          const next = value ?? !ids.every((id) => nodes[id]?.favorite)
          for (const id of ids) if (nodes[id]) nodes[id] = { ...nodes[id], favorite: next || undefined }
          return { nodes }
        }),

      markOpened: (id) =>
        set((s) => (s.nodes[id] ? { nodes: { ...s.nodes, [id]: { ...s.nodes[id], opened: Date.now() } } } : s)),

      trash: (ids) => {
        let count = 0
        set((s) => {
          const nodes = { ...s.nodes }
          for (const id of ids) {
            const n = nodes[id]
            if (!n || !n.parent || !canModify(s.nodes, id) || n.trashed) continue
            const parentPath = pathOf(s.nodes, n.parent)
            nodes[id] = { ...n, trashed: { at: Date.now(), from: n.parent, path: parentPath } }
            count++
          }
          return { nodes }
        })
        return count
      },

      restore: (ids) => {
        let count = 0
        set((s) => {
          const nodes = { ...s.nodes }
          for (const id of ids) {
            const n = nodes[id]
            if (!n?.trashed) continue
            // Put it back where it came from, or in Home if that folder is gone.
            const back = nodes[n.trashed.from] && !isTrashed(nodes, n.trashed.from) ? n.trashed.from : 'home'
            const { trashed: _, ...rest } = n
            nodes[id] = { ...rest, parent: back, name: uniqueName(nodes, back, n.name, id) }
            count++
          }
          return { nodes }
        })
        return count
      },

      deleteForever: (ids) => {
        let count = 0
        set((s) => {
          const nodes = { ...s.nodes }
          for (const id of ids) {
            if (!nodes[id] || !canModify(s.nodes, id)) continue
            for (const d of [nodes[id], ...descendants(s.nodes, id)]) {
              dropBlob(d.id)
              delete nodes[d.id]
            }
            count++
          }
          // Sweep up anything left inside deleted folders (e.g. items trashed from within them earlier).
          let orphans = true
          while (orphans) {
            orphans = false
            for (const key in nodes) {
              const parent = nodes[key].parent
              if (parent && !nodes[parent]) {
                dropBlob(key)
                delete nodes[key]
                orphans = true
              }
            }
          }
          return { nodes }
        })
        return count
      },

      emptyTrash: () => {
        const ids = Object.values(get().nodes)
          .filter((n) => n.trashed)
          .map((n) => n.id)
        return get().deleteForever(ids)
      },

      copyTo: (ids, targetId) => {
        const created: string[] = []
        set((s) => {
          let nodes = s.nodes
          for (const id of ids) {
            if (!nodes[id] || isDescendant(nodes, targetId, id)) continue
            const { added, rootId } = copySubtree(nodes, id, targetId, uniqueName(nodes, targetId, nodes[id].name))
            added[rootId] = { ...added[rootId], added: Date.now() }
            nodes = { ...nodes, ...added }
            created.push(rootId)
          }
          return { nodes }
        })
        return created
      },

      move: (ids, targetId) => {
        let count = 0
        set((s) => {
          const nodes = { ...s.nodes }
          for (const id of ids) {
            const n = nodes[id]
            if (!n || n.parent === targetId || !canModify(nodes, id) || isDescendant(nodes, targetId, id)) continue
            nodes[id] = { ...n, parent: targetId, name: uniqueName(nodes, targetId, n.name, id) }
            count++
          }
          return { nodes }
        })
        return count
      },

      ensureHomeFolder: (name) => {
        const existing = childrenOf(get().nodes, 'home').find((c) => c.kind === 'folder' && c.name === name)
        if (existing) return existing.id
        const result = findOrCreateFolder(get().nodes, 'home', name)
        set({ nodes: result.nodes })
        return result.id
      },

      ensureDrives: (drives) => {
        const { nodes } = get()
        let next = nodes
        for (const d of drives) {
          const id = driveFolderId(d.id)
          if (!next[id]) next = { ...next, ...seedDrive(d.id, d.name) }
          else if (next[id].name !== d.name) next = { ...next, [id]: { ...next[id], name: d.name } }
        }
        if (next !== nodes) set({ nodes: next })
      },

      ensureAppFolders: (appIds) => {
        const { nodes } = get()
        const have = new Set(childrenOf(nodes, 'apps').map((n) => n.name))
        const missing = appIds.filter((id) => !have.has(id))
        if (!missing.length) return
        let next = { ...nodes }
        for (const id of missing) next = { ...next, ...seedAppFolder(id) }
        set({ nodes: next })
      },

      addUploadedFile: (parentId, file) => {
        const id = newId('u')
        blobs.set(id, file)
        set((s) => {
          const parent = s.nodes[parentId] && !isTrashed(s.nodes, parentId) ? parentId : 'home'
          const name = uniqueName(s.nodes, parent, file.name)
          const now = Date.now()
          return {
            nodes: {
              ...s.nodes,
              [id]: {
                id,
                parent,
                name,
                kind: kindFromName(name, file.type),
                size: file.size,
                modified: file.lastModified || now,
                uploaded: true,
                mime: file.type || undefined,
                added: now,
              },
            },
          }
        })
        return id
      },

      ensureFolders: (parentId, dirs) => {
        let nodes = get().nodes
        let cur = parentId
        for (const dir of dirs) {
          const result = findOrCreateFolder(nodes, cur, dir)
          nodes = result.nodes
          cur = result.id
        }
        if (nodes !== get().nodes) set({ nodes })
        return cur
      },

      reset: () => {
        for (const id of [...blobs.keys()]) dropBlob(id)
        set({ nodes: seedFiles() })
      },
    }),
    {
      name: 'plumos:files',
      version: 1,
      partialize: (s) => ({ nodes: s.nodes, view: s.view, sort: s.sort }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<FilesState>
        const nodes = p.nodes && typeof p.nodes === 'object' && p.nodes.home ? p.nodes : current.nodes
        return { ...current, ...p, nodes }
      },
    },
  ),
)

// ---------- Transfers: uploads and drive imports (not persisted) ----------

export interface UploadItem {
  id: string
  name: string
  size: number
  loaded: number
  kind: FileKind
  /** Folder the file lands in. */
  folderId: string
  status: 'queued' | 'uploading' | 'done'
  /** Simulated bytes per second. */
  rate: number
  /** The network speed we show (tiny files finish too fast to measure). */
  speed: number
  nodeId?: string
}

export interface ImportJob {
  driveId: string
  driveName: string
  total: number
  copied: number
  bytes: number
  totalBytes: number
  current: string
  status: 'copying' | 'done'
  targetId?: string
}

export interface UploadEntry {
  file: File
  /** Folders between the drop target and the file, e.g. ['Trip', 'Day 1']. */
  dirs: string[]
}

interface TransfersState {
  uploads: UploadItem[]
  /** Where the latest batch went, for the tray's "Show" button. */
  lastTarget: string | null
  imports: Record<string, ImportJob>
  upload: (targetId: string, entries: UploadEntry[]) => void
  clearFinished: () => void
  importDrive: (driveId: string) => void
  cancelImport: (driveId: string) => void
}

const MB = 1e6
const CONCURRENCY = 3
const pendingFiles = new Map<string, File>()
let uploadTimer: ReturnType<typeof setInterval> | null = null
let batchStats = { count: 0, target: '' }

export const useTransfers = create<TransfersState>()((set, get) => ({
  uploads: [],
  lastTarget: null,
  imports: {},

  upload: (targetId, entries) => {
    if (!entries.length) return
    const files = useFiles.getState()
    const items: UploadItem[] = []
    const folderCache = new Map<string, string>()
    for (const { file, dirs } of entries) {
      const key = dirs.join('/')
      let folderId = folderCache.get(key)
      if (!folderId) {
        folderId = dirs.length ? files.ensureFolders(targetId, dirs) : targetId
        folderCache.set(key, folderId)
      }
      const id = newId('up')
      pendingFiles.set(id, file)
      // Gigabit-ish speeds, but never so slow the demo drags on.
      const base = (38 + Math.random() * 74) * MB
      const rate = Math.min(Math.max(base, file.size / 7), Math.max(file.size / 0.5, 1))
      const speed = Math.max(base, file.size / 7)
      items.push({ id, name: file.name, size: file.size, loaded: 0, kind: kindFromName(file.name, file.type), folderId, status: 'queued', rate, speed })
    }
    batchStats = {
      count: (get().uploads.some((u) => u.status !== 'done') ? batchStats.count : 0) + items.length,
      target: targetId,
    }
    set((s) => ({ uploads: [...s.uploads.filter((u) => u.status !== 'done'), ...items], lastTarget: targetId }))
    startUploadTimer()
  },

  clearFinished: () => set((s) => ({ uploads: s.uploads.filter((u) => u.status !== 'done') })),

  importDrive: (driveId) => {
    if (get().imports[driveId]?.status === 'copying') return
    const nodes = useFiles.getState().nodes
    const rootId = driveFolderId(driveId)
    const root = nodes[rootId]
    if (!root) return
    const list = descendants(nodes, rootId).filter((n) => n.kind !== 'folder')
    const totalBytes = list.reduce((a, n) => a + n.size, 0)
    const job: ImportJob = {
      driveId,
      driveName: root.name,
      total: list.length,
      copied: 0,
      bytes: 0,
      totalBytes,
      current: list[0]?.name ?? '',
      status: 'copying',
    }
    set((s) => ({ imports: { ...s.imports, [driveId]: job } }))

    // USB 3 speeds, squeezed into a few seconds for the demo.
    const duration = Math.min(8, Math.max(3.5, totalBytes / (140 * MB)))
    const perSecond = totalBytes / duration
    let bytes = 0
    let last = performance.now()
    const timer = setInterval(() => {
      const current = get().imports[driveId]
      if (!current || current.status !== 'copying') {
        clearInterval(timer)
        return
      }
      const now = performance.now()
      bytes = Math.min(totalBytes, bytes + perSecond * ((now - last) / 1000) * (0.7 + Math.random() * 0.6))
      last = now
      let acc = 0
      let copied = 0
      while (copied < list.length && acc + list[copied].size <= bytes) acc += list[copied++].size
      if (bytes >= totalBytes) {
        clearInterval(timer)
        finishImport(driveId, rootId)
        return
      }
      set((s) => ({
        imports: { ...s.imports, [driveId]: { ...current, bytes, copied, current: list[copied]?.name ?? current.current } },
      }))
    }, 90)
  },

  cancelImport: (driveId) =>
    set((s) => {
      const { [driveId]: _, ...rest } = s.imports
      return { imports: rest }
    }),
}))

function finishImport(driveId: string, rootId: string) {
  const files = useFiles.getState()
  const imported = files.ensureHomeFolder('Imported')
  const nodes = useFiles.getState().nodes
  const src = nodes[rootId]
  if (!src) return
  const { added, rootId: copyId } = copySubtree(nodes, rootId, imported, uniqueName(nodes, imported, src.name))
  const count = Object.values(added).filter((n) => n.kind !== 'folder').length
  added[copyId] = { ...added[copyId], added: Date.now() }
  useFiles.setState((s) => ({ nodes: { ...s.nodes, ...added } }))
  useTransfers.setState((s) => {
    const job = s.imports[driveId]
    return job
      ? { imports: { ...s.imports, [driveId]: { ...job, status: 'done', copied: job.total, bytes: job.totalBytes, targetId: copyId } } }
      : s
  })
  toast(`Imported ${count.toLocaleString()} files`, { description: `${src.name} is now in Imported. Nothing on the drive changed.` })
}

function startUploadTimer() {
  if (uploadTimer) return
  let last = performance.now()
  uploadTimer = setInterval(() => {
    const now = performance.now()
    const dt = (now - last) / 1000
    last = now
    const { uploads } = useTransfers.getState()
    let active = uploads.filter((u) => u.status === 'uploading').length
    const finished: UploadItem[] = []
    const next = uploads.map((u) => {
      if (u.status === 'done') return u
      if (u.status === 'queued') {
        if (active >= CONCURRENCY) return u
        active++
        return { ...u, status: 'uploading' as const }
      }
      const loaded = Math.min(u.size, u.loaded + u.rate * dt * (0.75 + Math.random() * 0.5))
      if (loaded >= u.size) {
        const done = { ...u, loaded: u.size, status: 'done' as const }
        finished.push(done)
        return done
      }
      return { ...u, loaded }
    })

    for (const u of finished) {
      const file = pendingFiles.get(u.id)
      pendingFiles.delete(u.id)
      if (file) u.nodeId = useFiles.getState().addUploadedFile(u.folderId, file)
    }
    useTransfers.setState({ uploads: next })

    if (!next.some((u) => u.status !== 'done')) {
      clearInterval(uploadTimer!)
      uploadTimer = null
      const target = useFiles.getState().nodes[batchStats.target]
      const where = target ? displayName(target) : 'your files'
      const n = batchStats.count
      toast('Upload complete', { description: `${n.toLocaleString()} ${n === 1 ? 'item' : 'items'} added to ${where}.` })
    }
  }, 100)
}

/** Display name for a node; the Home root is named after the person signed in. */
export function displayName(node: FileNode, userName?: string): string {
  if (node.id === 'home') return userName ?? (useSettings.getState().userName || 'Home')
  return node.name
}
