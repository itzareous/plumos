import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { categoryLabels } from '@/apps/types'
import { AppIcon } from '@/components/icons/AppIcon'
import { Card, SectionTitle } from '@/components/ui/controls'
import { formatBytes } from '@/lib/format'
import type { Sample, SystemStats } from '@/stores/system'
import { Sparkline } from '../chart/Sparkline'
import { formatCpu } from '../lib/format'
import { COLORS } from '../lib/theme'
import { SortHeader, type SortKey, type SortState } from './SortHeader'
import { useAppRows } from './useAppRows'

/** Memory relative to the hungriest app, on wide screens. */
function ShareBar({ value }: { value: number }) {
  return (
    <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.08] lg:block" aria-hidden>
      <motion.div
        className="h-full rounded-full"
        style={{ background: COLORS.memory }}
        initial={false}
        animate={{ width: `${Math.max(0.03, Math.min(1, value)) * 100}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 24 }}
      />
    </div>
  )
}

const COLUMNS =
  'grid grid-cols-[minmax(0,1fr)_88px_62px] items-center gap-2.5 sm:grid-cols-[minmax(0,1fr)_184px_104px] sm:gap-5 lg:grid-cols-[minmax(0,1fr)_236px_200px] lg:gap-8'

/** Per-app CPU and memory, sortable, with a CPU trend per row. */
export function AppsTable({ stats, history }: { stats: SystemStats; history: Sample[] }) {
  const rows = useAppRows(history, stats.memory.total)
  const maxMemory = useMemo(() => Math.max(1, ...rows.map((r) => r.memory)), [rows])
  const [sort, setSort] = useState<SortState>({ key: 'cpu', dir: -1 })

  const sorted = useMemo(() => {
    const by = (a: (typeof rows)[number], b: (typeof rows)[number]) =>
      sort.key === 'name' ? a.app.name.localeCompare(b.app.name) : a[sort.key] - b[sort.key]
    return [...rows].sort((a, b) => by(a, b) * sort.dir || a.app.name.localeCompare(b.app.name))
  }, [rows, sort])

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'name' ? 1 : -1 }))

  return (
    <section aria-labelledby="live-usage-apps">
      <SectionTitle action={<span className="text-[12.5px] text-white/40 tabular-nums">{rows.length} installed</span>}>
        <span id="live-usage-apps">Apps</span>
      </SectionTitle>
      <Card>
        <div role="table" aria-label="Usage by app" aria-rowcount={rows.length + 1}>
          <div role="rowgroup">
            <div role="row" className={`${COLUMNS} h-11 border-b border-white/[0.06] px-3.5 sm:px-5`}>
              <SortHeader label="App" column="name" sort={sort} onSort={onSort} />
              <SortHeader label="CPU" column="cpu" sort={sort} onSort={onSort} align="right" />
              <SortHeader label="Memory" column="memory" sort={sort} onSort={onSort} align="right" />
            </div>
          </div>
          <div role="rowgroup">
            {sorted.map((row) => (
              <motion.div
                key={row.app.id}
                layout="position"
                transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                role="row"
                className={`${COLUMNS} px-3.5 py-2.5 transition-colors hover:bg-white/[0.035] sm:px-5 [&+&]:border-t [&+&]:border-white/[0.05]`}
              >
                <div role="cell" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <AppIcon icon={row.app.icon} size={32} />
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-medium text-white/90 sm:text-[14px]">{row.app.name}</div>
                    <div className="truncate text-[12px] text-white/45">{categoryLabels[row.app.category]}</div>
                  </div>
                </div>
                <div role="cell" className="flex items-center justify-end gap-1.5 sm:gap-4">
                  <Sparkline values={row.trend} color={COLORS.cpu} floor={0.25} className="w-10 sm:w-24 lg:w-36" />
                  <span className="w-[42px] text-right text-[13px] sm:w-12 font-medium text-white/85 tabular-nums">{formatCpu(row.cpu)}</span>
                </div>
                <div role="cell" className="flex items-center justify-end gap-4">
                  <ShareBar value={row.memory / maxMemory} />
                  <span className="text-right text-[13px] font-medium text-white/85 tabular-nums sm:w-16">{formatBytes(row.memory)}</span>
                </div>
              </motion.div>
            ))}
            {!rows.length && (
              <div role="row" className="px-5 py-10 text-center text-sm text-white/45">
                <span role="cell">No apps installed yet.</span>
              </div>
            )}
          </div>
        </div>
      </Card>
      <p className="mt-2.5 px-1 text-[12px] text-white/40">
        {stats.source === 'live'
          ? 'Per-app figures are estimated by sharing out the total usage above.'
          : 'Demo data. Connect a Plumos server to see real usage.'}
      </p>
    </section>
  )
}
