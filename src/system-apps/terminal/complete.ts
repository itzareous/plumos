import { catalog } from '@/apps/catalog'
import { useApps } from '@/stores/apps'
import { aliases, commands } from './commands'
import { SHEETS } from './commands/apps'
import { commonPrefix } from './parse'
import type { Vfs } from './vfs'

export interface Completion {
  value: string
  caret: number
  /** Shown under the prompt when Tab can't pick one. */
  list?: { label: string; dir: boolean }[]
}

interface Env {
  fs: Vfs
  cwd: string
  home: string
  host: string
}

interface Candidate {
  /** Text that replaces the word. */
  insert: string
  label: string
  dir: boolean
}

function wordCandidates(words: string[], word: string): Candidate[] {
  return [...new Set(words)]
    .filter((w) => w.startsWith(word))
    .sort()
    .map((w) => ({ insert: w + ' ', label: w, dir: false }))
}

function pathCandidates(word: string, env: Env, dirsOnly: boolean): Candidate[] {
  if (word === '~') return [{ insert: '~/', label: '~/', dir: true }]
  const slash = word.lastIndexOf('/')
  const shownDir = slash >= 0 ? word.slice(0, slash + 1) : ''
  const base = word.slice(slash + 1).replace(/\\ /g, ' ')
  const lookupDir = shownDir.replace(/^~(?=\/)/, env.home)
  let entries: [string, { type: string }][]
  try {
    entries = env.fs.list(env.fs.resolve(lookupDir || '.', env.cwd))
  } catch {
    return []
  }
  return entries
    .filter(([name]) => name.startsWith(base) && (base.startsWith('.') || !name.startsWith('.')))
    .filter(([, node]) => !dirsOnly || node.type === 'dir')
    .map(([name, node]) => {
      const dir = node.type === 'dir'
      const escaped = name.replace(/ /g, '\\ ')
      return { insert: shownDir + escaped + (dir ? '/' : ' '), label: name + (dir ? '/' : ''), dir }
    })
}

/** Bash-style Tab completion for the word before the caret. */
export function complete(input: string, caret: number, env: Env): Completion | null {
  const before = input.slice(0, caret)
  const after = input.slice(caret)
  // Only look at the current command in a `a; b && c` chain.
  const semi = before.lastIndexOf(';')
  const amp = before.lastIndexOf('&&')
  const segmentStart = Math.max(semi + 1, amp >= 0 ? amp + 2 : 0)
  const segment = before.slice(segmentStart)
  const wordStart = Math.max(segment.search(/\S+$/), 0)
  const word = /\s$/.test(segment) || !segment ? '' : segment.slice(wordStart)
  const prior = segment
    .slice(0, segment.length - word.length)
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  let candidates: Candidate[]
  if (!prior.length) {
    if (!word) return null
    candidates = wordCandidates([...Object.keys(commands), ...Object.keys(aliases).filter((a) => /^\w/.test(a))], word)
  } else {
    const name = aliases[prior[0]]?.[0] ?? prior[0]
    const kind = name === 'sudo' ? 'command' : (commands[name]?.complete ?? 'path')
    const firstArg = prior.length === 1
    const { installed } = useApps.getState()
    if (word.startsWith('-')) return null
    if (kind === 'command' && firstArg) candidates = wordCandidates(Object.keys(commands), word)
    else if (kind === 'installed' && firstArg) candidates = wordCandidates(installed, word)
    else if (kind === 'available' && firstArg) {
      candidates = wordCandidates(
        catalog.map((a) => a.id).filter((id) => !installed.includes(id)),
        word,
      )
    } else if (kind === 'open' && firstArg) candidates = wordCandidates([...Object.keys(SHEETS), ...installed], word)
    else if (kind === 'host' && !word.startsWith('-')) {
      candidates = wordCandidates(['localhost', `${env.host}.local`, 'router.local', 'example.com'], word)
    } else candidates = pathCandidates(word, env, kind === 'dir')
  }

  if (!candidates.length) return null
  const head = before.slice(0, before.length - word.length)
  if (candidates.length === 1) {
    const value = head + candidates[0].insert + after.replace(/^ /, '')
    return { value, caret: head.length + candidates[0].insert.length }
  }
  const prefix = commonPrefix(candidates.map((c) => c.insert))
  if (prefix.length > word.length) return { value: head + prefix + after, caret: head.length + prefix.length }
  return { value: input, caret, list: candidates.map((c) => ({ label: c.label, dir: c.dir })) }
}
