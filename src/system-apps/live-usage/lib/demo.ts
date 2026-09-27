import type { AppCategory, AppInfo } from '@/apps/types'
import type { Sample } from '@/stores/system'

/*
 * Per-app and memory-breakdown figures are simulated: each app gets a
 * deterministic base load from its id, plus smooth drift and a little noise
 * that depend only on the sample's timestamp. The app numbers are then scaled
 * to the machine's real totals, so they always add up to what the cards show.
 */

/** FNV-1a hash of a string, mapped to [0, 1). */
export function hash01(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) / 4294967296
}

/** Relative [cpu, memory, burstiness] for apps we know the character of. */
const KNOWN: Record<string, [number, number, number]> = {
  ollama: [2.6, 3.4, 1],
  windows: [2.1, 3.6, 0.3],
  android: [1.6, 2.4, 0.3],
  'bitcoin-node': [1.3, 1.5, 0.4],
  immich: [0.9, 1.2, 0.6],
  'hermes-agent': [0.8, 0.55, 0.8],
  openclaw: [0.7, 0.5, 0.7],
  jellyfin: [0.55, 0.62, 0.5],
  plex: [0.5, 0.56, 0.4],
  'home-assistant': [0.45, 0.5, 0.1],
  nextcloud: [0.4, 0.46, 0.2],
  n8n: [0.3, 0.36, 0.3],
}

const BY_CATEGORY: Partial<Record<AppCategory, [number, number, number]>> = {
  ai: [1.3, 1.4, 0.8],
  'virtual-machines': [1.8, 2.8, 0.3],
  media: [0.55, 0.6, 0.5],
  bitcoin: [1, 1.2, 0.3],
  files: [0.5, 0.6, 0.3],
  developer: [0.45, 0.5, 0.3],
}

export interface AppProfile {
  id: string
  cpu: number
  mem: number
  burst: number
  periods: [number, number, number, number]
  phases: [number, number, number, number]
}

export function appProfile(app: AppInfo): AppProfile {
  const h = (salt: string) => hash01(`${app.id}:${salt}`)
  const known = KNOWN[app.id]
  const [cpu, mem, burst] = known ?? BY_CATEGORY[app.category] ?? [0.3, 0.35, 0.2]
  const scale = known ? 1 : 0.8 + h('scale') * 0.4
  return {
    id: app.id,
    cpu: cpu * scale,
    mem: mem * scale,
    burst,
    periods: [30e3 + h('p0') * 40e3, 9e3 + h('p1') * 7e3, 80e3 + h('p2') * 80e3, 60e3 + h('p3') * 60e3],
    phases: [h('f0'), h('f1'), h('f2'), h('f3')].map((f) => f * Math.PI * 2) as AppProfile['phases'],
  }
}

const wave = (t: number, period: number, phase: number) => Math.sin((t / period) * Math.PI * 2 + phase)
const noise = (id: string, t: number) => hash01(`${id}@${Math.round(t / 2500)}`) - 0.5

function cpuWeight(p: AppProfile, t: number): number {
  const drift = 1 + 0.45 * wave(t, p.periods[0], p.phases[0]) + 0.25 * wave(t, p.periods[1], p.phases[1])
  // Bursty apps (models, agents, transcoding) spike now and then.
  const spike = p.burst * 5 * Math.max(0, wave(t, p.periods[2], p.phases[2]) - 0.65)
  return Math.max(0.03, p.cpu * (drift + 0.5 * noise(p.id, t) + spike))
}

function memWeight(p: AppProfile, t: number): number {
  return p.mem * (1 + 0.05 * wave(t, p.periods[3], p.phases[3]) + 0.02 * noise(p.id, t))
}

export interface MemorySplit {
  apps: number
  system: number
  cache: number
  free: number
}

/** Splits used memory into apps/system, and some of the rest into cache. */
export function memorySplit(used: number, total: number, t: number): MemorySplit {
  const u = Math.max(0, Math.min(used, total))
  const apps = u * (0.64 + 0.02 * Math.sin(t / 53e3))
  const cache = (total - u) * (0.42 + 0.03 * Math.sin(t / 71e3 + 1))
  return { apps, system: u - apps, cache, free: total - u - cache }
}

/** Share of the machine's CPU time spent in apps (the rest is the system). */
const APP_CPU_SHARE = 0.82

export interface AppUsage {
  /** Percent of the whole machine's CPU. */
  cpu: number
  /** Bytes. */
  memory: number
}

export function appUsageAt(profiles: AppProfile[], sample: Sample, totalMemory: number): AppUsage[] {
  const cpu = profiles.map((p) => cpuWeight(p, sample.t))
  const mem = profiles.map((p) => memWeight(p, sample.t))
  const cpuSum = cpu.reduce((a, b) => a + b, 0) || 1
  const memSum = mem.reduce((a, b) => a + b, 0) || 1
  const appsMemory = memorySplit(sample.memory, totalMemory, sample.t).apps
  return profiles.map((_, i) => ({
    cpu: (cpu[i] / cpuSum) * sample.cpu * APP_CPU_SHARE,
    memory: (mem[i] / memSum) * appsMemory,
  }))
}
