import type { ReactNode } from 'react'
import type { Vfs } from './vfs'

/** One block of scrollback: a printed line, a table, a prompt echo… */
export interface Entry {
  id: number
  node: ReactNode
}

/** Returned by `print` so streaming commands can redraw their last line. */
export interface LineHandle {
  update: (node: ReactNode) => void
}

/** Who and where the shell is. */
export interface Identity {
  user: string
  host: string
  home: string
}

/** Everything a command can do while it runs. */
export interface ShellContext extends Identity {
  /** The command name as typed. */
  name: string
  /** Arguments after the command name, with quotes and `~` resolved. */
  args: string[]
  cwd: string
  /** The previous directory, for `cd -`. */
  oldCwd: string
  fs: Vfs
  history: readonly string[]
  /** Width of the terminal in characters (for bars and tables). */
  cols: number
  /** Aborted by Ctrl+C / Escape. */
  signal: AbortSignal
  print: (node: ReactNode) => LineHandle
  /** Prints `<name>: <message>` in red and marks the command as failed. */
  error: (message: ReactNode) => void
  setCwd: (path: string) => void
  clear: () => void
  /** Shows a full-screen view (like `top`) until the command ends. */
  screen: (node: ReactNode) => void
  /** Receives keys while the command runs; return true when handled. */
  onKey: (handler: (e: KeyboardEvent) => boolean) => void
  /** Resolves after `ms`, or early when the command is interrupted. */
  sleep: (ms: number) => Promise<void>
  /** Resolves when the command is interrupted. */
  interrupted: Promise<void>
  /** Closes the terminal sheet. */
  exit: () => void
}

/** A command returns nothing, an exit code, or a promise of either. */
export type CommandResult = void | number | Promise<void | number>

export interface Command {
  run: (ctx: ShellContext) => CommandResult
  /** One line for `help`. */
  summary: string
  usage?: string
  group: 'Files' | 'System' | 'Apps' | 'Network' | 'Session'
  /** What Tab completes after the command name. */
  complete?: 'path' | 'dir' | 'command' | 'installed' | 'available' | 'open' | 'host'
  hidden?: boolean
}
