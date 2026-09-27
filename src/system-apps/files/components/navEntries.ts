import { Boxes, Clock, HardDrive, House, Star, Trash2, Users, type LucideIcon } from 'lucide-react'
import { ancestry, type FileNode } from '@/stores/files'
import type { Drive } from '@/stores/storage'
import { driveFolderId } from '../lib/seed'
import { FAVORITES, RECENTS, TRASH, isSmart, type Loc } from '../lib/tree'

export interface NavEntry {
  loc: Loc
  label: string
  icon: LucideIcon
  group: 'places' | 'locations' | 'apps'
  count?: number
  drive?: Drive
  title?: string
}

export function navEntries(userName: string, drives: Drive[], trashCount: number): NavEntry[] {
  return [
    { loc: 'home', label: userName, icon: House, group: 'places', title: 'Your private files' },
    { loc: 'shared', label: 'Shared', icon: Users, group: 'places', title: 'Files everyone at home can see' },
    { loc: RECENTS, label: 'Recents', icon: Clock, group: 'places' },
    { loc: FAVORITES, label: 'Favorites', icon: Star, group: 'places' },
    { loc: TRASH, label: 'Trash', icon: Trash2, group: 'places', count: trashCount || undefined },
    ...drives.map<NavEntry>((d) => ({ loc: driveFolderId(d.id), label: d.name, icon: HardDrive, group: 'locations', drive: d })),
    { loc: 'apps', label: 'App data', icon: Boxes, group: 'apps', title: 'Data your apps keep on this server' },
  ]
}

/** Which sidebar entry a location belongs to (a folder inside Home lights up Home). */
export function activeEntry(nodes: Record<string, FileNode>, loc: Loc): Loc {
  if (isSmart(loc)) return loc
  const chain = ancestry(nodes, loc)
  if (chain[0]?.id === 'external') return chain[1]?.id ?? loc
  return chain[0]?.id ?? loc
}
