import type { Command, ShellContext } from '../types'
import { C, Line, Table, tone } from '../ui'
import { flags } from './files'

const SUDO_REPLIES = [
  'Nice try. You already run this Plumos; the system files run themselves.',
  'Permission politely declined. Plumos keeps its core read-only so updates never break.',
  'On vacation. Everything you need here works without it — try "help".',
]

/** Well-known local names resolve; anything else gets a stable fake address. */
function resolveHost(host: string, self: string): { ip: string; base: number } | null {
  const h = host.toLowerCase()
  if (h === 'localhost' || h === '127.0.0.1' || h === self || h === `${self}.local`)
    return { ip: '127.0.0.1', base: 0.04 }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h))
    return { ip: h, base: h.startsWith('192.168.') || h.startsWith('10.') ? 1.8 : 14 }
  if (h.endsWith('.local') || h === 'router') return { ip: '192.168.1.1', base: 1.6 }
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h)) return null
  const n = [...h].reduce((a, ch) => (a * 33 + ch.charCodeAt(0)) >>> 0, 5381)
  return {
    ip: `${(n % 200) + 20}.${(n >>> 8) % 255}.${(n >>> 16) % 255}.${((n >>> 24) % 250) + 3}`,
    base: 9 + (n % 30),
  }
}

async function ping(ctx: ShellContext) {
  const f = flags(ctx.args)
  const host = f.rest.find((a) => !/^\d+$/.test(a)) ?? f.rest[0]
  if (!host) return ctx.error('usage error: Destination address required')
  const countFlag = ctx.args.indexOf('-c')
  const count = countFlag >= 0 ? Math.max(1, parseInt(ctx.args[countFlag + 1] ?? '4', 10) || 4) : Infinity
  const target = resolveHost(host, ctx.host)
  if (!target) return ctx.error(`${host}: Name or service not known`)

  ctx.print(
    <Line>
      PING {host} ({target.ip}) 56(84) bytes of data.
    </Line>,
  )
  const times: number[] = []
  const started = Date.now()
  for (let seq = 1; seq <= count && !ctx.signal.aborted; seq++) {
    const time = target.base * (0.8 + Math.random() * 0.5) + (Math.random() < 0.08 ? target.base * 1.5 : 0)
    times.push(time)
    ctx.print(
      <Line>
        64 bytes from {target.ip}: icmp_seq={seq} ttl={target.ip === '127.0.0.1' ? 64 : 57} time=
        <C t={time > target.base * 1.8 ? 'yellow' : 'green'}>{time < 1 ? time.toFixed(3) : time.toFixed(1)}</C> ms
      </Line>,
    )
    if (seq < count) await ctx.sleep(1000)
  }
  const n = times.length
  const avg = times.reduce((a, b) => a + b, 0) / n
  const mdev = Math.sqrt(times.reduce((a, t) => a + (t - avg) ** 2, 0) / n)
  const fmt = (v: number) => v.toFixed(3)
  ctx.print(<Line />)
  ctx.print(<Line>--- {host} ping statistics ---</Line>)
  ctx.print(
    <Line>
      {n} packets transmitted, {n} received, <C t="green">0% packet loss</C>, time {Date.now() - started}ms
    </Line>,
  )
  ctx.print(
    <Line>
      rtt min/avg/max/mdev = {fmt(Math.min(...times))}/{fmt(avg)}/{fmt(Math.max(...times))}/{fmt(mdev)} ms
    </Line>,
  )
  return ctx.signal.aborted ? 130 : 0
}

function history(ctx: ShellContext) {
  if (ctx.args[0] === '-c') {
    ctx.print(
      <Line className={tone.muted}>History is kept on this device; clear it from your browser if you need to.</Line>,
    )
    return
  }
  const list = ctx.history
  const start = Math.max(0, list.length - 200)
  ctx.print(
    <Table
      gap={2}
      align={['right', 'left']}
      rows={list.slice(start).map((line, i) => [<span className={tone.dim}>{start + i + 1}</span>, line])}
    />,
  )
}

async function exit(ctx: ShellContext) {
  ctx.print(<Line>logout</Line>)
  ctx.print(<Line className={tone.dim}>Connection to {ctx.host}.local closed.</Line>)
  await ctx.sleep(450)
  ctx.exit()
}

export const sessionCommands: Record<string, Command> = {
  clear: { run: (ctx) => ctx.clear(), summary: 'Clear the screen (Ctrl+L)', group: 'Session' },
  history: { run: history, summary: 'Commands you have run', group: 'Session' },
  ping: {
    run: ping,
    summary: 'Check a host is reachable (Ctrl+C to stop)',
    usage: 'ping [-c count] <host>',
    group: 'Network',
    complete: 'host',
  },
  sudo: {
    run: (ctx) => {
      ctx.print(
        <Line>
          <C t="plum">[sudo]</C> {SUDO_REPLIES[Math.floor(Math.random() * SUDO_REPLIES.length)]}
        </Line>,
      )
      return 1
    },
    summary: 'Run as administrator (sort of)',
    group: 'Session',
    complete: 'command',
  },
  exit: { run: exit, summary: 'Close the terminal', group: 'Session' },
  logout: { run: exit, summary: 'Close the terminal', group: 'Session', hidden: true },
}
