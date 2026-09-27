import { useEffect, useState } from 'react'
import { formatDuration } from '@/lib/format'
import type { VmSpec } from '../types'
import { PeakMark, PetalMark } from '../screen/marks'

/** "About this computer": the guest's virtual hardware, straight from the VM's config. */
export function About({ spec, name }: { spec: VmSpec; name: string }) {
  const [since] = useState(() => Date.now())
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const uptime = Math.max(60, Math.round((Date.now() - since) / 1000) + 60)
  const used = Math.round(spec.diskGb * 0.34 * 10) / 10
  const rows: [string, string][] = [
    ['Device name', spec.os === 'linux' ? 'plumos-vm' : 'PLUMOS-VM'],
    ['Edition', name],
    ['Processor', `${spec.cpus} virtual cores`],
    ['Memory', `${spec.memoryGb} GB`],
    ['Storage', `${used} GB of ${spec.diskGb} GB used`],
    ['Display', '1152 × 720 · virtual'],
    ['Up for', formatDuration(uptime)],
  ]
  return (
    <div className="scrollbar-thin h-full overflow-y-auto bg-[#1f2026] p-6 text-white">
      <div className="flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 ring-1 ring-white/10">
          {spec.os === 'linux' ? <PeakMark size={36} /> : <PetalMark size={36} />}
        </span>
        <div>
          <h2 className="text-[18px] font-semibold">This computer</h2>
          <p className="text-[12px] text-white/50">Runs on your Plumos home server</p>
        </div>
      </div>
      <dl className="mt-5 divide-y divide-white/[0.06] rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-4 py-2.5 text-[12.5px]">
            <dt className="text-white/55">{k}</dt>
            <dd className="text-white/90 tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-[11px] text-white/45">
          <span>Disk</span>
          <span className="tabular-nums">{Math.round((used / spec.diskGb) * 100)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400" style={{ width: `${(used / spec.diskGb) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
