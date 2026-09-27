import { useMemo } from 'react'
import { SheetPage } from '@/components/ui/Sheet'
import { useSystem } from '@/stores/system'
import type { SheetProps } from '../registry'
import { AppsTable } from './apps/AppsTable'
import { CpuCard } from './cards/CpuCard'
import { MemoryCard } from './cards/MemoryCard'
import { NetworkCard } from './cards/NetworkCard'
import { StorageCard } from './cards/StorageCard'
import { HeaderChips } from './HeaderChips'

/** Live Usage: CPU, memory, storage and network at a glance, plus usage per app. */
export default function LiveUsage(_: SheetProps) {
  const stats = useSystem((s) => s.stats)
  const history = useSystem((s) => s.history)
  const times = useMemo(() => history.map((h) => h.t), [history])
  const subtitle = [stats.os, stats.arch].filter(Boolean).join(' · ')

  return (
    <SheetPage title="Live Usage" subtitle={subtitle} actions={<HeaderChips stats={stats} className="max-sm:hidden" />}>
      {/* On phones the chips scroll with the content instead of taking up header space. */}
      <HeaderChips stats={stats} className="mb-4 sm:hidden" />
      <div className="grid gap-4 md:grid-cols-2">
        <CpuCard stats={stats} history={history} times={times} />
        <MemoryCard stats={stats} history={history} times={times} />
        <StorageCard stats={stats} history={history} times={times} />
        <NetworkCard stats={stats} history={history} times={times} />
      </div>
      <div className="mt-9">
        <AppsTable stats={stats} history={history} />
      </div>
      {/* Keeps the last rows clear of the dock. */}
      <div className="h-20" aria-hidden />
    </SheetPage>
  )
}
