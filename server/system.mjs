// Reads live system stats from the machine Plumos is running on.
// Zero dependencies: only Node built-ins and Linux /proc + /sys when present.
import os from 'node:os'
import { readFile, readdir, statfs } from 'node:fs/promises'

const STORAGE_PATH = process.env.PLUMOS_STORAGE_PATH || '/'

let lastCpu = cpuSnapshot()
let lastNet = null

function cpuSnapshot() {
  let idle = 0
  let total = 0
  for (const cpu of os.cpus()) {
    for (const [type, time] of Object.entries(cpu.times)) {
      total += time
      if (type === 'idle') idle += time
    }
  }
  return { idle, total, at: Date.now() }
}

async function cpuUsage() {
  let now = cpuSnapshot()
  // First call (or calls too close together): take a short sample.
  if (now.total - lastCpu.total < 50) {
    await new Promise((r) => setTimeout(r, 250))
    now = cpuSnapshot()
  }
  const idle = now.idle - lastCpu.idle
  const total = now.total - lastCpu.total
  lastCpu = now
  return total > 0 ? Math.max(0, Math.min(100, (1 - idle / total) * 100)) : 0
}

async function cpuTemperature() {
  try {
    const zones = await readdir('/sys/class/thermal')
    const temps = await Promise.all(
      zones
        .filter((z) => z.startsWith('thermal_zone'))
        .map((z) =>
          readFile(`/sys/class/thermal/${z}/temp`, 'utf8')
            .then((t) => Number(t) / 1000)
            .catch(() => null),
        ),
    )
    const valid = temps.filter((t) => t !== null && t > 0 && t < 130)
    return valid.length ? Math.max(...valid) : null
  } catch {
    return null
  }
}

async function memory() {
  const total = os.totalmem()
  try {
    // MemAvailable is a far better "used" figure than os.freemem() on Linux.
    const info = await readFile('/proc/meminfo', 'utf8')
    const available = Number(/MemAvailable:\s+(\d+)/.exec(info)?.[1]) * 1024
    if (available) return { total, used: total - available }
  } catch {}
  return { total, used: total - os.freemem() }
}

async function storage() {
  try {
    const s = await statfs(STORAGE_PATH)
    const total = s.blocks * s.bsize
    const free = s.bavail * s.bsize
    return { total, used: total - free }
  } catch {
    return { total: 0, used: 0 }
  }
}

async function network() {
  try {
    const text = await readFile('/proc/net/dev', 'utf8')
    let rx = 0
    let tx = 0
    for (const line of text.split('\n').slice(2)) {
      const [name, rest] = line.split(':')
      if (!rest || name.trim() === 'lo') continue
      const fields = rest.trim().split(/\s+/).map(Number)
      rx += fields[0]
      tx += fields[8]
    }
    const now = { rx, tx, at: Date.now() }
    const prev = lastNet
    lastNet = now
    if (!prev) return { rx: 0, tx: 0 }
    const secs = (now.at - prev.at) / 1000 || 1
    return { rx: Math.max(0, (now.rx - prev.rx) / secs), tx: Math.max(0, (now.tx - prev.tx) / secs) }
  } catch {
    return null
  }
}

async function osName() {
  try {
    const release = await readFile('/etc/os-release', 'utf8')
    return /PRETTY_NAME="?([^"\n]+)"?/.exec(release)?.[1] ?? `${os.type()} ${os.release()}`
  } catch {
    return `${os.type()} ${os.release()}`
  }
}

export async function getSystemStats() {
  const [usage, temperature, mem, disk, net, osPretty] = await Promise.all([
    cpuUsage(),
    cpuTemperature(),
    memory(),
    storage(),
    network(),
    osName(),
  ])
  const cpus = os.cpus()
  return {
    source: 'live',
    hostname: os.hostname(),
    os: osPretty,
    arch: os.arch(),
    uptime: os.uptime(),
    cpu: {
      usage,
      temperature,
      cores: cpus.length,
      model: cpus[0]?.model?.trim() ?? 'Unknown CPU',
      load: os.loadavg(),
    },
    memory: mem,
    storage: disk,
    network: net,
    timestamp: Date.now(),
  }
}
