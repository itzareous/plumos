import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { Command, ShellContext } from '../types'
import { FsError, nodeSize, type FsNode } from '../vfs'
import { Columns, Line, Linkify, Pre, tone } from '../ui'
import { Highlighted } from '../highlight'
import { human } from '../format'

/** Splits `-la` style flags from operands. */
export function flags(args: string[]) {
  const set = new Set<string>()
  const rest: string[] = []
  for (const a of args) {
    if (a.startsWith('--')) set.add(a.slice(2))
    else if (a.startsWith('-') && a.length > 1) for (const ch of a.slice(1)) set.add(ch)
    else rest.push(a)
  }
  return { has: (f: string) => set.has(f), rest }
}

/** Runs `fn`, turning filesystem errors into `cmd: path: message`. */
function guard(ctx: ShellContext, path: string, fn: () => void) {
  try {
    fn()
    return true
  } catch (e) {
    if (e instanceof FsError) ctx.error(`${path}: ${e.message}`)
    else throw e
    return false
  }
}

const MEDIA = /\.(jpe?g|png|heic|gif|mov|mp4|mkv|flac|mp3|wav)$/i
const ARCHIVE = /\.(tar|gz|zip|xz|7z|tgz)$/i

function nameClass(name: string, node: FsNode, abs: string) {
  if (node.type === 'dir') return cn(tone.blue, 'font-semibold')
  if (abs.startsWith('/bin/')) return cn(tone.green, 'font-semibold')
  if (ARCHIVE.test(name)) return tone.red
  if (MEDIA.test(name)) return tone.plum
  if (name.startsWith('.')) return tone.muted
  return tone.fg
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function lsDate(ms: number) {
  const d = new Date(ms)
  const day = String(d.getDate()).padStart(2)
  const recent = Date.now() - ms < 180 * 86400e3
  const tail = recent
    ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    : ` ${d.getFullYear()}`
  return `${MONTHS[d.getMonth()]} ${day} ${tail}`
}

function longRow(ctx: ShellContext, name: string, node: FsNode, abs: string, h: boolean): ReactNode {
  const system = !abs.startsWith(ctx.home) && !abs.startsWith('/tmp')
  const owner = system ? 'root' : ctx.user
  const exec = abs.startsWith('/bin/')
  const mode = node.type === 'dir' ? 'drwxr-xr-x' : exec ? '-rwxr-xr-x' : '-rw-r--r--'
  const links = node.type === 'dir' ? 2 + [...node.children.values()].filter((c) => c.type === 'dir').length : 1
  const size = nodeSize(node)
  return (
    <>
      <span className={tone.dim}>{mode}</span> {String(links).padStart(2)}{' '}
      <span className={tone.yellow}>{owner.padEnd(6)}</span> <span className={tone.yellow}>{owner.padEnd(6)}</span>{' '}
      {(h ? human(size) : String(size)).padStart(h ? 5 : 10)} <span className={tone.muted}>{lsDate(node.mtime)}</span>{' '}
      <span className={nameClass(name, node, abs)}>{name}</span>
    </>
  )
}

function ls(ctx: ShellContext) {
  const f = flags(ctx.args)
  const all = f.has('a') || f.has('A') || f.has('all')
  const long = f.has('l')
  const h = f.has('h')
  const targets = f.rest.length ? f.rest : ['.']
  let failed = false

  targets.forEach((target, index) => {
    const abs = ctx.fs.resolve(target, ctx.cwd)
    const node = ctx.fs.get(abs)
    if (!node) {
      ctx.error(`cannot access '${target}': No such file or directory`)
      failed = true
      return
    }
    let entries: [string, FsNode][] = node.type === 'dir' ? ctx.fs.list(abs) : [[target, node]]
    if (!all) entries = entries.filter(([n]) => !n.startsWith('.'))
    const child = (name: string) => (node.type === 'dir' ? `${abs === '/' ? '' : abs}/${name}` : abs)

    if (targets.length > 1) {
      if (index > 0) ctx.print(<Line />)
      ctx.print(<Line>{target}:</Line>)
    }
    if (long) {
      if (node.type === 'dir') {
        const blocks = entries.reduce((sum, [, n]) => sum + Math.ceil(nodeSize(n) / 4096) * 4, 0)
        ctx.print(<Line>total {h ? human(blocks * 1024) : blocks}</Line>)
      }
      ctx.print(
        <Pre>
          {entries.map(([name, n]) => (
            <div key={name}>{longRow(ctx, name, n, child(name), h)}</div>
          ))}
        </Pre>,
      )
    } else if (entries.length) {
      ctx.print(
        <Columns
          items={entries.map(([name, n]) => ({
            key: name,
            width: name.length,
            label: <span className={nameClass(name, n, child(name))}>{name}</span>,
          }))}
        />,
      )
    }
  })
  return failed ? 1 : 0
}

function cd(ctx: ShellContext) {
  const target = ctx.args[0] ?? ctx.home
  const path = target === '-' ? ctx.oldCwd : target
  const abs = ctx.fs.resolve(path, ctx.cwd)
  const node = ctx.fs.get(abs)
  if (!node) return ctx.error(`${target}: No such file or directory`)
  if (node.type !== 'dir') return ctx.error(`${target}: Not a directory`)
  if (target === '-') ctx.print(<Line>{abs}</Line>)
  ctx.setCwd(abs)
}

function cat(ctx: ShellContext) {
  if (!ctx.args.length) return ctx.error('missing file operand')
  for (const target of ctx.args) {
    const abs = ctx.fs.resolve(target, ctx.cwd)
    const node = ctx.fs.get(abs)
    if (!node) ctx.error(`${target}: No such file or directory`)
    else if (node.type === 'dir') ctx.error(`${target}: Is a directory`)
    else if (node.binary) ctx.error(`${target}: binary file (${human(nodeSize(node))}B) — open it in the Files app`)
    else if (node.content) ctx.print(<Highlighted name={abs} content={node.content.replace(/\n$/, '')} />)
  }
}

export const fileCommands: Record<string, Command> = {
  ls: {
    run: ls,
    summary: 'List a folder (-l long, -a hidden, -h sizes)',
    usage: 'ls [-lah] [path…]',
    group: 'Files',
    complete: 'path',
  },
  cd: { run: cd, summary: 'Change folder (cd - goes back)', usage: 'cd [path]', group: 'Files', complete: 'dir' },
  pwd: {
    run: (ctx) => void ctx.print(<Line>{ctx.cwd}</Line>),
    summary: 'Print the current folder',
    group: 'Files',
  },
  cat: { run: cat, summary: 'Print a file', usage: 'cat <file…>', group: 'Files', complete: 'path' },
  mkdir: {
    run: (ctx) => {
      const f = flags(ctx.args)
      if (!f.rest.length) return ctx.error('missing operand')
      for (const target of f.rest) guard(ctx, target, () => ctx.fs.mkdir(ctx.fs.resolve(target, ctx.cwd), f.has('p')))
    },
    summary: 'Make a folder (-p for parents)',
    usage: 'mkdir [-p] <path…>',
    group: 'Files',
    complete: 'dir',
  },
  touch: {
    run: (ctx) => {
      if (!ctx.args.length) return ctx.error('missing file operand')
      for (const target of ctx.args) guard(ctx, target, () => ctx.fs.touch(ctx.fs.resolve(target, ctx.cwd)))
    },
    summary: 'Create an empty file',
    usage: 'touch <file…>',
    group: 'Files',
    complete: 'path',
  },
  rm: {
    run: (ctx) => {
      const f = flags(ctx.args)
      if (!f.rest.length) return ctx.error('missing operand')
      for (const target of f.rest) {
        guard(ctx, target, () => ctx.fs.remove(ctx.fs.resolve(target, ctx.cwd), f.has('r') || f.has('R')))
      }
    },
    summary: 'Remove files (-r for folders)',
    usage: 'rm [-r] <path…>',
    group: 'Files',
    complete: 'path',
  },
  echo: {
    run: (ctx) => {
      // Supports `echo text > file` and `>>` for appending.
      const i = ctx.args.findIndex((a) => a === '>' || a === '>>')
      if (i === -1)
        return void ctx.print(
          <Line>
            <Linkify text={ctx.args.join(' ')} />
          </Line>,
        )
      const target = ctx.args[i + 1]
      if (!target) return ctx.error("syntax error near unexpected token `newline'")
      const text = ctx.args.slice(0, i).join(' ') + '\n'
      guard(ctx, target, () => ctx.fs.write(ctx.fs.resolve(target, ctx.cwd), text, ctx.args[i] === '>>'))
    },
    summary: 'Print text (or write it to a file with >)',
    usage: 'echo <text> [> file]',
    group: 'Files',
    complete: 'path',
  },
}
