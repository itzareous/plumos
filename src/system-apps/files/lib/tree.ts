import {
  ancestry,
  childrenOf,
  descendants,
  displayName,
  isTrashed,
  rootOf,
  type FileNode,
  type SortPrefs,
} from '@/stores/files'
import { KIND_ORDER } from './kinds'

/** Where the Files window is looking: a folder id, or one of the smart views. */
export type Loc = string

export const RECENTS = '@recents'
export const FAVORITES = '@favorites'
export const TRASH = '@trash'
export const isSmart = (loc: Loc) => loc.startsWith('@')

type Nodes = Record<string, FileNode>

export interface FolderStats {
  /** Total bytes inside, recursively. */
  bytes: number
  /** Direct children. */
  count: number
}

/** Sizes and item counts for every folder, in one pass. */
export function folderStats(nodes: Nodes): Map<string, FolderStats> {
  const byParent = new Map<string, FileNode[]>()
  for (const key in nodes) {
    const n = nodes[key]
    if (!n.parent || n.trashed) continue
    const list = byParent.get(n.parent)
    if (list) list.push(n)
    else byParent.set(n.parent, [n])
  }
  const stats = new Map<string, FolderStats>()
  const visit = (node: FileNode): number => {
    if (node.kind !== 'folder') return node.size
    const kids = byParent.get(node.id) ?? []
    let bytes = 0
    for (const k of kids) bytes += visit(k)
    stats.set(node.id, { bytes, count: kids.length })
    return bytes
  }
  for (const key in nodes) if (!nodes[key].parent) visit(nodes[key])
  // Folders that are in the Trash still get stats for Get Info.
  for (const key in nodes) if (nodes[key].trashed && nodes[key].kind === 'folder') visit(nodes[key])
  return stats
}

const recency = (n: FileNode) => Math.max(n.modified, n.opened ?? 0, n.added ?? 0)

/** The items a location shows, before sorting. */
export function listItems(nodes: Nodes, loc: Loc, query: string): FileNode[] {
  const q = query.trim().toLowerCase()
  const match = (n: FileNode) => !q || n.name.toLowerCase().includes(q)

  if (loc === TRASH) {
    return Object.values(nodes)
      .filter((n) => n.trashed && match(n))
      .sort((a, b) => b.trashed!.at - a.trashed!.at)
  }
  if (loc === FAVORITES) {
    return Object.values(nodes).filter((n) => n.favorite && !isTrashed(nodes, n.id) && match(n))
  }
  if (loc === RECENTS) {
    return Object.values(nodes)
      .filter((n) => {
        if (n.kind === 'folder' || !match(n)) return false
        const root = rootOf(nodes, n.id)
        return (root === 'home' || root === 'shared') && !isTrashed(nodes, n.id)
      })
      .sort((a, b) => recency(b) - recency(a))
      .slice(0, 60)
  }
  if (!nodes[loc]) return []
  // Searching looks through everything inside the folder, not just the top level.
  return q ? descendants(nodes, loc).filter(match) : childrenOf(nodes, loc)
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

export function sortItems(items: FileNode[], sort: SortPrefs, stats: Map<string, FolderStats>): FileNode[] {
  const dir = sort.dir === 'asc' ? 1 : -1
  const size = (n: FileNode) => (n.kind === 'folder' ? (stats.get(n.id)?.bytes ?? 0) : n.size)
  const compare = (a: FileNode, b: FileNode): number => {
    switch (sort.key) {
      case 'modified':
        return a.modified - b.modified
      case 'size':
        return size(a) - size(b)
      case 'kind':
        return KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || collator.compare(a.name, b.name)
      default:
        return collator.compare(a.name, b.name)
    }
  }
  return [...items].sort((a, b) => {
    // Folders first, like most file managers.
    const fa = a.kind === 'folder' ? 0 : 1
    const fb = b.kind === 'folder' ? 0 : 1
    if (fa !== fb) return fa - fb
    return compare(a, b) * dir || collator.compare(a.name, b.name)
  })
}

/** "Milo › Documents › Work" for the folder that holds a node. */
export function locationLabel(nodes: Nodes, id: string, userName: string): string {
  const node = nodes[id]
  if (!node) return ''
  if (node.trashed) return node.trashed.path.split('/').filter(Boolean).map((p, i) => (i === 0 && p === 'Home' ? userName : p)).join(' › ')
  return ancestry(nodes, id)
    .slice(0, -1)
    .map((n) => displayName(n, userName))
    .join(' › ')
}

/** Stable number from a string, for generated artwork. */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function formatFileDate(ts: number, withTime = true): string {
  const d = new Date(ts)
  const now = new Date()
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (ts >= startOfDay) return withTime ? `Today at ${time}` : 'Today'
  if (ts >= startOfDay - 864e5) return withTime ? `Yesterday at ${time}` : 'Yesterday'
  if (d.getFullYear() === now.getFullYear()) {
    const day = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return withTime ? `${day} at ${time}` : day
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export const itemsLabel = (n: number) => `${n.toLocaleString()} ${n === 1 ? 'item' : 'items'}`
