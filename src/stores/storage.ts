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
}

export type PoolMode = 'combined' | 'mirrored'

interface StorageState {
  drives: Drive[]
  /** combined = add up all space; mirrored = every file kept on two drives. */
  poolMode: PoolMode
  addToPool: (id: string) => void
  removeFromPool: (id: string) => void
  setPoolMode: (mode: PoolMode) => void
  /** Simulates plugging in a drive. */
  connectDrive: (drive: Drive) => void
  ejectDrive: (id: string) => void
}

const TB = 1e12
const GB = 1e9

export const useStorage = create<StorageState>()(
  persist(
    (set) => ({
      drives: [
        { id: 'nvme0', name: 'SSD 1', model: 'Samsung 990 EVO', size: 1 * TB, kind: 'nvme', location: 'internal', inPool: true, health: 'healthy', temperature: 41 },
        { id: 'nvme1', name: 'SSD 2', model: 'Samsung 990 EVO', size: 1 * TB, kind: 'nvme', location: 'internal', inPool: true, health: 'healthy', temperature: 43 },
        { id: 'usb0', name: 'Old Backup Drive', model: 'WD Elements', size: 500 * GB, kind: 'usb', location: 'external', inPool: false, health: 'healthy', temperature: 34 },
      ],
      poolMode: 'combined',
      addToPool: (id) => set((s) => ({ drives: s.drives.map((d) => (d.id === id && d.location === 'internal' ? { ...d, inPool: true } : d)) })),
      removeFromPool: (id) => set((s) => ({ drives: s.drives.map((d) => (d.id === id ? { ...d, inPool: false } : d)) })),
      setPoolMode: (poolMode) => set({ poolMode }),
      connectDrive: (drive) => set((s) => ({ drives: [...s.drives.filter((d) => d.id !== drive.id), drive] })),
      ejectDrive: (id) => set((s) => ({ drives: s.drives.filter((d) => d.id !== id) })),
    }),
    { name: 'plumos:storage', version: 1 },
  ),
)

/** Usable pool capacity in bytes for the current mode. */
export function poolCapacity(drives: Drive[], mode: PoolMode): number {
  const sizes = drives.filter((d) => d.inPool).map((d) => d.size)
  if (!sizes.length) return 0
  const total = sizes.reduce((a, b) => a + b, 0)
  return mode === 'mirrored' && sizes.length > 1 ? total / 2 : total
}
