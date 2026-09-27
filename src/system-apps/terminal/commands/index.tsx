import type { Command, ShellContext } from '../types'
import { C, Line, Table, tone } from '../ui'
import { appCommands } from './apps'
import { fileCommands } from './files'
import { sessionCommands } from './session'
import { systemCommands } from './system'

const GROUPS: Command['group'][] = ['Files', 'System', 'Apps', 'Network', 'Session']

function help(ctx: ShellContext) {
  const topic = ctx.args[0]
  if (topic) return man({ ...ctx, args: [topic] })
  const visible = Object.entries(commands).filter(([, c]) => !c.hidden)
  const rows = GROUPS.flatMap((group) =>
    visible
      .filter(([, c]) => c.group === group)
      .map(([name, c], i) => [
        <span className={tone.dim}>{i === 0 ? group : ''}</span>,
        <C t="green" bold>
          {name}
        </C>,
        <span className="max-sm:hidden">{c.usage?.replace(/^\S+\s?/, '') ?? ''}</span>,
        c.summary,
      ]),
  )
  ctx.print(
    <Line>
      <C t="plum" bold>
        plush
      </C>{' '}
      — the Plumos shell. These commands are available:
    </Line>,
  )
  ctx.print(<Line />)
  ctx.print(<Table head={['', 'COMMAND', 'ARGUMENTS', 'WHAT IT DOES']} rows={rows} narrow={[0, 2]} gap={2} wrapLast />)
  ctx.print(<Line />)
  ctx.print(
    <Line className={tone.muted}>
      <C t="fg">Tab</C> completes commands, app ids and paths · <C t="fg">↑ ↓</C> history · <C t="fg">Ctrl+C</C> stops a
      command · <C t="fg">Ctrl+L</C> clears
    </Line>,
  )
}

function man(ctx: ShellContext) {
  const name = ctx.args[0]
  if (!name) return ctx.error('What manual page do you want? Try: man ls')
  const cmd = commands[name]
  if (!cmd) return ctx.error(`No manual entry for ${name}`)
  ctx.print(
    <Line>
      <C t="green" bold>
        {name}
      </C>{' '}
      — {cmd.summary}
    </Line>,
  )
  ctx.print(
    <Line>
      <span className={tone.dim}>usage: </span>
      {cmd.usage ?? name}
    </Line>,
  )
}

export const commands: Record<string, Command> = {
  help: { run: help, summary: 'Show this list', group: 'Session', complete: 'command' },
  ...fileCommands,
  ...systemCommands,
  ...appCommands,
  ...sessionCommands,
  man: {
    run: man,
    summary: 'How to use a command',
    usage: 'man <command>',
    group: 'Session',
    complete: 'command',
    hidden: true,
  },
}

/** Shortcuts expanded before running, like a tiny ~/.plushrc. */
export const aliases: Record<string, string[]> = {
  ll: ['ls', '-l'],
  la: ['ls', '-la'],
  '..': ['cd', '..'],
  htop: ['top'],
  cls: ['clear'],
  quit: ['exit'],
  fastfetch: ['neofetch'],
}
