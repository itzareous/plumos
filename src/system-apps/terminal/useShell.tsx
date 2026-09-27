import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { findApp } from '@/apps/catalog'
import { formatBytes } from '@/lib/format'
import { useApps } from '@/stores/apps'
import { useSettings } from '@/stores/settings'
import { useSystem } from '@/stores/system'
import { aliases, commands } from './commands'
import { SHEETS } from './commands/apps'
import { dateText } from './commands/system'
import { complete } from './complete'
import { closest, parseLine } from './parse'
import { Prompt } from './Prompt'
import type { CommandResult, Entry, Identity, LineHandle, ShellContext } from './types'
import { C, Columns, ErrorLine, Line, tone } from './ui'
import { Vfs } from './vfs'

const MAX_ENTRIES = 800
const HISTORY_KEY = 'plumos:terminal-history'
const LAST_LOGIN_KEY = 'plumos:terminal-last-login'

let nextId = 1

/** One filesystem per user for the whole page session, so files survive closing the sheet. */
const filesystems = new Map<string, Vfs>()
function fsFor(identity: Identity) {
  const key = `${identity.user}@${identity.host}`
  let fs = filesystems.get(key)
  if (!fs) {
    fs = new Vfs(identity)
    fs.setBin(Object.keys(commands))
    filesystems.set(key, fs)
  }
  return fs
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or storage full: history just won't persist.
  }
}

/** Unix-style names from the display names in Settings. */
export function useIdentity(): Identity {
  const userName = useSettings((s) => s.userName)
  const deviceName = useSettings((s) => s.deviceName)
  return useMemo(() => {
    const user = userName.toLowerCase().replace(/[^a-z0-9_-]+/g, '') || 'user'
    const host =
      deviceName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'plumos'
    return { user, host, home: `/home/${user}` }
  }, [userName, deviceName])
}

function Banner({ identity }: { identity: Identity }) {
  const [lastLogin] = useState(() => readStorage<number>(LAST_LOGIN_KEY, Date.now() - 19 * 3600e3 - 14 * 60e3))
  const stats = useSystem.getState().stats
  const apps = useApps.getState().installed.length
  return (
    <div className="pb-[1em]">
      <Line className={tone.muted}>Last login: {dateText(new Date(lastLogin))} from 192.168.1.23</Line>
      <Line />
      <Line>
        Welcome to{' '}
        <C t="plum" bold>
          Plumos
        </C>{' '}
        1.0 on{' '}
        <C t="fg" bold>
          {identity.host}
        </C>
        <span className={tone.dim}>
          {' '}
          · {apps} apps running · {formatBytes(stats.storage.used)} of {formatBytes(stats.storage.total, 0)} used
        </span>
      </Line>
      <Line className={tone.muted}>
        Type{' '}
        <C t="green" bold>
          help
        </C>{' '}
        to see what you can do, or <C t="green">neofetch</C> for a quick system summary.
      </Line>
    </div>
  )
}

interface Job {
  controller: AbortController
  onKey: ((e: KeyboardEvent) => boolean) | null
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * The shell: scrollback, working directory, history and the command runner.
 * The view renders `entries` and forwards keys; everything else lives here.
 */
export function useShell(identity: Identity, cols: RefObject<number>, onExit: () => void) {
  const fs = useMemo(() => fsFor(identity), [identity])
  const [entries, setEntries] = useState<Entry[]>(() => [{ id: nextId++, node: <Banner identity={identity} /> }])
  const [cwd, setCwdState] = useState(identity.home)
  const [running, setRunning] = useState(false)
  const [screen, setScreen] = useState<ReactNode>(null)
  const cwdRef = useRef(identity.home)
  const oldCwdRef = useRef(identity.home)
  const history = useRef<string[]>(readStorage<string[]>(HISTORY_KEY, []))
  const job = useRef<Job | null>(null)

  useEffect(() => writeStorage(LAST_LOGIN_KEY, Date.now()), [])
  // Stop whatever is running if the sheet closes.
  useEffect(() => () => job.current?.controller.abort(), [])

  const append = useCallback((node: ReactNode): LineHandle => {
    const id = nextId++
    setEntries((list) => {
      const next = [...list, { id, node }]
      return next.length > MAX_ENTRIES ? next.slice(-MAX_ENTRIES) : next
    })
    return { update: (n) => setEntries((list) => list.map((e) => (e.id === id ? { id, node: n } : e))) }
  }, [])

  const echo = useCallback(
    (text: ReactNode) =>
      append(
        <Line>
          <Prompt user={identity.user} host={identity.host} cwd={cwdRef.current} home={identity.home} />
          {text}
        </Line>,
      ),
    [append, identity],
  )

  const notFound = useCallback(
    (name: string) => {
      append(
        <ErrorLine>
          plush: <span className={tone.fg}>{name}</span>: command not found
        </ErrorLine>,
      )
      const { installed } = useApps.getState()
      if (installed.includes(name) || SHEETS[name]) {
        const label = SHEETS[name]?.name ?? findApp(name)?.name ?? name
        append(
          <Line className={tone.muted}>
            To open {label}, type <C t="green">open {name}</C>
          </Line>,
        )
        return
      }
      const guess = closest(name, [
        ...Object.keys(commands).filter((n) => !commands[n].hidden),
        ...Object.keys(aliases),
      ])
      if (guess) {
        append(
          <Line className={tone.muted}>
            Did you mean <C t="green">{guess}</C>?
          </Line>,
        )
      } else {
        append(
          <Line className={tone.muted}>
            Type <C t="green">help</C> to see the available commands.
          </Line>,
        )
      }
    },
    [append],
  )

  const runStep = useCallback(
    async (words: string[]): Promise<number> => {
      const [first, ...rest] = words
      const expanded = aliases[first] ? [...aliases[first], ...rest] : words
      const [name, ...args] = expanded
      const cmd = commands[name]
      if (!cmd) {
        notFound(name)
        return 127
      }

      const controller = new AbortController()
      const thisJob: Job = { controller, onKey: null }
      const interrupted = new Promise<void>((resolve) =>
        controller.signal.addEventListener('abort', () => resolve(), { once: true }),
      )
      let active = true
      let failed = false
      const ctx: ShellContext = {
        ...identity,
        name,
        args,
        cwd: cwdRef.current,
        oldCwd: oldCwdRef.current,
        fs,
        history: history.current,
        cols: cols.current ?? 80,
        signal: controller.signal,
        print: (node) => (active ? append(node) : { update: () => {} }),
        error: (message) => {
          failed = true
          if (active) {
            append(
              <ErrorLine>
                {name}: {message}
              </ErrorLine>,
            )
          }
        },
        setCwd: (path) => {
          oldCwdRef.current = cwdRef.current
          cwdRef.current = path
          setCwdState(path)
        },
        clear: () => setEntries([]),
        screen: (node) => active && setScreen(node),
        onKey: (handler) => {
          thisJob.onKey = handler
        },
        sleep: (ms) =>
          new Promise<void>((resolve) => {
            if (controller.signal.aborted) return resolve()
            const done = () => {
              clearTimeout(timer)
              controller.signal.removeEventListener('abort', done)
              resolve()
            }
            const timer = setTimeout(done, ms)
            controller.signal.addEventListener('abort', done, { once: true })
          }),
        interrupted,
        exit: onExit,
      }

      let result: CommandResult
      try {
        result = cmd.run(ctx)
      } catch (e) {
        append(<ErrorLine>{`${name}: ${e instanceof Error ? e.message : String(e)}`}</ErrorLine>)
        return 1
      }

      let code: void | number = undefined
      if (result instanceof Promise) {
        job.current = thisJob
        setRunning(true)
        const settled = result.catch((e: unknown) => {
          append(<ErrorLine>{`${name}: ${e instanceof Error ? e.message : String(e)}`}</ErrorLine>)
          return 1
        })
        // A command gets a moment to tidy up after Ctrl+C, then the prompt comes back regardless.
        const forced = interrupted.then(() => delay(1500)).then(() => 130)
        code = await Promise.race([settled, forced])
        active = false
        if (job.current === thisJob) job.current = null
        setRunning(false)
        setScreen(null)
      } else {
        active = false
        code = result
      }
      if (controller.signal.aborted) return 130
      return typeof code === 'number' ? code : failed ? 1 : 0
    },
    [append, cols, fs, identity, notFound, onExit],
  )

  /** Runs one line of input: echoes it, records history, then runs each `;`/`&&` step. */
  const run = useCallback(
    async (line: string) => {
      echo(line)
      const trimmed = line.trim()
      if (!trimmed) return
      const list = history.current
      if (list[list.length - 1] !== line) {
        list.push(line)
        if (list.length > 500) list.splice(0, list.length - 500)
        writeStorage(HISTORY_KEY, list)
      }
      fs.syncApps(useApps.getState().installed)
      const env = {
        HOME: identity.home,
        USER: identity.user,
        HOSTNAME: identity.host,
        PWD: cwdRef.current,
        OLDPWD: oldCwdRef.current,
        SHELL: '/bin/plush',
        TERM: 'xterm-256color',
      }
      let status = 0
      for (const step of parseLine(trimmed, env)) {
        if (step.when === 'ok' && status !== 0) continue
        status = await runStep(step.words)
        if (status === 130) break
      }
    },
    [echo, fs, identity, runStep],
  )

  /** Ctrl+C / Escape while a command runs. */
  const interrupt = useCallback(() => {
    const current = job.current
    if (!current || current.controller.signal.aborted) return false
    append(<Line className={tone.dim}>^C</Line>)
    current.controller.abort()
    return true
  }, [append])

  /** Lets the running command see a key first. */
  const sendKey = useCallback((e: KeyboardEvent) => job.current?.onKey?.(e) ?? false, [])

  /** Ctrl+C at the prompt: abandon the line, bash-style. */
  const cancelLine = useCallback(
    (value: string) =>
      echo(
        <>
          {value}
          <span className={tone.dim}>^C</span>
        </>,
      ),
    [echo],
  )

  const completeInput = useCallback(
    (value: string, caret: number) => {
      fs.syncApps(useApps.getState().installed)
      return complete(value, caret, { fs, cwd: cwdRef.current, home: identity.home, host: identity.host })
    },
    [fs, identity],
  )

  /** Lists the choices when Tab can't pick one, then the prompt comes back with the same text. */
  const showCompletions = useCallback(
    (value: string, list: { label: string; dir: boolean }[]) => {
      echo(value)
      append(
        <Columns
          items={list.map((c) => ({
            key: c.label,
            width: c.label.length,
            label: <span className={c.dir ? `${tone.blue} font-semibold` : tone.fg}>{c.label}</span>,
          }))}
        />,
      )
    },
    [append, echo],
  )

  const clear = useCallback(() => setEntries([]), [])

  return {
    entries,
    cwd,
    running,
    screen,
    history: history.current,
    run,
    interrupt,
    sendKey,
    cancelLine,
    completeInput,
    showCompletions,
    clear,
  }
}
