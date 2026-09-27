import { useApps } from '@/stores/apps'
import { useStorage } from '@/stores/storage'
import { useSystem } from '@/stores/system'
import { si } from '../format'
import type { Command, ShellContext } from '../types'
import { C, Line, Table } from '../ui'
import { Neofetch } from '../Neofetch'
import { TopScreen } from '../Top'

const pad2 = (n: number) => String(n).padStart(2, '0')

export function uptimeText(seconds: number) {
  const days = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const clock = h ? `${h}:${pad2(m)}` : `${m} min`
  return days ? `${days} day${days === 1 ? '' : 's'}, ${clock}` : clock
}

/** `Sun Sep 27 14:02:11 CEST 2026` */
export function dateText(d = new Date()) {
  const wd = d.toLocaleDateString('en-US', { weekday: 'short' })
  const mon = d.toLocaleDateString('en-US', { month: 'short' })
  const tz =
    new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(d).find((p) => p.type === 'timeZoneName')
      ?.value ?? 'UTC'
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
  return `${wd} ${mon} ${String(d.getDate()).padStart(2)} ${time} ${tz} ${d.getFullYear()}`
}

function uptime(ctx: ShellContext) {
  const { stats } = useSystem.getState()
  const now = new Date()
  const load = stats.cpu.load.map((l) => l.toFixed(2)).join(', ')
  ctx.print(
    <Line>
      {` ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())} up ${uptimeText(stats.uptime)},  1 user,  load average: `}
      <C t="yellow">{load}</C>
    </Line>,
  )
}

function free(ctx: ShellContext) {
  const { total, used } = useSystem.getState().stats.memory
  const cache = Math.max(0, (total - used) * 0.42)
  const shared = total * 0.019
  const swapUsed = used > total * 0.6 ? total * 0.01 : 0
  const row = (label: string, values: number[]) => [
    <C t="cyan">{label}</C>,
    ...values.map((v, i) => <span key={i}>{si(v)}</span>),
  ]
  ctx.print(
    <Table
      head={['', 'total', 'used', 'free', 'shared', 'buff/cache', 'available']}
      align={['left', 'right', 'right', 'right', 'right', 'right', 'right']}
      narrow={[4, 5]}
      rows={[
        row('Mem:', [total, used, total - used - cache, shared, cache, total - used]),
        [...row('Swap:', [4e9, swapUsed, 4e9 - swapUsed]), '', '', ''],
      ]}
    />,
  )
}

function df(ctx: ShellContext) {
  const { stats } = useSystem.getState()
  const drives = useStorage.getState().drives ?? []
  const external = drives.filter((d) => d.location === 'external')
  const disks = [
    { fs: '/dev/plumos', size: stats.storage.total, used: stats.storage.used, mount: '/' },
    { fs: 'tmpfs', size: stats.memory.total / 2, used: 1.3e6, mount: '/run' },
    ...external.map((d, i) => ({
      fs: `/dev/sd${String.fromCharCode(99 + i)}1`,
      size: d.size,
      used: d.size * 0.64,
      mount: `/media/${d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    })),
  ]
  ctx.print(
    <Table
      head={['Filesystem', 'Size', 'Used', 'Avail', 'Use%', 'Mounted on']}
      align={['left', 'right', 'right', 'right', 'right', 'left']}
      narrow={[0]}
      gap={2}
      rows={disks.map((d) => {
        const pct = Math.round((d.used / d.size) * 100)
        return [
          d.fs,
          si(d.size),
          si(d.used),
          si(d.size - d.used),
          <C t={pct >= 90 ? 'red' : pct >= 75 ? 'yellow' : 'green'}>{pct}%</C>,
          <C t="blue">{d.mount}</C>,
        ]
      })}
    />,
  )
}

async function top(ctx: ShellContext) {
  ctx.screen(<TopScreen user={ctx.user} host={ctx.host} />)
  await new Promise<void>((resolve) => {
    ctx.onKey((e) => {
      if (e.key !== 'q' && e.key !== 'Q') return false
      resolve()
      return true
    })
    void ctx.interrupted.then(resolve)
  })
}

function neofetch(ctx: ShellContext) {
  const { stats } = useSystem.getState()
  ctx.print(<Neofetch user={ctx.user} host={ctx.host} stats={stats} apps={useApps.getState().installed.length} />)
}

export const systemCommands: Record<string, Command> = {
  neofetch: { run: neofetch, summary: 'System summary, with the Plumos logo', group: 'System' },
  top: { run: top, summary: 'Live processes, CPU and memory (q to quit)', group: 'System' },
  uptime: { run: uptime, summary: 'How long the server has been running', group: 'System' },
  free: { run: free, summary: 'Memory usage', group: 'System' },
  df: { run: df, summary: 'Disk space', group: 'System' },
  date: { run: (ctx) => void ctx.print(<Line>{dateText()}</Line>), summary: 'Current date and time', group: 'System' },
  whoami: { run: (ctx) => void ctx.print(<Line>{ctx.user}</Line>), summary: 'Your user name', group: 'System' },
  hostname: { run: (ctx) => void ctx.print(<Line>{ctx.host}</Line>), summary: 'This server’s name', group: 'System' },
  uname: {
    run: (ctx) => {
      const all = ctx.args.includes('-a')
      const arch = useSystem.getState().stats.arch === 'arm64' ? 'aarch64' : 'x86_64'
      ctx.print(
        <Line>{all ? `Plumos ${ctx.host} 6.12.43-plumos #1 SMP PREEMPT_DYNAMIC ${arch} GNU/Linux` : 'Plumos'}</Line>,
      )
    },
    summary: 'Kernel and architecture (-a for everything)',
    group: 'System',
    hidden: true,
  },
}
