import { motion } from 'motion/react'
import { Cpu, HardDrive, MemoryStick } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSystem } from '@/stores/system'
import { useSettings } from '@/stores/settings'
import { useWindows } from '@/stores/windows'
import { formatBytes, formatPercent, formatTemperature } from '@/lib/format'
import { WidgetFrame } from './WidgetFrame'

function Pill({ icon, label, value, level }: { icon: ReactNode; label: string; value: string; level: number }) {
  return (
    <div className="relative flex h-full flex-1 flex-col items-center justify-center overflow-hidden rounded-full bg-white/[0.08] ring-1 ring-inset ring-white/10">
      <motion.div
        className="absolute inset-x-0 bottom-0 bg-white/[0.12]"
        initial={false}
        animate={{ height: `${Math.max(0, Math.min(1, level)) * 100}%` }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      />
      <div className="relative flex flex-col items-center">
        <span className="text-white/85">{icon}</span>
        <span className="mt-2 text-[11px] font-medium text-white/60">{label}</span>
        <span className="mt-0.5 text-[13px] font-bold tracking-tight text-white tabular-nums">{value}</span>
      </div>
    </div>
  )
}

export function SystemWidget() {
  const { cpu, memory, storage } = useSystem((s) => s.stats)
  const unit = useSettings((s) => s.temperatureUnit)
  const open = useWindows((s) => s.open)
  const cpuValue = cpu.temperature !== null ? formatTemperature(cpu.temperature, unit) : formatPercent(cpu.usage)
  return (
    <WidgetFrame label="Live Usage" padded={false} onClick={() => open('live-usage')}>
      <div className="flex h-full gap-2 p-2.5">
        <Pill icon={<Cpu size={17} />} label="CPU" value={cpuValue} level={cpu.usage / 100} />
        <Pill
          icon={<MemoryStick size={17} />}
          label="Memory"
          value={formatBytes(memory.used)}
          level={memory.total ? memory.used / memory.total : 0}
        />
        <Pill
          icon={<HardDrive size={17} />}
          label="Storage"
          value={formatBytes(storage.total - storage.used)}
          level={storage.total ? storage.used / storage.total : 0}
        />
      </div>
    </WidgetFrame>
  )
}
