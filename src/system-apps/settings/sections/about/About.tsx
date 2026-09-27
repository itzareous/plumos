import { Card } from '@/components/ui/controls'
import { formatBytes, formatDuration } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useSettings } from '@/stores/settings'
import { useSystem } from '@/stores/system'
import { PLUMOS_VERSION } from '../../lib/version'
import { CopyButton } from '../../ui/CopyField'
import { LogoTile } from '../../ui/LogoTile'
import { Group, Page } from '../../ui/Page'
import { InfoRow } from './InfoRow'

export function About() {
  const stats = useSystem((s) => s.stats)
  const deviceName = useSettings((s) => s.deviceName)
  const live = stats.source === 'live'

  const rows: [string, string][] = [
    ['Hostname', stats.hostname],
    ['Operating system', `${stats.os} · ${stats.arch}`],
    ['Processor', stats.cpu.model],
    ['Cores', `${stats.cpu.cores}`],
    ['Memory', formatBytes(stats.memory.total)],
    ['Storage', `${formatBytes(stats.storage.used)} used of ${formatBytes(stats.storage.total)}`],
    ['Uptime', formatDuration(stats.uptime)],
  ]
  const summary = [`Plumos ${PLUMOS_VERSION}`, ...rows.map(([k, v]) => `${k}: ${v}`)].join('\n')

  return (
    <Page title="About">
      <div className="flex flex-col items-center pt-2 text-center">
        <LogoTile size={76} />
        <h2 className="mt-4 text-[24px] font-bold tracking-tight">{deviceName || 'plumos'}</h2>
        <p className="mt-0.5 text-[13.5px] text-white/55">Plumos {PLUMOS_VERSION}</p>
        <span
          className={cn(
            'mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset',
            live ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25' : 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
          )}
          title={live ? 'Read from your Plumos server every few seconds' : 'No Plumos server answered, so these numbers are simulated'}
        >
          <span className="relative flex size-1.5">
            {live && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className={cn('relative size-1.5 rounded-full', live ? 'bg-emerald-400' : 'bg-amber-400')} />
          </span>
          {live ? 'Live from your server' : 'Demo data'}
        </span>
      </div>

      <Group title="Hardware & software" action={<CopyButton text={summary} label="system details" />}>
        <Card>
          <dl>
            {rows.map(([label, value]) => (
              <InfoRow key={label} label={label}>
                {value}
              </InfoRow>
            ))}
          </dl>
        </Card>
      </Group>
    </Page>
  )
}
