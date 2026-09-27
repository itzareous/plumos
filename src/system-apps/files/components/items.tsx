import { useEffect, useRef, useState, type DragEvent, type MouseEvent, type PointerEvent } from 'react'
import type { FileNode } from '@/stores/files'
import { cn } from '@/lib/cn'
import { baseName } from '../lib/kinds'

export interface ItemHandlers {
  onClick: (e: MouseEvent) => void
  onDoubleClick: (e: MouseEvent) => void
  onContextMenu: (e: MouseEvent) => void
  draggable: boolean
  onDragStart: (e: DragEvent) => void
  onDragEnd: (e: DragEvent) => void
  /** Long-press on touch screens opens the item's menu. */
  onPointerDown: (e: PointerEvent) => void
  onPointerMove: (e: PointerEvent) => void
  onPointerUp: (e: PointerEvent) => void
  onPointerCancel: (e: PointerEvent) => void
  onDragOver?: (e: DragEvent) => void
  onDragLeave?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
}

export interface ItemBinding {
  selected: boolean
  focused: boolean
  renaming: boolean
  dropping: boolean
  /** Grid caption: size, item count or where it lives. */
  subtitle: string
  /** Secondary location hint in search results. */
  hint?: string
  handlers: ItemHandlers
}

export type BindItem = (node: FileNode) => ItemBinding

export interface RenameApi {
  commit: (id: string, name: string) => void
  cancel: () => void
}

/** Inline name editor; selects the name without its extension, like Finder. */
export function RenameField({ node, api, className }: { node: FileNode; api: RenameApi; className?: string }) {
  const [value, setValue] = useState(node.name)
  const ref = useRef<HTMLInputElement>(null)
  const done = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    const end = node.kind === 'folder' ? node.name.length : baseName(node.name).length
    el.setSelectionRange(0, end)
  }, [node.kind, node.name])

  const finish = (commit: boolean) => {
    if (done.current) return
    done.current = true
    if (commit) api.commit(node.id, value)
    else api.cancel()
  }

  return (
    <input
      ref={ref}
      value={value}
      aria-label="Name"
      spellCheck={false}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') {
          e.preventDefault()
          finish(true)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          finish(false)
        }
      }}
      onBlur={() => finish(true)}
      className={cn(
        'rounded-md bg-[#1c1c26] px-1.5 py-0.5 text-[12.5px] font-medium text-white ring-2 ring-accent outline-none selection:bg-accent/60',
        className,
      )}
    />
  )
}
