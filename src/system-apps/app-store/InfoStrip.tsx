import type { ReactNode } from 'react'
import type { AppInfo } from '@/apps/types'
import { formatBytes } from '@/lib/format'
import { categoryLabel, categoryMeta } from './data'
import { useNav } from './nav'

function Cell({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex min-w-[118px] flex-1 flex-col items-center px-3 py-3.5 text-center [&+&]:border-l [&+&]:border-white/[0.08]">
      <div className="text-[10.5px] font-semibold tracking-[0.08em] whitespace-nowrap text-white/40 uppercase">{label}</div>
      <div className="mt-1 flex h-7 items-center text-[19px] font-semibold tracking-[-0.01em] whitespace-nowrap tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 max-w-full truncate text-[12px] text-white/45">{sub}</div>}
    </div>
  )
}

/** Version, size, category and port / VM specs, in a row that scrolls on phones. */
export function InfoStrip({ app }: { app: AppInfo }) {
  const nav = useNav()
  const meta = categoryMeta[app.category]
  const [sizeValue, sizeUnit] = formatBytes(app.size ?? 0).split(' ')
  return (
    <div className="scrollbar-none -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <div className="flex w-max min-w-full rounded-2xl bg-white/[0.045] ring-1 ring-inset ring-white/[0.07]">
        <Cell label="Version" value={<span className="max-w-[140px] truncate">{app.version}</span>} sub="Latest" />
        <Cell label="Size" value={sizeValue} sub={sizeUnit} />
        {app.vm ? (
          <>
            <Cell label="CPU" value={app.vm.cpus} sub="Cores" />
            <Cell label="Memory" value={app.vm.memoryGb} sub="GB" />
            <Cell label="Disk" value={app.vm.diskGb} sub="GB" />
          </>
        ) : (
          <Cell label="Port" value={app.port ?? '—'} sub={app.port ? 'Web interface' : 'No web interface'} />
        )}
        <Cell
          label="Category"
          value={
            <button
              type="button"
              onClick={() => nav.go({ view: 'category', category: app.category })}
              aria-label={`More ${categoryLabel(app.category)} apps`}
              className="flex size-7 items-center justify-center rounded-[9px] text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={{ background: meta.tint }}
            >
              <meta.icon size={15} strokeWidth={2.3} />
            </button>
          }
          sub={categoryLabel(app.category)}
        />
      </div>
    </div>
  )
}
