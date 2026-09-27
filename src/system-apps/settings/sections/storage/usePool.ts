import { useMemo } from 'react'
import { poolCapacity, useStorage } from '@/stores/storage'
import { useSystem } from '@/stores/system'

/** Pool numbers shared by the storage views. */
export function usePool() {
  const drives = useStorage((s) => s.drives)
  const mode = useStorage((s) => s.poolMode)
  const task = useStorage((s) => s.task)
  const used = useSystem((s) => s.stats.storage.used)
  return useMemo(() => {
    const members = drives.filter((d) => d.inPool)
    const capacity = poolCapacity(drives, mode)
    return { drives, members, mode, task, used, capacity, free: Math.max(0, capacity - used) }
  }, [drives, mode, task, used])
}
