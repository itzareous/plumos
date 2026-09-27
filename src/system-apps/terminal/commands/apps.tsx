import { catalog, findApp } from '@/apps/catalog'
import type { AppInfo } from '@/apps/types'
import { launchApp } from '@/lib/launch'
import { formatBytes } from '@/lib/format'
import { appUrl, useApps } from '@/stores/apps'
import { useWindows, type SheetId } from '@/stores/windows'
import { closest } from '../parse'
import type { Command, ShellContext } from '../types'
import { bar, C, Line, Linkify, Table, tone } from '../ui'
import { flags } from './files'

/** Built-in apps `open` understands, besides installed app ids. */
export const SHEETS: Record<string, { id: SheetId; name: string }> = {
  files: { id: 'files', name: 'Files' },
  photos: { id: 'photos', name: 'Photos' },
  settings: { id: 'settings', name: 'Settings' },
  'app-store': { id: 'app-store', name: 'App Store' },
  'live-usage': { id: 'live-usage', name: 'Live Usage' },
}

const SPINNER = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'

function urlOf(app: AppInfo) {
  return appUrl(app, useApps.getState().links)
}

function suggestApp(ctx: ShellContext, id: string, pool: string[]) {
  const guess = closest(id, pool)
  if (guess)
    ctx.print(
      <Line className={tone.muted}>
        Did you mean <C t="fg">{guess}</C>?
      </Line>,
    )
}

function apps(ctx: ShellContext) {
  const f = flags(ctx.args)
  const { installed, installing } = useApps.getState()
  const all = f.has('a') || f.has('all')
  const list = all ? catalog : installed.map(findApp).filter((a): a is AppInfo => Boolean(a))
  const extra = Object.keys(installing).filter((id) => !all && !installed.includes(id))
  const rows = [...list, ...extra.map(findApp).filter((a): a is AppInfo => Boolean(a))].map((app) => {
    const job = installing[app.id]
    const isInstalled = installed.includes(app.id)
    const status = job ? (
      <C t="yellow">◐ installing {Math.round(job.progress * 100)}%</C>
    ) : isInstalled ? (
      <C t="green">● running</C>
    ) : (
      <span className={tone.dim}>○ available</span>
    )
    const url = isInstalled ? urlOf(app) : null
    return [
      <C t="plum" bold>
        {app.id}
      </C>,
      app.name,
      <span className={tone.muted}>{app.version}</span>,
      status,
      app.kind === 'vm' ? (
        <span className={tone.dim}>virtual machine</span>
      ) : url ? (
        <Linkify text={url} />
      ) : (
        <span className={tone.dim}>—</span>
      ),
    ]
  })
  if (!rows.length) {
    ctx.print(<Line className={tone.muted}>No apps installed yet. Try 'apps --all' to browse the App Store.</Line>)
    return
  }
  ctx.print(<Table head={['ID', 'NAME', 'VERSION', 'STATUS', 'OPENS AT']} rows={rows} narrow={[1, 2, 4]} />)
  ctx.print(
    <Line className={tone.dim}>
      {installed.length} installed · {catalog.length - installed.length} more in the App Store
      {all ? '' : " · 'apps --all' lists everything"}
    </Line>,
  )
}

type Phase = 'downloading' | 'installing' | 'starting'
const PHASES: { phase: Phase; label: string; from: number; to: number }[] = [
  { phase: 'downloading', label: 'download', from: 0, to: 0.7 },
  { phase: 'installing', label: 'install', from: 0.7, to: 0.95 },
  { phase: 'starting', label: 'start', from: 0.95, to: 1 },
]

function ProgressRow({
  label,
  fraction,
  width,
  done,
  frame,
  detail,
}: {
  label: string
  fraction: number
  width: number
  done: boolean
  frame: number
  detail?: string
}) {
  return (
    <div className="whitespace-pre tabular-nums">
      {'  '}
      {done ? <C t="green">✓</C> : <C t="yellow">{SPINNER[frame % SPINNER.length]}</C>} {label.padEnd(9)}
      <span className={tone.dim}>[</span>
      <span className={done ? tone.green : tone.plum}>{bar(fraction, width, '#', '')}</span>
      <span className={tone.dim}>{'.'.repeat(width - Math.round(Math.max(0, Math.min(1, fraction)) * width))}]</span>
      {` ${String(Math.round(fraction * 100)).padStart(3)}%`}
      {detail && <span className={tone.dim}>{`  ${detail}`}</span>}
    </div>
  )
}

async function install(ctx: ShellContext) {
  const id = ctx.args[0]
  if (!id) return ctx.error("which app? Usage: install <app-id> (see 'apps --all')")
  const app = findApp(id)
  if (!app) {
    ctx.error(`${id}: no app with that id in the App Store`)
    suggestApp(
      ctx,
      id,
      catalog.map((a) => a.id),
    )
    return 1
  }
  if (useApps.getState().installed.includes(id)) {
    ctx.print(
      <Line>
        {app.name} is already installed. Open it with <C t="plum">open {id}</C>.
      </Line>,
    )
    return
  }
  if (!useApps.getState().installing[id]) useApps.getState().install(id)

  const width = Math.max(10, Math.min(30, ctx.cols - 34))
  const size = app.size ?? 5e8
  ctx.print(
    <Line>
      <C t="cyan">==&gt;</C> Installing{' '}
      <C t="plum" bold>
        {app.name}
      </C>{' '}
      {app.version}
      <span className={tone.dim}> · {formatBytes(size)} download</span>
    </Line>,
  )

  let frame = 0
  let current = -1
  let handle = ctx.print(null)
  const render = (progress: number, finished: boolean) => {
    const index = finished ? PHASES.length - 1 : PHASES.findIndex((p) => progress < p.to)
    // Close off earlier phases as each one completes.
    while (current < index) {
      if (current >= 0) {
        const p = PHASES[current]
        handle.update(<ProgressRow label={p.label} fraction={1} width={width} done frame={0} />)
        handle = ctx.print(null)
      }
      current++
    }
    const p = PHASES[index]
    const fraction = finished ? 1 : Math.max(0, Math.min(1, (progress - p.from) / (p.to - p.from)))
    const detail = p.phase === 'downloading' ? `${formatBytes(size * fraction)} / ${formatBytes(size)}` : undefined
    handle.update(
      <ProgressRow label={p.label} fraction={fraction} width={width} done={finished} frame={frame++} detail={detail} />,
    )
  }

  const outcome = await new Promise<'done' | 'gone' | 'interrupted'>((resolve) => {
    let unsub = () => {}
    const check = (s: ReturnType<typeof useApps.getState>) => {
      const job = s.installing[id]
      if (job) return render(job.progress, false)
      unsub()
      if (s.installed.includes(id)) {
        render(1, true)
        resolve('done')
      } else resolve('gone')
    }
    unsub = useApps.subscribe(check)
    check(useApps.getState())
    void ctx.interrupted.then(() => {
      unsub()
      resolve('interrupted')
    })
  })

  if (outcome === 'interrupted') {
    ctx.print(
      <Line className={tone.muted}>{app.name} keeps installing in the background — watch it in the App Store.</Line>,
    )
    return 130
  }
  if (outcome === 'gone') return ctx.error(`${id}: install was cancelled`)
  const url = urlOf(app)
  ctx.print(
    <Line>
      <C t="green">✓</C>{' '}
      <C t="fg" bold>
        {app.name}
      </C>{' '}
      is installed and running
      {url && app.kind !== 'vm' && (
        <>
          {' at '}
          <Linkify text={url} />
        </>
      )}
    </Line>,
  )
  ctx.print(
    <Line className={tone.dim}>
      {'  '}Open it with <C t="plum">open {id}</C>
    </Line>,
  )
}

/** Waits for a y/n answer. Enter or anything else means no. */
function confirm(ctx: ShellContext, question: string) {
  const handle = ctx.print(
    <Line>
      {question} <span className={tone.dim}>[y/N]</span>{' '}
    </Line>,
  )
  return new Promise<boolean>((resolve) => {
    ctx.onKey((e) => {
      if (e.key.length !== 1 && e.key !== 'Enter') return false
      const yes = e.key.toLowerCase() === 'y'
      handle.update(
        <Line>
          {question} <span className={tone.dim}>[y/N]</span> {yes ? 'y' : e.key === 'Enter' ? '' : e.key}
        </Line>,
      )
      resolve(yes)
      return true
    })
    void ctx.interrupted.then(() => resolve(false))
  })
}

async function uninstall(ctx: ShellContext) {
  const f = flags(ctx.args)
  const id = f.rest[0]
  if (!id) return ctx.error('which app? Usage: uninstall [-y] <app-id>')
  const app = findApp(id)
  const { installed } = useApps.getState()
  if (!app || !installed.includes(id)) {
    ctx.error(`${id}: not installed`)
    suggestApp(ctx, id, installed)
    return 1
  }
  if (!f.has('y') && !(await confirm(ctx, `Remove ${app.name} and all of its data?`))) {
    if (!ctx.signal.aborted) ctx.print(<Line className={tone.muted}>Nothing was removed.</Line>)
    return 1
  }
  for (const step of [`Stopping ${id}`, 'Removing containers', 'Deleting app data']) {
    const handle = ctx.print(
      <Line>
        <C t="cyan">==&gt;</C> {step}…
      </Line>,
    )
    await ctx.sleep(380 + Math.random() * 380)
    if (ctx.signal.aborted) return 130
    handle.update(
      <Line>
        <C t="cyan">==&gt;</C> {step}… <C t="green">done</C>
      </Line>,
    )
  }
  useApps.getState().uninstall(id)
  ctx.print(
    <Line>
      <C t="green">✓</C> {app.name} was uninstalled.
    </Line>,
  )
}

async function open(ctx: ShellContext) {
  const target = ctx.args[0]
  if (!target)
    return ctx.error('what should I open? Usage: open <app-id | files | photos | settings | app-store | live-usage>')
  if (/^https?:\/\//.test(target)) {
    window.open(target, '_blank', 'noopener,noreferrer')
    ctx.print(
      <Line>
        Opening <Linkify text={target} />
      </Line>,
    )
    return
  }
  if (target === 'terminal') {
    ctx.print(<Line className={tone.muted}>You&apos;re already here.</Line>)
    return
  }
  const sheet = SHEETS[target]
  if (sheet) {
    ctx.print(<Line>Opening {sheet.name}…</Line>)
    await ctx.sleep(260)
    if (!ctx.signal.aborted) useWindows.getState().open(sheet.id)
    return
  }
  const app = findApp(target)
  const { installed } = useApps.getState()
  if (app && installed.includes(target)) {
    const url = app.kind === 'vm' ? null : urlOf(app)
    ctx.print(
      <Line>
        Opening {app.name}
        {url ? (
          <>
            {' at '}
            <Linkify text={url} />
          </>
        ) : (
          '…'
        )}
      </Line>,
    )
    await ctx.sleep(200)
    if (!ctx.signal.aborted) launchApp(app)
    return
  }
  if (app) {
    ctx.error(`${app.name} isn't installed yet`)
    ctx.print(
      <Line className={tone.muted}>
        Install it with <C t="plum">install {target}</C>
      </Line>,
    )
    return 1
  }
  ctx.error(`${target}: no app or place with that name`)
  suggestApp(ctx, target, [...Object.keys(SHEETS), ...installed])
  return 1
}

export const appCommands: Record<string, Command> = {
  apps: {
    run: apps,
    summary: 'Installed apps and their status (--all for the store)',
    usage: 'apps [--all]',
    group: 'Apps',
  },
  install: {
    run: install,
    summary: 'Install an app from the App Store',
    usage: 'install <app-id>',
    group: 'Apps',
    complete: 'available',
  },
  uninstall: {
    run: uninstall,
    summary: 'Remove an app and its data',
    usage: 'uninstall [-y] <app-id>',
    group: 'Apps',
    complete: 'installed',
  },
  open: {
    run: open,
    summary: 'Open an app, Files, Photos, Settings…',
    usage: 'open <app-id | place>',
    group: 'Apps',
    complete: 'open',
  },
}
