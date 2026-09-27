import type { VmSpec } from '../types'
import { HOME_PATH, nodeAt } from '../apps/fsData'

export interface ShellResult {
  out: string[]
  cwd: string
  clear?: boolean
  exit?: boolean
}

const COMMANDS = [
  'cat', 'cd', 'clear', 'date', 'df', 'echo', 'exit', 'free', 'help', 'history', 'hostname', 'ls', 'ping', 'pwd', 'sysinfo',
  'uname', 'uptime', 'whoami',
]

/** Resolves a path typed in the shell to a path relative to the home folder. */
function resolve(cwd: string, arg = ''): string | null {
  let parts = arg.startsWith('/') ? [] : cwd.split('/').filter(Boolean)
  let rest = arg
  if (arg === '~' || arg.startsWith('~/')) {
    parts = []
    rest = arg.slice(1)
  } else if (arg.startsWith(HOME_PATH)) {
    parts = []
    rest = arg.slice(HOME_PATH.length)
  } else if (arg.startsWith('/')) return null
  for (const p of rest.split('/').filter(Boolean)) {
    if (p === '.') continue
    if (p === '..') parts.pop()
    else parts.push(p)
  }
  return parts.join('/')
}

export const promptPath = (cwd: string) => (cwd ? `~/${cwd}` : '~')

const pad = (s: string | number, n: number) => String(s).padStart(n)

export function complete(line: string, cwd: string): string {
  const words = line.split(' ')
  const last = words[words.length - 1]
  if (words.length === 1) {
    const hit = COMMANDS.filter((c) => c.startsWith(last))
    return hit.length === 1 ? hit[0] + ' ' : line
  }
  const slash = last.lastIndexOf('/')
  const dir = resolve(cwd, slash >= 0 ? last.slice(0, slash) || '/' : '.')
  const base = slash >= 0 ? last.slice(slash + 1) : last
  const node = dir === null ? null : nodeAt(dir)
  const hits = node?.children?.filter((c) => c.name.startsWith(base)) ?? []
  if (hits.length !== 1) return line
  const name = hits[0].name.includes(' ') ? hits[0].name.replace(/ /g, '\\ ') : hits[0].name
  words[words.length - 1] = (slash >= 0 ? last.slice(0, slash + 1) : '') + name + (hits[0].type === 'dir' ? '/' : '')
  return words.join(' ')
}

/** A tiny, read-only shell over the demo home folder. */
export function runCommand(line: string, cwd: string, spec: VmSpec, bootAt: number, history: string[]): ShellResult {
  const args = (line.match(/(?:\\ |[^\s])+/g) ?? []).map((a) => a.replace(/\\ /g, ' '))
  const [cmd, ...rest] = args
  const flags = rest.filter((a) => a.startsWith('-')).join('')
  const params = rest.filter((a) => !a.startsWith('-'))
  const res = (out: string[], next = cwd): ShellResult => ({ out, cwd: next })
  const upMin = Math.max(1, Math.round((Date.now() - bootAt) / 60000))
  const mem = spec.memoryGb
  const used = Math.round(mem * 0.27 * 10) / 10

  switch (cmd) {
    case undefined:
      return res([])
    case 'help':
      return res([
        'Commands you can try:',
        '  ls, cd, pwd, cat <file>      look around the home folder',
        '  df -h, free -h, uptime       disk, memory and uptime',
        '  sysinfo                      a summary of this machine',
        '  echo, date, whoami, uname -a, hostname, ping, history, clear, exit',
      ])
    case 'pwd':
      return res([cwd ? `${HOME_PATH}/${cwd}` : HOME_PATH])
    case 'whoami':
      return res(['guest'])
    case 'hostname':
      return res(['plumos-vm'])
    case 'date':
      return res([new Date().toString().replace(/ \(.+\)$/, '')])
    case 'echo':
      return res([rest.join(' ')])
    case 'clear':
      return { out: [], cwd, clear: true }
    case 'exit':
      return { out: ['logout'], cwd, exit: true }
    case 'history':
      return res(history.map((h, i) => `${pad(i + 1, 5)}  ${h}`))
    case 'uname':
      return res([flags.includes('a') ? 'Linux plumos-vm 6.8.0-virtual #1 SMP x86_64 GNU/Linux' : 'Linux'])
    case 'uptime': {
      const t = new Date().toTimeString().slice(0, 8)
      return res([` ${t} up ${upMin} min,  1 user,  load average: 0.14, 0.09, 0.03`])
    }
    case 'df':
      return res([
        'Filesystem      Size  Used Avail Use% Mounted on',
        `/dev/vda1       ${pad(`${spec.diskGb}G`, 4)}  ${pad(`${Math.round(spec.diskGb * 0.34)}G`, 4)}  ${pad(`${Math.round(spec.diskGb * 0.66)}G`, 4)}  34% /`,
        `tmpfs           ${pad(`${(mem / 2).toFixed(1)}G`, 4)}     0  ${pad(`${(mem / 2).toFixed(1)}G`, 4)}   0% /dev/shm`,
        'plumos:/home    1.8T  1.1T  700G  61% /mnt/home-server',
      ])
    case 'free':
      return res([
        '               total        used        free      shared  buff/cache   available',
        `Mem:        ${pad(`${(mem * 0.97).toFixed(1)}Gi`, 8)}    ${pad(`${used}Gi`, 8)}    ${pad(`${(mem * 0.5).toFixed(1)}Gi`, 8)}      112Mi    ${pad(`${(mem * 0.2).toFixed(1)}Gi`, 8)}    ${pad(`${(mem * 0.68).toFixed(1)}Gi`, 8)}`,
        'Swap:          2.0Gi          0B       2.0Gi',
      ])
    case 'sysinfo':
    case 'neofetch':
      return res([
        '        /\\          guest@plumos-vm',
        '       /  \\   *     ---------------',
        '      / /\\ \\        OS: Linux (virtual machine)',
        '     / /  \\ \\       Host: Plumos home server',
        '    /_/    \\_\\      Kernel: 6.8.0-virtual',
        `                    Uptime: ${upMin} min`,
        `                    CPU: ${spec.cpus} virtual cores`,
        `                    Memory: ${used} GiB / ${mem} GiB`,
        `                    Disk: ${Math.round(spec.diskGb * 0.34)} GB / ${spec.diskGb} GB`,
      ])
    case 'ping': {
      const host = params[0] ?? 'plumos.local'
      return res([
        `PING ${host}: 56 data bytes`,
        ...[0.41, 0.38, 0.52, 0.44].map((ms, i) => `64 bytes from ${host}: icmp_seq=${i + 1} ttl=64 time=${ms} ms`),
        `--- ${host} ping statistics ---`,
        '4 packets transmitted, 4 received, 0% packet loss',
      ])
    }
    case 'cd': {
      const target = resolve(cwd, params[0] ?? '~')
      const node = target === null ? null : nodeAt(target)
      if (!node) return res([`cd: ${params[0]}: No such file or directory`])
      if (node.type !== 'dir') return res([`cd: ${params[0]}: Not a directory`])
      return res([], target!)
    }
    case 'ls': {
      const target = resolve(cwd, params[0] ?? '.')
      const node = target === null ? null : nodeAt(target)
      if (!node) return res([`ls: cannot access '${params[0]}': No such file or directory`])
      if (node.type === 'file') return res([node.name])
      const items = [...(node.children ?? [])].sort((a, b) => a.name.localeCompare(b.name))
      if (flags.includes('l')) {
        return res([
          `total ${items.length * 4}`,
          ...items.map(
            (c) =>
              `${c.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--'} 1 guest guest ${pad(c.type === 'dir' ? 4096 : (c.size ?? 0), 9)} ${c.modified.padEnd(6)} ${c.name}${c.type === 'dir' ? '/' : ''}`,
          ),
        ])
      }
      return res([items.map((c) => (c.name.includes(' ') ? `'${c.name}'` : c.name) + (c.type === 'dir' ? '/' : '')).join('  ')])
    }
    case 'cat': {
      if (!params[0]) return res(['cat: missing file name'])
      const target = resolve(cwd, params[0])
      const node = target === null ? null : nodeAt(target)
      if (!node) return res([`cat: ${params[0]}: No such file or directory`])
      if (node.type === 'dir') return res([`cat: ${params[0]}: Is a directory`])
      if (!node.content) return res([`cat: ${params[0]}: binary file, not shown`])
      return res(node.content.split('\n'))
    }
    case 'sudo':
      return res(['sudo: the guest account cannot run admin commands in this demo'])
    case 'apt':
    case 'apt-get':
    case 'snap':
    case 'flatpak':
      return res([`${cmd}: installing packages is turned off in this demo`])
    case 'mkdir':
    case 'touch':
    case 'rm':
    case 'mv':
    case 'cp':
      return res([`${cmd}: the demo file system is read-only`])
    case 'top':
    case 'htop':
      return res([`${cmd}: try 'free -h' or 'uptime' in this demo`])
    default:
      return res([`${cmd}: command not found`])
  }
}
