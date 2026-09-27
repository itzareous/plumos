import { useSystem } from '@/stores/system'
import { useWindows } from '@/stores/windows'
import { formatBytes } from '@/lib/format'
import { ProgressBar } from '@/components/ui/controls'
import { WidgetFrame } from './WidgetFrame'

export function StorageWidget() {
  const storage = useSystem((s) => s.stats.storage)
  const open = useWindows((s) => s.open)
  const ratio = storage.total ? storage.used / storage.total : 0
  return (
    <WidgetFrame label="Live Usage" onClick={() => open('live-usage')}>
      <div className="flex h-full flex-col justify-between">
        <div>
          <div className="text-[13px] font-medium text-white/60">Storage</div>
          <div className="mt-1 text-[26px] leading-tight font-bold tracking-tight text-white">
            {formatBytes(storage.used)}
            <span className="text-white/45"> / {formatBytes(storage.total)}</span>
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs text-white/55">{formatBytes(storage.total - storage.used)} available</div>
          <ProgressBar value={ratio} className="h-2" />
        </div>
      </div>
    </WidgetFrame>
  )
}
