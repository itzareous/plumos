import { useCallback, useEffect, useMemo, useRef, type MouseEvent } from 'react'
import type { MenuEntry } from '@/components/ui/ContextMenu'
import type { FileNode } from '@/stores/files'
import type { ItemHandlers } from '../components/items'
import type { Selection } from './hooks'
import type { Dnd } from './useDnd'
import type { FileOps } from './useFileOps'

interface Deps {
  selection: Selection
  ops: FileOps
  dnd: Dnd
  openMenu: (x: number, y: number, items: MenuEntry[]) => void
}

const LONG_PRESS_MS = 480

const idOf = (e: { currentTarget: EventTarget }) => (e.currentTarget as HTMLElement).dataset.fileId ?? ''

/**
 * Mouse, touch and drag handlers for items in the grid and list. One set is
 * shared by every item (they read the item's id from the DOM), so memoised
 * rows only re-render when their own state changes. Folders also take drops.
 */
export function useItemHandlers(deps: Deps) {
  const live = useRef(deps)
  useEffect(() => {
    live.current = deps
  })
  const press = useRef<{ timer: number; x: number; y: number; fired: boolean } | null>(null)

  const handlers = useMemo<ItemHandlers>(() => {
    const cancelPress = () => {
      if (press.current) clearTimeout(press.current.timer)
    }
    const showMenu = (id: string, x: number, y: number) => {
      const { selection, ops, openMenu } = live.current
      const ids = selection.selected.has(id) ? selection.ids : [id]
      if (!selection.selected.has(id)) selection.selectOnly([id])
      openMenu(x, y, ops.itemMenu(ids))
    }
    return {
      // A long press on a touch screen opens the item's menu.
      onPointerDown: (e) => {
        cancelPress()
        press.current = null
        if (e.pointerType !== 'touch') return
        const id = idOf(e)
        const state = { x: e.clientX, y: e.clientY, fired: false, timer: 0 }
        state.timer = window.setTimeout(() => {
          state.fired = true
          navigator.vibrate?.(8)
          showMenu(id, state.x, state.y)
        }, LONG_PRESS_MS)
        press.current = state
      },
      onPointerMove: (e) => {
        const p = press.current
        if (p && !p.fired && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) cancelPress()
      },
      onPointerUp: cancelPress,
      onPointerCancel: cancelPress,
      onClick: (e: MouseEvent) => {
        e.stopPropagation()
        if (press.current?.fired) {
          press.current = null
          return
        }
        const { selection, ops } = live.current
        const id = idOf(e)
        // A tap opens straight away, like on a phone; clicks select.
        const touch = (e.nativeEvent as PointerEvent).pointerType === 'touch'
        if (touch && !e.shiftKey && !e.metaKey && !e.ctrlKey) ops.open(id)
        else selection.click(id, e)
      },
      onDoubleClick: (e: MouseEvent) => live.current.ops.open(idOf(e)),
      onContextMenu: (e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (press.current?.fired) return
        showMenu(idOf(e), e.clientX, e.clientY)
      },
      draggable: true,
      onDragStart: (e) => {
        const { selection, dnd } = live.current
        const id = idOf(e)
        const ids = selection.selected.has(id) ? selection.ids : [id]
        if (!selection.selected.has(id)) selection.selectOnly([id])
        dnd.startItemDrag(ids, e)
      },
      onDragEnd: () => live.current.dnd.endItemDrag(),
    }
  }, [])

  const folderHandlers = useRef(new Map<string, ItemHandlers>())
  const { bindDrop } = deps.dnd
  return useCallback(
    (node: FileNode): ItemHandlers => {
      if (node.kind !== 'folder' || node.trashed) return handlers
      let h = folderHandlers.current.get(node.id)
      if (!h) {
        h = { ...handlers, ...bindDrop(node.id) }
        folderHandlers.current.set(node.id, h)
      }
      return h
    },
    [handlers, bindDrop],
  )
}
