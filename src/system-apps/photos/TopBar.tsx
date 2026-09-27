import type { MouseEvent, ReactNode } from 'react'
import { Minus, Plus, Smartphone, SquareDashedMousePointer } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/controls'
import { usePhotos, DENSITIES } from '@/stores/photos'
import { cn } from '@/lib/cn'
import { BackupPill } from './BackupPill'

export type Tab = 'library' | 'favorites' | 'albums' | 'shared'

const TABS: { value: Tab; label: string }[] = [
  { value: 'library', label: 'Library' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'albums', label: 'Albums' },
  { value: 'shared', label: 'Shared' },
]

const mod = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+'

export function TopBar({
  tab,
  onTab,
  subtitle,
  canZoom,
  canSelect,
  selecting,
  onToggleSelect,
  onImport,
  onBackup,
}: {
  tab: Tab
  onTab: (tab: Tab) => void
  subtitle: ReactNode
  canZoom: boolean
  canSelect: boolean
  selecting: boolean
  onToggleSelect: () => void
  onImport: (e: MouseEvent<HTMLButtonElement>) => void
  onBackup: () => void
}) {
  const backupIdle = usePhotos((s) => s.backup.status === 'idle')
  const density = usePhotos((s) => s.density)
  const setDensity = usePhotos((s) => s.setDensity)

  return (
    <header className="shrink-0 px-4 pt-5 pr-16 pb-3 sm:px-8 sm:pt-7 sm:pr-20">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] leading-tight font-bold tracking-tight sm:text-[30px]">Photos</h1>
          <div className="mt-0.5 flex h-8 min-w-0 items-center text-[13px] text-white/50 tabular-nums sm:h-auto">
            <span className={cn('truncate', !backupIdle && 'hidden sm:inline')}>{subtitle}</span>
            <BackupPill onClick={onBackup} className="sm:hidden" />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <BackupPill onClick={onBackup} className="hidden sm:inline-flex" />
          {backupIdle && (
            <>
              <Button size="sm" icon={<Smartphone size={15} />} onClick={onBackup} className="hidden md:inline-flex">
                Back Up Phone
              </Button>
              <IconButton label="Back up your phone" onClick={onBackup} className="bg-white/10 md:hidden">
                <Smartphone size={17} />
              </IconButton>
            </>
          )}
          <Button size="sm" icon={<Plus size={16} />} onClick={onImport} className="hidden sm:inline-flex" aria-haspopup="menu">
            Import
          </Button>
          <IconButton label="Import" onClick={onImport} className="bg-white/10 sm:hidden" aria-haspopup="menu">
            <Plus size={18} />
          </IconButton>
          {canSelect && (
            <Button
              size="sm"
              variant={selecting ? 'primary' : 'secondary'}
              onClick={onToggleSelect}
              icon={selecting ? undefined : <SquareDashedMousePointer size={15} className="hidden sm:block" />}
              aria-pressed={selecting}
            >
              {selecting ? 'Done' : 'Select'}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="scrollbar-none -mx-1 min-w-0 overflow-x-auto px-1 py-0.5">
          <Segmented value={tab} options={TABS} onChange={onTab} />
        </div>
        {canZoom && (
          <div className="hidden shrink-0 items-center gap-1 rounded-full bg-white/[0.07] p-1 ring-1 ring-white/10 ring-inset sm:flex" role="group" aria-label="Zoom">
            <IconButton label={`Zoom out (${mod}−)`} className="size-7" disabled={density === 0} onClick={() => setDensity(density - 1)}>
              <Minus size={15} />
            </IconButton>
            <div className="flex items-center gap-1 px-1" aria-hidden>
              {Array.from({ length: DENSITIES }, (_, i) => (
                <span
                  key={i}
                  className={cn('rounded-full transition-all duration-200', i === density ? 'h-1.5 w-3.5 bg-white' : 'size-1.5 bg-white/25')}
                />
              ))}
            </div>
            <IconButton label={`Zoom in (${mod}+)`} className="size-7" disabled={density === DENSITIES - 1} onClick={() => setDensity(density + 1)}>
              <Plus size={15} />
            </IconButton>
          </div>
        )}
      </div>
    </header>
  )
}
