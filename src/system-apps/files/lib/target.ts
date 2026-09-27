import { resolvePath, STANDARD_HOME_FOLDERS, useFiles } from '@/stores/files'
import { FAVORITES, RECENTS, TRASH, type Loc } from './tree'

export interface Target {
  loc: Loc
  /** A file the path pointed at; it gets selected in its folder. */
  select?: string
  /** A standard Home folder that needs recreating first. */
  missing?: string
}

const SMART: Record<string, Loc> = { '/recents': RECENTS, '/favorites': FAVORITES, '/trash': TRASH }

/** Turns a `params.path` like "/Home/Downloads" into somewhere to look. */
export function resolveTarget(path?: string): Target {
  if (!path) return { loc: 'home' }
  const clean = path.trim().replace(/\/+$/, '') || '/'
  const smart = SMART[clean.toLowerCase()]
  if (smart) return { loc: smart }

  const { nodes } = useFiles.getState()
  let id = resolvePath(nodes, clean)
  if (!id) {
    const m = clean.match(/^\/home\/([^/]+)$/i)
    const standard = m && STANDARD_HOME_FOLDERS.find((n) => n.toLowerCase() === m[1].toLowerCase())
    if (standard) return { loc: 'home', missing: standard }
    // Fall back to the nearest folder that does exist.
    const parts = clean.split('/').filter(Boolean)
    while (!id && parts.length > 1) {
      parts.pop()
      id = resolvePath(nodes, '/' + parts.join('/'))
    }
  }
  if (!id || id === 'external') return { loc: 'home' }
  const node = nodes[id]
  if (node.kind !== 'folder') return { loc: node.parent ?? 'home', select: id }
  return { loc: id }
}
