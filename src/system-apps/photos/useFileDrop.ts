import { useEffect, useRef, useState } from 'react'

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')

/** Watches the whole window for files being dragged in; `onDrop` gets the dropped files. */
export function useFileDrop(onDrop: (files: File[]) => void) {
  const [over, setOver] = useState(false)
  const cb = useRef(onDrop)
  cb.current = onDrop

  useEffect(() => {
    let depth = 0
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth++
      setOver(true)
    }
    const move = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return
      depth = Math.max(0, depth - 1)
      if (!depth) setOver(false)
    }
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth = 0
      setOver(false)
      cb.current(Array.from(e.dataTransfer?.files ?? []))
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragover', move)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragover', move)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
    }
  }, [])

  return over
}
