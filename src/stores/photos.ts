import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEMO_ALBUMS,
  OLD_DRIVE_COUNT,
  demoLibrary,
  makeBackupPhoto,
  makeDrivePhotos,
  photoFromFile,
  type Photo,
} from '@/lib/photos'

/**
 * The Photos library. Demo photos are generated from seeds (see lib/photos);
 * this store layers the person's changes on top: favourites, deletions,
 * albums, the family space, and photos that arrive from the phone backup,
 * the old USB drive or files dropped onto the window.
 */

export interface UserAlbum {
  id: string
  name: string
  createdAt: number
  photoIds: string[]
}

export interface BackupState {
  status: 'idle' | 'running' | 'done'
  done: number
  total: number
  device: string
  finishedAt?: number
}

export interface DriveImportState {
  status: 'idle' | 'running' | 'done'
  done: number
  total: number
  driveId?: string
  driveName?: string
  finishedAt?: number
}

export const DENSITIES = 4

interface PhotosState {
  added: Photo[]
  deleted: Record<string, number>
  favorites: Record<string, boolean>
  owners: Record<string, 'me' | 'shared'>
  albums: UserAlbum[]
  density: number
  backup: BackupState
  driveImport: DriveImportState

  setDensity: (density: number) => void
  setFavorite: (ids: string[], value: boolean) => void
  remove: (ids: string[]) => void
  restore: (ids: string[]) => void
  setOwner: (ids: string[], owner: 'me' | 'shared') => void
  createAlbum: (name: string, photoIds?: string[]) => UserAlbum
  addToAlbum: (albumId: string, photoIds: string[]) => void
  removeFromAlbum: (albumId: string, photoIds: string[]) => void
  renameAlbum: (albumId: string, name: string) => void
  deleteAlbum: (albumId: string) => UserAlbum | undefined
  restoreAlbum: (album: UserAlbum) => void
  addFiles: (files: File[]) => Promise<Photo[]>
  startBackup: (device: string) => void
  startDriveImport: (driveId: string, driveName: string) => void
}

const seededAlbums = (): UserAlbum[] => {
  const lib = demoLibrary()
  return DEMO_ALBUMS.map((a, i) => ({
    id: a.id,
    name: a.name,
    createdAt: Date.now() - (i + 1) * 30 * 86400e3,
    photoIds: lib.filter((p) => p.albums.includes(a.id)).map((p) => p.id),
  }))
}

const idleBackup: BackupState = { status: 'idle', done: 0, total: 0, device: '' }
const idleImport: DriveImportState = { status: 'idle', done: 0, total: 0 }

let backupTimer: ReturnType<typeof setTimeout> | null = null
let importTimer: ReturnType<typeof setTimeout> | null = null

export const usePhotos = create<PhotosState>()(
  persist(
    (set, get) => ({
      added: [],
      deleted: {},
      favorites: {},
      owners: {},
      albums: seededAlbums(),
      density: 2,
      backup: idleBackup,
      driveImport: idleImport,

      setDensity: (density) => set({ density: Math.max(0, Math.min(DENSITIES - 1, density)) }),

      setFavorite: (ids, value) =>
        set((s) => {
          const favorites = { ...s.favorites }
          for (const id of ids) favorites[id] = value
          return { favorites }
        }),

      remove: (ids) =>
        set((s) => {
          const deleted = { ...s.deleted }
          const now = Date.now()
          for (const id of ids) deleted[id] = now
          return { deleted }
        }),

      restore: (ids) =>
        set((s) => {
          const deleted = { ...s.deleted }
          for (const id of ids) delete deleted[id]
          return { deleted }
        }),

      setOwner: (ids, owner) =>
        set((s) => {
          const owners = { ...s.owners }
          for (const id of ids) owners[id] = owner
          return { owners }
        }),

      createAlbum: (name, photoIds = []) => {
        const album: UserAlbum = {
          id: `album-${Date.now().toString(36)}`,
          name: name.trim() || 'Untitled Album',
          createdAt: Date.now(),
          photoIds: [...new Set(photoIds)],
        }
        set((s) => ({ albums: [album, ...s.albums] }))
        return album
      },

      addToAlbum: (albumId, photoIds) =>
        set((s) => ({
          albums: s.albums.map((a) => (a.id === albumId ? { ...a, photoIds: [...new Set([...a.photoIds, ...photoIds])] } : a)),
        })),

      removeFromAlbum: (albumId, photoIds) =>
        set((s) => ({
          albums: s.albums.map((a) => (a.id === albumId ? { ...a, photoIds: a.photoIds.filter((id) => !photoIds.includes(id)) } : a)),
        })),

      renameAlbum: (albumId, name) =>
        set((s) => ({ albums: s.albums.map((a) => (a.id === albumId ? { ...a, name: name.trim() || a.name } : a)) })),

      deleteAlbum: (albumId) => {
        const album = get().albums.find((a) => a.id === albumId)
        set((s) => ({ albums: s.albums.filter((a) => a.id !== albumId) }))
        return album
      },

      restoreAlbum: (album) => set((s) => ({ albums: [album, ...s.albums.filter((a) => a.id !== album.id)] })),

      addFiles: async (files) => {
        const photos = (await Promise.all(files.map((f) => photoFromFile(f)))).filter((p): p is Photo => Boolean(p))
        if (photos.length) set((s) => ({ added: [...photos, ...s.added] }))
        return photos
      },

      startBackup: (device) => {
        if (get().backup.status === 'running') return
        // The phone already has most of its camera roll on the server; the rest trickles in.
        const total = 1390
        let done = 1162
        let n = get().added.filter((p) => p.source === 'phone').length
        set({ backup: { status: 'running', done, total, device } })
        const tick = () => {
          const step = Math.min(total - done, 4 + Math.floor(Math.random() * 5))
          done += step
          const photo = makeBackupPhoto(n++, Date.now())
          set((s) => ({ added: [photo, ...s.added], backup: { ...s.backup, done } }))
          if (done >= total) {
            set((s) => ({ backup: { ...s.backup, status: 'done', done: total, finishedAt: Date.now() } }))
            backupTimer = null
            return
          }
          backupTimer = setTimeout(tick, 320 + Math.random() * 260)
        }
        if (backupTimer) clearTimeout(backupTimer)
        backupTimer = setTimeout(tick, 900)
      },

      startDriveImport: (driveId, driveName) => {
        if (get().driveImport.status === 'running') return
        const existing = new Set(get().added.map((p) => p.id))
        const photos = makeDrivePhotos(driveId).filter((p) => !existing.has(p.id))
        const total = photos.length || OLD_DRIVE_COUNT
        let done = 0
        set({ driveImport: { status: 'running', done: 0, total, driveId, driveName } })
        const tick = () => {
          const batch = photos.slice(done, done + 3).map((p) => ({ ...p, addedAt: Date.now() }))
          done += batch.length
          set((s) => ({ added: [...s.added, ...batch], driveImport: { ...s.driveImport, done } }))
          if (done >= photos.length) {
            set((s) => ({ driveImport: { ...s.driveImport, status: 'done', done: total, finishedAt: Date.now() } }))
            importTimer = null
            return
          }
          importTimer = setTimeout(tick, 60 + Math.random() * 60)
        }
        if (importTimer) clearTimeout(importTimer)
        importTimer = setTimeout(tick, 500)
      },
    }),
    {
      name: 'plumos:photos',
      version: 1,
      partialize: (s) => ({
        // Files from this computer live in object URLs, which don't survive a reload.
        added: s.added.filter((p) => !p.url).map(({ addedAt: _, ...p }) => p),
        deleted: s.deleted,
        favorites: s.favorites,
        owners: s.owners,
        albums: s.albums,
        density: s.density,
        backup: s.backup.status === 'done' ? s.backup : idleBackup,
        driveImport: s.driveImport.status === 'done' ? s.driveImport : idleImport,
      }),
    },
  ),
)

// ---------------------------------------------------------------------------
// Derived data

const EMPTY: string[] = []
const derived = new Map<string, { src: Photo; favorite: boolean; owner: Photo['owner']; albums: string[]; out: Photo }>()
let memo: { keys: unknown[]; value: Photo[] } | null = null

/**
 * The merged library, newest first. Memoised on the pieces of state it reads,
 * and each photo object stays referentially stable while nothing about it
 * changes, so memoised tiles don't re-render.
 */
export function selectLibrary(s: Pick<PhotosState, 'added' | 'deleted' | 'favorites' | 'owners' | 'albums'>): Photo[] {
  const keys = [s.added, s.deleted, s.favorites, s.owners, s.albums]
  if (memo && memo.keys.every((k, i) => k === keys[i])) return memo.value
  const membership = new Map<string, string[]>()
  for (const a of s.albums) {
    for (const id of a.photoIds) {
      const list = membership.get(id)
      if (list) list.push(a.id)
      else membership.set(id, [a.id])
    }
  }
  const out: Photo[] = []
  const push = (p: Photo) => {
    if (s.deleted[p.id]) return
    const favorite = s.favorites[p.id] ?? p.favorite
    const owner = s.owners[p.id] ?? p.owner
    const albums = membership.get(p.id) ?? EMPTY
    const prev = derived.get(p.id)
    if (prev && prev.src === p && prev.favorite === favorite && prev.owner === owner && sameList(prev.albums, albums)) {
      out.push(prev.out)
      return
    }
    const next = { ...p, favorite, owner, albums }
    derived.set(p.id, { src: p, favorite, owner, albums, out: next })
    out.push(next)
  }
  for (const p of s.added) push(p)
  for (const p of demoLibrary()) push(p)
  out.sort((a, b) => b.date - a.date)
  memo = { keys, value: out }
  return out
}

function sameList(a: string[], b: string[]) {
  return a.length === b.length && a.every((x, i) => x === b[i])
}

export const useLibrary = () => usePhotos(selectLibrary)

/** Photos currently in the Recently Deleted bin, newest deletion first. */
export function selectDeleted(s: Pick<PhotosState, 'added' | 'deleted'>): Photo[] {
  const ids = s.deleted
  return [...s.added, ...demoLibrary()].filter((p) => ids[p.id]).sort((a, b) => ids[b.id] - ids[a.id])
}
