import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Physical drives. Internal drives are combined into one storage pool;
 * external (USB) drives show up in Files and can be imported from.
 * Demo data — a real backend would report these.
 */
export interface Drive {
  id: string
  name: string
  model: string
  /** Bytes. */
  size: number
  kind: 'nvme' | 'ssd' | 'hdd' | 'usb'
  /** Internal drives can join the pool; external ones are browsed/imported. */
  location: 'internal' | 'external'
  inPool: boolean
  health: 'healthy' | 'warning' | 'failing'
  /** °C */
  temperature: number
  /** When it was plugged in, for drives connected after setup. */
  connectedAt?: number
}

export type PoolMode = 'combined' | 'mirrored'

/** A long-running change to the pool, with simulated progress. */
export interface PoolTask {
  kind: 'expand' | 'shrink' | 'convert'
  /** The drive being added or removed. */
  driveId?: string
  /** The mode being converted to. */
  mode?: PoolMode
  /** 0..1 */
  progress: number
}

interface StorageState {
  drives: Drive[]
  /** combined = add up all space; mirrored = every file kept on two drives. */
  poolMode: PoolMode
  /** The pool change in progress, if any (not persisted). */
  task: PoolTask | null
  addToPool: (id: string) => void
  removeFromPool: (id: string) => void
  setPoolMode: (mode: PoolMode) => void
  /** Simulates plugging in a drive. */
  connectDrive: (drive: Drive) => void
  ejectDrive: (id: string) => void
  /** Adds a drive to the pool the slow way: spreads data onto it with progress, then joins it. */
  expandPool: (id: string, onDone?: () => void) => void
  /** Moves data off a drive with progress, then takes it out of the pool. */
  shrinkPool: (id: string, onDone?: () => void) => void
  /** Rebuilds the pool in the other mode with progress. */
  convertPool: (mode: PoolMode, onDone?: () => void) => void
  /** Plugs in a new blank 4 TB internal hard drive and returns it. */
  simulateNewDrive: () => Drive
}

const TB = 1e12
const GB = 1e9

export const useStorage = create<StorageState>()(
  persist(
    (set, get) => {
      /** Ticks `task.progress` from 0 to 1 over roughly `duration` ms, then runs `finish`. */
      const run = (task: Omit<PoolTask, 'progress'>, duration: number, finish: () => void) => {
        if (get().task) return
        const started = Date.now()
        set({ task: { ...task, progress: 0 } })
        const tick = () => {
          const t = Math.min(1, (Date.now() - started) / duration)
          // Ease out, with a little jitter so it reads as real work.
          const eased = 1 - Math.pow(1 - t, 1.6)
          const progress = t >= 1 ? 1 : Math.min(0.99, eased + (Math.random() - 0.5) * 0.01)
          if (t >= 1) {
            set({ task: { ...task, progress: 1 } })
            setTimeout(() => {
              finish()
              set({ task: null })
            }, 450)
            return
          }
          set((s) => ({ task: s.task ? { ...s.task, progress: Math.max(s.task.progress, progress) } : s.task }))
          setTimeout(tick, 90 + Math.random() * 120)
        }
        setTimeout(tick, 120)
      }

      return {
        drives: [
          { id: 'nvme0', name: 'SSD 1', model: 'Samsung 990 EVO', size: 1 * TB, kind: 'nvme', location: 'internal', inPool: true, health: 'healthy', temperature: 41 },
          { id: 'nvme1', name: 'SSD 2', model: 'Samsung 990 EVO', size: 1 * TB, kind: 'nvme', location: 'internal', inPool: true, health: 'healthy', temperature: 43 },
          { id: 'usb0', name: 'Old Backup Drive', model: 'WD Elements', size: 500 * GB, kind: 'usb', location: 'external', inPool: false, health: 'healthy', temperature: 34 },
        ],
        poolMode: 'combined',
        task: null,
        addToPool: (id) => set((s) => ({ drives: s.drives.map((d) => (d.id === id && d.location === 'internal' ? { ...d, inPool: true } : d)) })),
        removeFromPool: (id) => set((s) => ({ drives: s.drives.map((d) => (d.id === id ? { ...d, inPool: false } : d)) })),
        setPoolMode: (poolMode) => set({ poolMode }),
        connectDrive: (drive) => set((s) => ({ drives: [...s.drives.filter((d) => d.id !== drive.id), drive] })),
        ejectDrive: (id) => set((s) => ({ drives: s.drives.filter((d) => d.id !== id) })),

        expandPool: (id, onDone) =>
          run({ kind: 'expand', driveId: id }, 5200, () => {
            get().addToPool(id)
            onDone?.()
          }),
        shrinkPool: (id, onDone) =>
          run({ kind: 'shrink', driveId: id }, 4200, () => {
            get().removeFromPool(id)
            onDone?.()
          }),
        convertPool: (mode, onDone) =>
          run({ kind: 'convert', mode }, 4600, () => {
            set({ poolMode: mode })
            onDone?.()
          }),

        simulateNewDrive: () => {
          const hdds = get().drives.filter((d) => d.kind === 'hdd').length
          const drive: Drive = {
            id: `hdd-${Date.now().toString(36)}`,
            name: `Hard Drive ${hdds + 1}`,
            model: 'Seagate IronWolf 4TB',
            size: 4 * TB,
            kind: 'hdd',
            location: 'internal',
            inPool: false,
            health: 'healthy',
            temperature: 33 + Math.round(Math.random() * 4),
            connectedAt: Date.now(),
          }
          get().connectDrive(drive)
          return drive
        },
      }
    },
    {
      name: 'plumos:storage',
      version: 1,
      partialize: (s) => ({ drives: s.drives, poolMode: s.poolMode }),
    },
  ),
)

/** Usable pool capacity in bytes for the current mode. */
export function poolCapacity(drives: Drive[], mode: PoolMode): number {
  const sizes = drives.filter((d) => d.inPool).map((d) => d.size)
  if (!sizes.length) return 0
  const total = sizes.reduce((a, b) => a + b, 0)
  return mode === 'mirrored' && sizes.length > 1 ? total / 2 : total
}
