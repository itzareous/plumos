import { useCallback, useEffect, useRef, useState } from 'react'
import { ancestry, isTrashed, useFiles } from '@/stores/files'
import type { Drive } from '@/stores/storage'
import { useHistoryNav } from './hooks'
import { driveFolderId } from './seed'
import { resolveTarget } from './target'
import { isSmart, type Loc } from './tree'

/**
 * Where the browser is looking: back/forward history, the search box, and
 * `params.path` from the home screen's folder shortcuts (followed again when
 * it changes while Files is open).
 */
export function useLocation(path: string | undefined, drives: Drive[], onLeave: () => void) {
  const nodes = useFiles((s) => s.nodes)
  const [initial] = useState(() => resolveTarget(path))
  const nav = useHistoryNav(initial.loc)
  const { loc, replace, go: push } = nav
  const [query, setQuery] = useState('')
  /** An item to select once the new location has rendered (e.g. the folder we came up from). */
  const pendingSelect = useRef<string | null>(initial.select ?? null)
  const leave = useRef(onLeave)
  useEffect(() => {
    leave.current = onLeave
  })

  const go = useCallback(
    (next: Loc, select?: string) => {
      setQuery('')
      leave.current()
      pendingSelect.current = select ?? null
      push(next)
    },
    [push],
  )

  // A standard folder the home screen links to was deleted: make it again.
  useEffect(() => {
    if (initial.missing) replace(useFiles.getState().ensureHomeFolder(initial.missing))
  }, [initial, replace])

  // Opened again with a different path while already open.
  const lastPath = useRef(path)
  useEffect(() => {
    if (path === lastPath.current) return
    lastPath.current = path
    const target = resolveTarget(path)
    go(target.missing ? useFiles.getState().ensureHomeFolder(target.missing) : target.loc, target.select)
  }, [path, go])

  // The folder went away (trashed, deleted, its drive ejected): fall back to Home.
  useEffect(() => {
    if (isSmart(loc)) return
    const chain = nodes[loc] ? ancestry(nodes, loc) : []
    const driveGone = chain[0]?.id === 'external' && !drives.some((d) => driveFolderId(d.id) === chain[1]?.id)
    if (!chain.length || loc === 'external' || isTrashed(nodes, loc) || driveGone) replace('home')
  }, [nodes, loc, drives, replace])

  return { ...nav, go, query, setQuery, pendingSelect }
}
