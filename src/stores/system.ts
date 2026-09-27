import { create } from 'zustand'

export interface SystemStats {
  /** `live` when read from the Plumos server, `demo` when simulated in the browser. */
  source: 'live' | 'demo'
  hostname: string
  os: string
  arch: string
  /** Seconds since boot. */
  uptime: number
  cpu: { usage: number; temperature: number | null; cores: number; model: string; load: number[] }
  memory: { total: number; used: number }
  storage: { total: number; used: number }
  /** Bytes per second. */
  network: { rx: number; tx: number } | null
  timestamp: number
}

export interface Sample {
  t: number
  cpu: number
  temperature: number | null
  memory: number
  storage: number
  rx: number
  tx: number
}

const HISTORY = 90
const INTERVAL = 2500

interface SystemState {
  stats: SystemStats
  history: Sample[]
}

const GB = 1e9

/** Believable numbers for when there's no Plumos server behind the page. */
function demoStats(prev?: SystemStats): SystemStats {
  const walk = (value: number, step: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value + (Math.random() - 0.5) * step))
  return {
    source: 'demo',
    hostname: 'plumos',
    os: 'Plumos 1.0 (Debian 13)',
    arch: 'x64',
    uptime: (prev?.uptime ?? 12 * 86400 + 3 * 3600) + INTERVAL / 1000,
    cpu: {
      usage: walk(prev?.cpu.usage ?? 14, 9, 3, 68),
      temperature: walk(prev?.cpu.temperature ?? 56, 1.6, 48, 71),
      cores: 8,
      model: 'Intel N150',
      load: [0.42, 0.51, 0.47],
    },
    memory: { total: 16 * GB, used: walk(prev?.memory.used ?? 5.8 * GB, 0.18 * GB, 4.9 * GB, 7.2 * GB) },
    storage: { total: 2e12, used: prev?.storage.used ?? 256 * GB },
    network: {
      rx: walk(prev?.network?.rx ?? 1.2e6, 1.4e6, 4e4, 9e6),
      tx: walk(prev?.network?.tx ?? 3e5, 5e5, 1e4, 4e6),
    },
    timestamp: Date.now(),
  }
}

const toSample = (s: SystemStats): Sample => ({
  t: s.timestamp,
  cpu: s.cpu.usage,
  temperature: s.cpu.temperature,
  memory: s.memory.used,
  storage: s.storage.used,
  rx: s.network?.rx ?? 0,
  tx: s.network?.tx ?? 0,
})

const initial = demoStats()

export const useSystem = create<SystemState>(() => ({
  stats: initial,
  history: [toSample(initial)],
}))

let started = false
let live: boolean | null = null

async function poll() {
  const prev = useSystem.getState().stats
  let next: SystemStats | null = null
  if (live !== false) {
    try {
      const res = await fetch('/api/system', { cache: 'no-store' })
      if (res.ok && res.headers.get('content-type')?.includes('json')) {
        next = (await res.json()) as SystemStats
        live = true
      } else if (live === null) live = false
    } catch {
      if (live === null) live = false
    }
  }
  next ??= demoStats(prev.source === 'demo' ? prev : undefined)
  useSystem.setState((s) => ({ stats: next, history: [...s.history, toSample(next)].slice(-HISTORY) }))
}

/** Starts polling the Plumos server once (falls back to demo data). */
export function startSystemPolling() {
  if (started) return
  started = true
  void poll()
  setInterval(poll, INTERVAL)
}
