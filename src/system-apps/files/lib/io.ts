import { blobUrl, type UploadEntry } from '@/stores/files'

const JUNK = new Set(['.ds_store', 'thumbs.db', 'desktop.ini'])
const isJunk = (name: string) => JUNK.has(name.toLowerCase()) || name.startsWith('._')

export interface DroppedTree {
  files: UploadEntry[]
  /** Every folder in the drop (so empty ones are created too). */
  folders: string[][]
}

/**
 * Reads a drop from the computer, walking into dropped folders so their whole
 * structure comes along. Must be called synchronously from the drop handler
 * (the entries are only readable during the event).
 */
export function readDrop(dt: DataTransfer): Promise<DroppedTree> {
  const roots: FileSystemEntry[] = []
  const loose: File[] = []
  for (const item of Array.from(dt.items ?? [])) {
    if (item.kind !== 'file') continue
    const entry = item.webkitGetAsEntry?.()
    if (entry) roots.push(entry)
    else {
      const file = item.getAsFile()
      if (file) loose.push(file)
    }
  }
  if (!roots.length && !loose.length) loose.push(...Array.from(dt.files))
  return (async () => {
    const out: DroppedTree = { files: loose.filter((f) => !isJunk(f.name)).map((file) => ({ file, dirs: [] })), folders: [] }
    for (const entry of roots) await walk(entry, [], out)
    return out
  })()
}

async function walk(entry: FileSystemEntry, dirs: string[], out: DroppedTree) {
  if (entry.isFile) {
    if (isJunk(entry.name)) return
    try {
      const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject))
      out.files.push({ file, dirs })
    } catch {
      // Unreadable (permissions, broken link): skip it.
    }
    return
  }
  if (!entry.isDirectory) return
  const path = [...dirs, entry.name]
  out.folders.push(path)
  const reader = (entry as FileSystemDirectoryEntry).createReader()
  // readEntries returns results in batches; keep reading until it's empty.
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve) => reader.readEntries(resolve, () => resolve([])))
    if (!batch.length) break
    for (const child of batch) await walk(child, path, out)
  }
}

/** Files from an <input type="file">, keeping folder structure for webkitdirectory picks. */
export function readInput(list: FileList | null): DroppedTree {
  const out: DroppedTree = { files: [], folders: [] }
  const seen = new Set<string>()
  for (const file of Array.from(list ?? [])) {
    if (isJunk(file.name)) continue
    const parts = (file.webkitRelativePath || file.name).split('/').filter(Boolean)
    const dirs = parts.slice(0, -1)
    for (let i = 1; i <= dirs.length; i++) {
      const key = dirs.slice(0, i).join('/')
      if (!seen.has(key)) {
        seen.add(key)
        out.folders.push(dirs.slice(0, i))
      }
    }
    out.files.push({ file, dirs })
  }
  return out
}

export const dragHasFiles = (e: React.DragEvent | DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')

export const INTERNAL_DRAG = 'application/x-plumos-files'

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Clipboard API needs a secure context; fall back to the old way.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

export function downloadFile(id: string, name: string): boolean {
  const url = blobUrl(id)
  if (!url) return false
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  return true
}

/** Keys typed into these shouldn't drive the file browser. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || !el.tagName) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
}
