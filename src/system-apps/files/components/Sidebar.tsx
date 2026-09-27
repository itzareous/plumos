import type { DragEvent } from 'react'
import { motion } from 'motion/react'
import { Eject, MonitorSmartphone } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import type { Loc } from '../lib/tree'
import type { NavEntry } from './navEntries'
import { StorageMeter } from './StorageMeter'

export interface DropHandlers {
  onDragOver: (e: DragEvent) => void
  onDragLeave: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
}

export type BindDrop = (target: Loc) => DropHandlers | undefined

interface SidebarProps {
  entries: NavEntry[]
  active: Loc
  dropTarget: Loc | null
  onNavigate: (loc: Loc) => void
  onEject: (driveId: string) => void
  onConnect: () => void
  bindDrop: BindDrop
}

const GROUPS: { key: NavEntry['group']; title?: string }[] = [
  { key: 'places' },
  { key: 'locations', title: 'Locations' },
  { key: 'apps', title: 'Apps' },
]

export function Sidebar({ entries, active, dropTarget, onNavigate, onEject, onConnect, bindDrop }: SidebarProps) {
  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.025] md:flex">
      <div className="px-6 pt-7 pb-4">
        <h1 className="text-[22px] leading-none font-bold tracking-tight">Files</h1>
      </div>
      <nav aria-label="Places" className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {GROUPS.map(({ key, title }) => {
          const list = entries.filter((e) => e.group === key)
          if (key === 'apps' && !list.length) return null
          return (
            <div key={key} className={cn(title && 'mt-5')}>
              {title && <h2 className="mb-1 px-3 text-[11.5px] font-semibold tracking-wide text-white/40 uppercase">{title}</h2>}
              {key === 'locations' && !list.length && (
                <p className="px-3 py-1.5 text-[12.5px] leading-snug text-white/35">
                  No drives plugged in. Connect a USB drive to browse and import it.
                </p>
              )}
              <ul className="flex flex-col gap-0.5">
                {list.map((entry) => (
                  <li key={entry.loc}>
                    <SidebarItem
                      entry={entry}
                      active={active === entry.loc}
                      dropping={dropTarget === entry.loc}
                      onClick={() => onNavigate(entry.loc)}
                      onEject={entry.drive ? () => onEject(entry.drive!.id) : undefined}
                      drop={bindDrop(entry.loc)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>
      {/* Sits above the dock, which floats over the bottom of every sheet. */}
      <div className="flex flex-col gap-2.5 px-3 pt-2 pb-[92px]">
        <StorageMeter />
        <button
          type="button"
          onClick={onConnect}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.08] text-[13px] font-medium text-white/90 ring-1 ring-inset ring-white/10 transition outline-none hover:bg-white/[0.13] focus-visible:ring-2 focus-visible:ring-white/60 active:scale-[0.98]"
        >
          <MonitorSmartphone size={16} className="text-accent" />
          Connect from your computer
        </button>
      </div>
    </aside>
  )
}

function SidebarItem({
  entry,
  active,
  dropping,
  onClick,
  onEject,
  drop,
}: {
  entry: NavEntry
  active: boolean
  dropping: boolean
  onClick: () => void
  onEject?: () => void
  drop?: DropHandlers
}) {
  const Icon = entry.icon
  return (
    <div className="group relative" {...drop}>
      {active && (
        <motion.span
          layoutId="files-sidebar-active"
          className="absolute inset-0 rounded-[10px] bg-white/[0.11]"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      {dropping && <span className="absolute inset-0 rounded-[10px] bg-accent-soft ring-2 ring-accent ring-inset" />}
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        title={entry.title}
        className={cn(
          'relative flex h-9 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[14px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          active ? 'text-white' : 'text-white/75 hover:bg-white/[0.05] hover:text-white',
          onEject && 'pr-10',
        )}
      >
        <Icon size={17} strokeWidth={2} className={cn('shrink-0 transition-colors', active ? 'text-accent' : 'text-accent/80')} />
        <span className="min-w-0 flex-1 truncate">{entry.label}</span>
        {entry.drive && !onEject && <span className="text-[11px] text-white/35 tabular-nums">{formatBytes(entry.drive.size)}</span>}
        {entry.count !== undefined && (
          <span className="text-[12px] text-white/40 tabular-nums">{entry.count.toLocaleString()}</span>
        )}
      </button>
      {onEject && (
        <button
          type="button"
          onClick={onEject}
          aria-label={`Eject ${entry.label}`}
          title={`Eject ${entry.label}`}
          className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-white/45 transition outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Eject size={15} />
        </button>
      )}
    </div>
  )
}
