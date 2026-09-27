/** Filesystem nodes and small constructors shared by the VFS and its seed data. */

export interface FileNode {
  type: 'file'
  content: string
  mtime: number
  /** Photos, archives… `cat` refuses them and `ls -l` shows `size`. */
  binary?: boolean
  size?: number
}

export interface DirNode {
  type: 'dir'
  children: Map<string, FsNode>
  mtime: number
}

export type FsNode = FileNode | DirNode

export const dir = (entries: Record<string, FsNode> = {}, mtime = Date.now()): DirNode => ({
  type: 'dir',
  children: new Map(Object.entries(entries)),
  mtime,
})

export const file = (content: string, mtime = Date.now(), extra: Partial<FileNode> = {}): FileNode => ({
  type: 'file',
  content,
  mtime,
  ...extra,
})

export const nodeSize = (node: FsNode) =>
  node.type === 'dir' ? 4096 : (node.size ?? new TextEncoder().encode(node.content).length)

export const bootTime = () => Date.now() - 12 * 86400e3
