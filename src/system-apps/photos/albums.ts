import type { Photo } from '@/lib/photos'
import type { UserAlbum } from '@/stores/photos'

export type SmartAlbumId = 'favorites' | 'videos' | 'old-drive' | 'screenshots' | 'family'

export interface AlbumView {
  id: string
  name: string
  kind: 'smart' | 'user'
  photos: Photo[]
}

export const SMART_ALBUMS: { id: SmartAlbumId; name: string; test: (p: Photo) => boolean }[] = [
  { id: 'favorites', name: 'Favorites', test: (p) => p.favorite },
  { id: 'videos', name: 'Videos', test: (p) => Boolean(p.video) },
  { id: 'old-drive', name: 'Imported from Old Backup Drive', test: (p) => p.source === 'drive' },
  { id: 'screenshots', name: 'Screenshots', test: (p) => p.scene === 'screenshot' },
  { id: 'family', name: 'Family', test: (p) => p.owner === 'shared' },
]

/** Smart albums (computed) and the person's own albums, each with its photos newest first. */
export function buildAlbums(library: Photo[], userAlbums: UserAlbum[]) {
  const smart: AlbumView[] = SMART_ALBUMS.map((a) => ({ id: a.id, name: a.name, kind: 'smart', photos: library.filter(a.test) }))
  const byId = new Map(library.map((p) => [p.id, p]))
  const mine: AlbumView[] = userAlbums.map((a) => ({
    id: a.id,
    name: a.name,
    kind: 'user',
    photos: a.photoIds
      .map((id) => byId.get(id))
      .filter((p): p is Photo => Boolean(p))
      .sort((x, y) => y.date - x.date),
  }))
  return { smart, mine }
}
