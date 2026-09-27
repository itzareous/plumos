import { useCallback, useRef, useState } from 'react'
import type { Photo } from '@/lib/photos'

/** Selection with shift-click ranges over the list currently on screen. */
export function useSelection(items: Photo[]) {
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set())
  const anchor = useRef<number | null>(null)
  const list = useRef(items)
  list.current = items

  const toggle = useCallback((photo: Photo, index: number, { shift }: { shift: boolean }) => {
    setSelecting(true)
    setSelected((prev) => {
      const next = new Set(prev)
      if (shift && anchor.current !== null) {
        const [a, b] = anchor.current < index ? [anchor.current, index] : [index, anchor.current]
        for (let i = a; i <= b; i++) if (list.current[i]) next.add(list.current[i].id)
      } else if (next.has(photo.id)) next.delete(photo.id)
      else next.add(photo.id)
      return next
    })
    anchor.current = index
  }, [])

  const setMany = useCallback((ids: string[], select: boolean) => {
    setSelecting(true)
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (select) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelecting(true)
    setSelected(new Set(list.current.map((p) => p.id)))
  }, [])

  const clear = useCallback(() => {
    setSelecting(false)
    setSelected(new Set())
    anchor.current = null
  }, [])

  const start = useCallback(() => setSelecting(true), [])

  return { selecting, selected, toggle, setMany, selectAll, clear, start }
}
