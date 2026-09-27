import { findApp } from '@/apps/catalog'
import type { Identity } from './types'
import { bootTime, dir, file, type DirNode, type FsNode } from './fsnodes'
import { seedFiles } from './seed'

export type { DirNode, FileNode, FsNode } from './fsnodes'
export { nodeSize } from './fsnodes'

export class FsError extends Error {}

/** Paths that belong to the system. Only the home folder and /tmp are writable. */
const WRITABLE = (path: string, home: string) =>
  path === home || path.startsWith(home + '/') || path === '/tmp' || path.startsWith('/tmp/')

/** A tiny in-memory filesystem: /home/<user>, /apps, /etc, /var/log, /tmp. */
export class Vfs {
  root: DirNode
  constructor(readonly identity: Identity) {
    this.root = seedFiles(identity)
  }

  /** Resolves `.`/`..` and relative paths into a clean absolute path. */
  resolve(path: string, cwd: string): string {
    const parts = (path.startsWith('/') ? path : `${cwd}/${path}`).split('/')
    const out: string[] = []
    for (const part of parts) {
      if (!part || part === '.') continue
      if (part === '..') out.pop()
      else out.push(part)
    }
    return '/' + out.join('/')
  }

  get(abs: string): FsNode | null {
    let node: FsNode = this.root
    for (const part of abs.split('/').filter(Boolean)) {
      if (node.type !== 'dir') return null
      const next: FsNode | undefined = node.children.get(part)
      if (!next) return null
      node = next
    }
    return node
  }

  /** Children of a directory, sorted like `ls` (case-insensitive, dotfiles first). */
  list(abs: string): [string, FsNode][] {
    const node = this.get(abs)
    if (!node) throw new FsError('No such file or directory')
    if (node.type !== 'dir') throw new FsError('Not a directory')
    return [...node.children.entries()].sort(([a], [b]) =>
      a.replace(/^\./, '').localeCompare(b.replace(/^\./, ''), undefined, { sensitivity: 'base' }),
    )
  }

  private parentOf(abs: string): { parent: DirNode; name: string } {
    const idx = abs.lastIndexOf('/')
    const name = abs.slice(idx + 1)
    const parent = this.get(abs.slice(0, idx) || '/')
    if (!parent) throw new FsError('No such file or directory')
    if (parent.type !== 'dir') throw new FsError('Not a directory')
    return { parent, name }
  }

  private assertWritable(abs: string) {
    if (!WRITABLE(abs, this.identity.home)) throw new FsError('Permission denied')
  }

  mkdir(abs: string, parents = false) {
    if (abs === '/') throw new FsError('File exists')
    const existing = this.get(abs)
    if (existing) {
      if (parents && existing.type === 'dir') return
      throw new FsError('File exists')
    }
    this.assertWritable(abs)
    if (parents) {
      const up = abs.slice(0, abs.lastIndexOf('/')) || '/'
      if (!this.get(up)) this.mkdir(up, true)
    }
    const { parent, name } = this.parentOf(abs)
    parent.children.set(name, dir())
    parent.mtime = Date.now()
  }

  touch(abs: string) {
    const existing = this.get(abs)
    if (existing) {
      if (!WRITABLE(abs, this.identity.home)) throw new FsError('Permission denied')
      existing.mtime = Date.now()
      return
    }
    this.write(abs, '')
  }

  write(abs: string, content: string, append = false) {
    this.assertWritable(abs)
    const existing = this.get(abs)
    if (existing?.type === 'dir') throw new FsError('Is a directory')
    const { parent, name } = this.parentOf(abs)
    const prev = existing?.type === 'file' && append ? existing.content : ''
    parent.children.set(name, file(prev + content))
    parent.mtime = Date.now()
  }

  remove(abs: string, recursive = false) {
    const node = this.get(abs)
    if (!node) throw new FsError('No such file or directory')
    this.assertWritable(abs)
    if (abs === this.identity.home || abs === '/tmp') throw new FsError('Refusing to remove that folder')
    if (node.type === 'dir' && !recursive) throw new FsError('Is a directory')
    const { parent, name } = this.parentOf(abs)
    parent.children.delete(name)
    parent.mtime = Date.now()
  }

  /** Mirrors installed apps into /apps, keeping folders that are still installed. */
  syncApps(installed: string[]) {
    const apps = this.get('/apps')
    if (apps?.type !== 'dir') return
    for (const id of [...apps.children.keys()]) if (!installed.includes(id)) apps.children.delete(id)
    for (const id of installed) if (!apps.children.has(id)) apps.children.set(id, appFolder(id))
  }

  /** Mirrors the command list into /bin so `ls /bin` is honest. */
  setBin(names: string[]) {
    const bin = this.get('/bin')
    if (bin?.type !== 'dir') return
    bin.children = new Map(
      names.map((n) => [n, file(`#!/usr/bin/plush\n# ${n}\n`, bootTime(), { binary: true, size: 18_432 })]),
    )
  }
}

function appFolder(id: string): DirNode {
  const app = findApp(id)
  const port = app?.port ?? 0
  const image = `ghcr.io/${(app?.developer ?? id).toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${id}:${app?.version ?? 'latest'}`
  const compose = [
    `# ${app?.name ?? id} — managed by Plumos`,
    'services:',
    `  ${id}:`,
    `    image: ${image}`,
    '    restart: unless-stopped',
    ...(port ? ['    ports:', `      - "${port}:${port}"`] : []),
    '    volumes:',
    `      - /apps/${id}/data:/data`,
    '',
  ].join('\n')
  const info = JSON.stringify(
    { id, name: app?.name ?? id, version: app?.version ?? 'unknown', category: app?.category, port: app?.port ?? null },
    null,
    2,
  )
  const installedAt = Date.now() - 3 * 86400e3 - Math.round(Math.random() * 40 * 86400e3)
  return dir(
    {
      'app.json': file(info + '\n', installedAt),
      'docker-compose.yml': file(compose, installedAt),
      data: dir({}, Date.now() - Math.round(Math.random() * 7200e3)),
    },
    installedAt,
  )
}
