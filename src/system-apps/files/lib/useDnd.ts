import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { isWritable, useFiles } from '@/stores/files'
import type { BindDrop, DropHandlers } from '../components/Sidebar'
import { dragHasFiles, INTERNAL_DRAG, readDrop, type DroppedTree } from './io'
import { FAVORITES, RECENTS, TRASH, type Loc } from './tree'

interface DndOptions {
  /** Where files dropped on empty space go. */
  fallbackTarget: string
  onUpload: (tree: DroppedTree, target: string) => void
  onMove: (ids: string[], target: string) => void
  onTrash: (ids: string[]) => void
  onFavorite: (ids: string[]) => void
}

const isInternal = (e: DragEvent) => Array.from(e.dataTransfer.types).includes(INTERNAL_DRAG)

/**
 * Drag and drop: files from the computer anywhere on the window (uploads),
 * and items dragged onto folders, sidebar places or breadcrumbs (moves).
 */
export function useDnd(opts: DndOptions) {
  const [external, setExternal] = useState(false)
  const [dropTarget, setDropTarget] = useState<Loc | null>(null)
  const depth = useRef(0)
  const dragging = useRef<string[]>([])
  const optsRef = useRef(opts)
  useEffect(() => {
    optsRef.current = opts
  })

  const end = useCallback(() => {
    depth.current = 0
    setExternal(false)
    setDropTarget(null)
  }, [])

  /** Can this drag land on that place? */
  const accepts = (target: Loc, e: DragEvent) => {
    const internal = isInternal(e)
    if (!internal && !dragHasFiles(e)) return false
    if (target === RECENTS) return false
    if (target === TRASH || target === FAVORITES) return internal
    const nodes = useFiles.getState().nodes
    if (!isWritable(nodes, target)) return false
    // Can't drop a folder into itself.
    return !(internal && dragging.current.includes(target))
  }

  const land = (target: Loc, e: DragEvent) => {
    const o = optsRef.current
    if (isInternal(e)) {
      let ids = dragging.current
      try {
        ids = JSON.parse(e.dataTransfer.getData(INTERNAL_DRAG)) as string[]
      } catch {
        // Fall back to what we recorded at drag start.
      }
      if (target === TRASH) o.onTrash(ids)
      else if (target === FAVORITES) o.onFavorite(ids)
      else o.onMove(ids, target)
    } else {
      void readDrop(e.dataTransfer).then((tree) => o.onUpload(tree, target))
    }
  }

  // Handlers only read refs and stable setters, so each target's set is made once.
  const cache = useRef(new Map<Loc, DropHandlers>())
  const bindDrop: BindDrop = (target) => {
    const cached = cache.current.get(target)
    if (cached) return cached
    const handlers: DropHandlers = {
      onDragOver: (e) => {
        if (!accepts(target, e)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = isInternal(e) ? 'move' : 'copy'
        setDropTarget(target)
      },
      onDragLeave: (e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        setDropTarget((t) => (t === target ? null : t))
      },
      onDrop: (e) => {
        if (!accepts(target, e)) return
        e.preventDefault()
        e.stopPropagation()
        land(target, e)
        end()
      },
    }
    cache.current.set(target, handlers)
    return handlers
  }

  /** For the whole window: shows the overlay for files from the computer. */
  const rootHandlers = {
    onDragEnter: (e: DragEvent) => {
      if (!dragHasFiles(e) || isInternal(e)) return
      e.preventDefault()
      depth.current++
      setExternal(true)
    },
    onDragOver: (e: DragEvent) => {
      if (!dragHasFiles(e) || isInternal(e)) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    },
    onDragLeave: (e: DragEvent) => {
      if (!dragHasFiles(e) || isInternal(e)) return
      depth.current = Math.max(0, depth.current - 1)
      if (depth.current === 0) {
        setExternal(false)
        setDropTarget(null)
      }
    },
    onDrop: (e: DragEvent) => {
      if (!dragHasFiles(e) || isInternal(e)) return
      e.preventDefault()
      land(optsRef.current.fallbackTarget, e)
      end()
    },
  }

  const startItemDrag = (ids: string[], e: DragEvent) => {
    dragging.current = ids
    e.dataTransfer.setData(INTERNAL_DRAG, JSON.stringify(ids))
    e.dataTransfer.effectAllowed = 'copyMove'
  }

  const endItemDrag = () => {
    dragging.current = []
    setDropTarget(null)
  }

  return { external, dropTarget, bindDrop, rootHandlers, startItemDrag, endItemDrag }
}
