import { useContext, useMemo, useRef } from 'react'
import { cn } from '@/lib/cn'
import { useApps } from '@/stores/apps'
import { useSystem } from '@/stores/system'
import { useSettings } from '@/stores/settings'
import { formatTemperature } from '@/lib/format'
import { si } from './format'
import { C, TermCols, tone } from './ui'

interface Proc {
  name: string
  user: string
  /** Relative share of CPU and memory. */
  cpu: number
  mem: number
}

const SYSTEM: Proc[] = [
  { name: 'plumosd', user: 'root', cpu: 3, mem: 180 },
  { name: 'dockerd', user: 'root', cpu: 2, mem: 140 },
  { name: 'containerd', user: 'root', cpu: 1.2, mem: 60 },
  { name: 'postgres', user: 'postgres', cpu: 1.6, mem: 420 },
  { name: 'redis-server', user: 'redis', cpu: 0.6, mem: 30 },
  { name: 'smbd', user: 'root', cpu: 0.5, mem: 42 },
  { name: 'caddy', user: 'root', cpu: 0.4, mem: 45 },
  { name: 'avahi-daemon', user: 'avahi', cpu: 0.1, mem: 4 },
  { name: 'sshd', user: 'root', cpu: 0.1, mem: 8 },
  { name: 'systemd', user: 'root', cpu: 0.1, mem: 12 },
]

const APP_PROCS: Record<string, Omit<Proc, 'user'>[]> = {
  android: [{ name: 'qemu-android', cpu: 6, mem: 2900 }],
  windows: [{ name: 'qemu-windows', cpu: 9, mem: 3800 }],
  immich: [
    { name: 'immich-server', cpu: 3, mem: 520 },
    { name: 'immich-ml', cpu: 4, mem: 880 },
  ],
  jellyfin: [{ name: 'jellyfin', cpu: 2.5, mem: 390 }],
  ollama: [{ name: 'ollama', cpu: 5, mem: 1500 }],
  'home-assistant': [{ name: 'hass', cpu: 2.2, mem: 460 }],
  'hermes-agent': [{ name: 'hermes-agent', cpu: 1.8, mem: 310 }],
  n8n: [{ name: 'n8n', cpu: 1, mem: 240 }],
  nextcloud: [{ name: 'php-fpm', cpu: 1.2, mem: 280 }],
  'bitcoin-node': [{ name: 'bitcoind', cpu: 4.5, mem: 720 }],
  openclaw: [{ name: 'openclaw', cpu: 2, mem: 350 }],
  plex: [{ name: 'plex-media-srv', cpu: 1.6, mem: 330 }],
}

const hash = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)

function cpuTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${m}:${s}`
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** A text meter: `3 [||||||||       21.4%]` */
function Meter({ label, fraction, text, width }: { label: string; fraction: number; text: string; width: number }) {
  const inner = Math.max(4, width - label.length - 3 - text.length)
  const n = Math.round(Math.max(0, Math.min(1, fraction)) * inner)
  const color = fraction > 0.8 ? tone.red : fraction > 0.5 ? tone.yellow : tone.green
  return (
    <div className="whitespace-pre">
      <span className={cn(tone.cyan, 'font-semibold')}>{label}</span>
      <span className={tone.dim}> [</span>
      <span className={color}>{'|'.repeat(n)}</span>
      {' '.repeat(inner - n)}
      <span className="tabular-nums">{text}</span>
      <span className={tone.dim}>]</span>
    </div>
  )
}

/** A live `top`: per-core meters, memory, and processes sorted by CPU. */
export function TopScreen({ user, host }: { user: string; host: string }) {
  const stats = useSystem((s) => s.stats)
  const installed = useApps((s) => s.installed)
  const unit = useSettings((s) => s.temperatureUnit)
  const cols = useContext(TermCols)
  const cores = useRef<number[]>([])

  const perCore = useMemo(() => {
    const prev = cores.current
    const next = Array.from({ length: stats.cpu.cores }, (_, i) => {
      const bias = 0.55 + ((hash(`core${i}`) % 90) / 100) * (i % 3 === 0 ? 1.3 : 0.9)
      const target = stats.cpu.usage * bias
      const value = (prev[i] ?? target) * 0.4 + target * 0.6 + (Math.random() - 0.5) * 8
      return Math.max(0.4, Math.min(100, value))
    })
    cores.current = next
    return next
  }, [stats])

  const procs = useMemo(() => {
    const list: Proc[] = [
      ...SYSTEM,
      ...installed.flatMap((id) =>
        (APP_PROCS[id] ?? [{ name: id.slice(0, 14), cpu: 1, mem: 200 }]).map((p) => ({ ...p, user: 'plumos' })),
      ),
      { name: 'plush', user, cpu: 0.1, mem: 5 },
      { name: 'top', user, cpu: 0.9, mem: 4 },
    ]
    const cpuTotal = list.reduce((s, p) => s + p.cpu, 0)
    const memTotal = list.reduce((s, p) => s + p.mem, 0)
    const budget = stats.cpu.usage * stats.cpu.cores * 0.92
    return list
      .map((p) => {
        const jitter = 0.35 + Math.random() * 1.3
        const cpu = Math.min(stats.cpu.cores * 100, (p.cpu / cpuTotal) * budget * jitter)
        const res = (p.mem / memTotal) * stats.memory.used * 0.86
        const h = hash(p.name)
        return {
          ...p,
          pid: p.name === 'systemd' ? 1 : 300 + (h % 9400),
          cpu,
          res,
          memPct: (res / stats.memory.total) * 100,
          time: (h % 5000) + (h % 97) / 100 + stats.uptime * (p.cpu / cpuTotal) * (stats.cpu.usage / 100) * 0.9,
          app: p.user === 'plumos',
        }
      })
      .sort((a, b) => b.cpu - a.cpu)
  }, [stats, installed, user])

  const now = new Date(stats.timestamp)
  const clock = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
  const days = Math.floor(stats.uptime / 86400)
  const hours = Math.floor((stats.uptime % 86400) / 3600)
  const mins = Math.floor((stats.uptime % 3600) / 60)
  const meterWidth = Math.max(18, Math.floor((cols - 3) / 2))
  const tasks = 180 + procs.length * 3
  const narrow = cols < 60

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="break-words whitespace-pre-wrap">
        <C t="plum" bold>
          top
        </C>{' '}
        - {clock} up {days ? `${days} day${days === 1 ? '' : 's'}, ` : ''}
        {hours}:{pad2(mins)}, 1 user, load average:{' '}
        <C t="yellow">{stats.cpu.load.map((l) => l.toFixed(2)).join(', ')}</C>
      </div>
      <div>
        Tasks:{' '}
        <C t="fg" bold>
          {tasks}
        </C>{' '}
        total,{' '}
        <C t="green" bold>
          1
        </C>{' '}
        running, {tasks - 1} sleeping
        <span className={tone.dim}> · </span>
        {host}
        {stats.cpu.temperature !== null && (
          <>
            <span className={tone.dim}> · </span>
            {formatTemperature(stats.cpu.temperature, unit)}
          </>
        )}
      </div>

      <div className="mt-[1em] grid w-fit grid-cols-2 gap-x-[1ch]">
        {perCore.map((v, i) => (
          <Meter key={i} label={String(i)} fraction={v / 100} text={`${v.toFixed(1)}%`} width={meterWidth} />
        ))}
      </div>
      <div className="mt-[0.5em] grid w-fit grid-cols-1 gap-x-[1ch] sm:grid-cols-2">
        <Meter
          label="Mem"
          fraction={stats.memory.used / stats.memory.total}
          text={`${si(stats.memory.used)}/${si(stats.memory.total)}`}
          width={narrow ? meterWidth * 2 + 1 : meterWidth}
        />
        <Meter
          label="Dsk"
          fraction={stats.storage.used / stats.storage.total}
          text={`${si(stats.storage.used)}/${si(stats.storage.total)}`}
          width={narrow ? meterWidth * 2 + 1 : meterWidth}
        />
      </div>

      <div className="mt-[1em] min-h-0 flex-1 overflow-hidden">
        <div
          className="grid w-full"
          style={{ gridTemplateColumns: narrow ? '6ch 6ch 6ch 7ch 1fr' : '7ch 10ch 7ch 7ch 8ch 11ch 1fr' }}
        >
          {(narrow
            ? ['PID', '%CPU', '%MEM', 'RES', 'COMMAND']
            : ['PID', 'USER', '%CPU', '%MEM', 'RES', 'TIME+', 'COMMAND']
          ).map((h, i) => (
            <div
              key={h}
              className={cn(
                'bg-white/[0.12] font-semibold text-white',
                h === 'COMMAND' || h === 'USER' ? 'pl-[1ch] text-left' : 'pr-[1ch] text-right',
                i === 0 && 'rounded-l-sm',
                h === 'COMMAND' && 'rounded-r-sm',
              )}
            >
              {h}
            </div>
          ))}
          {procs.map((p) => {
            const hot = p.cpu > 25
            const cells = [
              <span className={tone.muted}>{p.pid}</span>,
              ...(narrow
                ? []
                : [
                    <span className={p.user === 'root' ? tone.red : p.user === user ? tone.green : tone.fg}>
                      {p.user}
                    </span>,
                  ]),
              <span className={hot ? tone.yellow : undefined}>{p.cpu.toFixed(1)}</span>,
              p.memPct.toFixed(1),
              si(p.res),
              ...(narrow ? [] : [cpuTime(p.time)]),
              <span className={cn(p.app ? tone.plum : tone.fg, hot && 'font-semibold')}>{p.name}</span>,
            ]
            return cells.map((cell, i) => (
              <div
                key={`${p.name}-${i}`}
                className={cn(
                  'tabular-nums',
                  i === cells.length - 1 || (!narrow && i === 1)
                    ? 'truncate pl-[1ch] text-left'
                    : 'pr-[1ch] text-right',
                )}
              >
                {cell}
              </div>
            ))
          })}
        </div>
      </div>
      <div className={cn(tone.dim, 'pt-[0.5em]')}>
        Press <C t="fg">q</C> or <C t="fg">Ctrl+C</C> to quit
      </div>
    </div>
  )
}
