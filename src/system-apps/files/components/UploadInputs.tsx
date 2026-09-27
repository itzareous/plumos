import { useImperativeHandle, useRef, type ChangeEvent, type Ref } from 'react'
import { readInput, type DroppedTree } from '../lib/io'

export interface Pickers {
  files: () => void
  folder: () => void
}

/** The hidden file inputs behind Upload: a few files, or a whole folder. */
export function UploadInputs({ ref, onPick }: { ref: Ref<Pickers>; onPick: (tree: DroppedTree) => void }) {
  const files = useRef<HTMLInputElement>(null)
  const folder = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => ({ files: () => files.current?.click(), folder: () => folder.current?.click() }), [])

  const change = (e: ChangeEvent<HTMLInputElement>) => {
    // Read the list before clearing it, so picking the same files again still fires.
    onPick(readInput(e.target.files))
    e.target.value = ''
  }

  return (
    <>
      <input ref={files} type="file" multiple hidden tabIndex={-1} onChange={change} data-upload="files" />
      <input
        ref={(el) => {
          folder.current = el
          el?.setAttribute('webkitdirectory', '')
        }}
        type="file"
        multiple
        hidden
        tabIndex={-1}
        onChange={change}
        data-upload="folder"
      />
    </>
  )
}
