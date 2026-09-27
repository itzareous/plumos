import { BatteryMedium, ChevronUp, Search, Volume2, Wifi } from 'lucide-react'
import { cn } from '@/lib/cn'
import { AppGlyph, GLYPHS, type GuestApp } from '../apps/glyphs'
import { dateLabel, timeLabel, useNow } from '../hooks'
import { PetalMark } from '../screen/marks'
import type { WindowManager } from '../wm/useWindowManager'

export const TASKBAR_H = 46
const PINNED: GuestApp[] = ['files', 'browser', 'notes', 'calc']

/** Centred taskbar: start, search, pinned and running apps; tray and clock on the right. */
export function Taskbar({
  wm,
  launcherOpen,
  onLauncher,
  onSearch,
}: {
  wm: WindowManager
  launcherOpen: boolean
  onLauncher: () => void
  onSearch: () => void
}) {
  const now = useNow(1000)
  const running = wm.wins.map((w) => w.app).filter((a) => !PINNED.includes(a))
  const apps = [...PINNED, ...running]
  const activeApp = wm.wins.find((w) => w.id === wm.active)?.app

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[900] flex items-center border-t border-white/[0.07] bg-[#15171f]/80 px-2 backdrop-blur-2xl"
      style={{ height: TASKBAR_H }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-1 items-center justify-center gap-1">
        <TaskButton label="Start" agent="start" active={launcherOpen} onClick={onLauncher}>
          <PetalMark size={24} />
        </TaskButton>
        <TaskButton label="Search" agent="taskbar.search" onClick={onSearch}>
          <Search size={18} className="text-white/85" />
        </TaskButton>
        {apps.map((app) => {
          const open = wm.wins.some((w) => w.app === app)
          return (
            <TaskButton
              key={app}
              label={GLYPHS[app].label}
              agent={`taskbar.${app}`}
              onClick={() => wm.toggle(app)}
              indicator={open ? (activeApp === app ? 'active' : 'open') : undefined}
            >
              <AppGlyph app={app} size={24} />
            </TaskButton>
          )
        })}
      </div>
      <div className="absolute right-2 flex h-full items-center gap-1 text-white/85">
        <span className="flex h-9 items-center rounded-md px-1.5 hover:bg-white/[0.07]">
          <ChevronUp size={15} />
        </span>
        <span className="flex h-9 items-center gap-2 rounded-md px-2 hover:bg-white/[0.07]">
          <Wifi size={15} />
          <Volume2 size={15} />
          <BatteryMedium size={17} />
        </span>
        <span className="flex h-9 flex-col items-end justify-center rounded-md px-2 text-[11px] leading-[1.35] tabular-nums hover:bg-white/[0.07]">
          <span>{timeLabel(now)}</span>
          <span className="text-white/70">{dateLabel(now)}</span>
        </span>
        <button
          type="button"
          aria-label="Show desktop"
          title="Show desktop"
          onClick={() => wm.wins.forEach((w) => wm.minimize(w.id))}
          className="ml-1 h-7 w-1.5 rounded-sm border-l border-white/20 transition hover:bg-white/20"
        />
      </div>
    </div>
  )
}

function TaskButton({
  label,
  agent,
  active,
  indicator,
  onClick,
  children,
}: {
  label: string
  agent: string
  active?: boolean
  indicator?: 'open' | 'active'
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-agent={agent}
      onClick={onClick}
      className={cn(
        'relative flex size-10 items-center justify-center rounded-md transition outline-none hover:bg-white/[0.09] focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95',
        (active || indicator === 'active') && 'bg-white/[0.08]',
      )}
    >
      {children}
      {indicator && (
        <span
          className={cn(
            'absolute bottom-0.5 h-[3px] rounded-full transition-all',
            indicator === 'active' ? 'w-4 bg-sky-300' : 'w-1.5 bg-white/50',
          )}
        />
      )}
    </button>
  )
}
