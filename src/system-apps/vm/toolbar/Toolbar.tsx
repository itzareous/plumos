import { useRef, type ReactNode } from 'react'
import { Cpu, HardDrive, Keyboard, Maximize, MemoryStick, MoreHorizontal, Power as PowerIcon, RotateCcw, Sparkles } from 'lucide-react'
import type { AppInfo } from '@/apps/types'
import { AppIcon } from '@/components/icons/AppIcon'
import { Button, IconButton } from '@/components/ui/Button'
import { useContextMenu, type MenuEntry } from '@/components/ui/ContextMenu'
import { Switch } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import type { Power, VmSpec } from '../types'

export interface ToolbarActions {
  start: () => void
  shutdown: () => void
  restart: () => void
  fullscreen: () => void
  cad: () => void
  setAgent: (on: boolean) => void
}

interface Props {
  app: AppInfo
  spec: VmSpec
  power: Power
  agent: boolean
  actions: ToolbarActions
}

const STATUS: Record<Power, { label: string; dot: string; pulse?: boolean }> = {
  running: { label: 'Running', dot: 'bg-emerald-400', pulse: true },
  starting: { label: 'Starting…', dot: 'bg-amber-300', pulse: true },
  stopping: { label: 'Shutting down…', dot: 'bg-amber-300', pulse: true },
  off: { label: 'Off', dot: 'bg-white/35' },
}

export function StatusLabel({ power }: { power: Power }) {
  const s = STATUS[power]
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/60" role="status">
      <span className="relative flex size-2">
        {s.pulse && <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', s.dot)} />}
        <span className={cn('relative size-2 rounded-full', s.dot)} />
      </span>
      {s.label}
    </span>
  )
}

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 text-[12px] text-white/70 ring-1 ring-inset ring-white/[0.08] tabular-nums">
      <span className="text-white/45">{icon}</span>
      {children}
    </span>
  )
}

/** Name, power state, resources and controls for the open VM. Collapses into a menu on phones. */
export function Toolbar({ app, spec, power, agent, actions }: Props) {
  const menu = useContextMenu()
  const more = useRef<HTMLSpanElement>(null)
  const on = power === 'running' || power === 'starting'
  const windows = spec.os === 'windows'

  const openMenu = () => {
    const r = more.current?.getBoundingClientRect()
    if (!r) return
    const items: MenuEntry[] = [
      on
        ? { label: 'Shut down', icon: <PowerIcon size={15} />, onSelect: actions.shutdown }
        : { label: 'Start', icon: <PowerIcon size={15} />, onSelect: actions.start, disabled: power === 'stopping' },
      { label: 'Restart', icon: <RotateCcw size={15} />, onSelect: actions.restart, disabled: power === 'stopping' },
      ...(windows ? [{ label: 'Send Ctrl+Alt+Del', icon: <Keyboard size={15} />, onSelect: actions.cad, disabled: power !== 'running' }] : []),
      { label: 'Fullscreen', icon: <Maximize size={15} />, onSelect: actions.fullscreen },
      'separator',
      {
        label: agent ? 'Stop the agent' : 'Let an agent drive',
        icon: <Sparkles size={15} />,
        onSelect: () => actions.setAgent(!agent),
      },
    ]
    menu.openAt(r.right - 210, r.bottom + 8, items)
  }

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-3 border-b border-white/[0.06] pr-[60px] pl-4 sm:pr-16 sm:pl-6">
      <AppIcon icon={app.icon} size={38} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="truncate text-[16px] font-semibold tracking-tight">{app.name}</h1>
          <StatusLabel power={power} />
        </div>
        <p className="truncate text-[12px] text-white/45 tabular-nums xl:hidden">
          {spec.cpus} vCPU · {spec.memoryGb} GB RAM · {spec.diskGb} GB disk
        </p>
      </div>
      <div className="ml-1 hidden items-center gap-1.5 xl:flex">
        <Chip icon={<Cpu size={13} />}>{spec.cpus} vCPU</Chip>
        <Chip icon={<MemoryStick size={13} />}>{spec.memoryGb} GB RAM</Chip>
        <Chip icon={<HardDrive size={13} />}>{spec.diskGb} GB disk</Chip>
      </div>

      <div className="ml-auto hidden items-center gap-2 md:flex">
        {on || power === 'stopping' ? (
          <Button size="sm" icon={<PowerIcon size={14} />} onClick={actions.shutdown} disabled={power === 'stopping'} title="Shut down">
            <span className="hidden lg:inline">{power === 'stopping' ? 'Shutting down' : 'Shut down'}</span>
          </Button>
        ) : (
          <Button size="sm" variant="primary" icon={<PowerIcon size={14} />} onClick={actions.start}>
            Start
          </Button>
        )}
        <Button size="sm" icon={<RotateCcw size={14} />} onClick={actions.restart} disabled={power === 'stopping'} title="Restart">
          <span className="hidden lg:inline">Restart</span>
        </Button>
        {windows && (
          <Button size="sm" icon={<Keyboard size={14} />} onClick={actions.cad} disabled={power !== 'running'} title="Send Ctrl+Alt+Del">
            <span className="hidden lg:inline">Ctrl+Alt+Del</span>
          </Button>
        )}
        <IconButton label="Fullscreen" onClick={actions.fullscreen} className="size-8 bg-white/10 ring-1 ring-inset ring-white/10">
          <Maximize size={14} />
        </IconButton>
        <div
          className={cn(
            'flex h-8 items-center gap-2 rounded-full pr-[3px] pl-3 ring-1 ring-inset transition-colors',
            agent ? 'bg-[#ff6a3d]/15 ring-[#ff7a3d]/40' : 'bg-white/[0.06] ring-white/10',
          )}
        >
          <button type="button" onClick={() => actions.setAgent(!agent)} className="flex items-center gap-1.5 text-[13px] font-medium outline-none">
            <Sparkles size={14} className={agent ? 'text-[#ff8a5c]' : 'text-white/60'} />
            <span className="hidden lg:inline">Let an agent drive</span>
            <span className="lg:hidden">Agent</span>
          </button>
          <Switch checked={agent} onChange={actions.setAgent} label="Let an agent drive" />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1 md:hidden">
        <IconButton
          label={agent ? 'Stop the agent' : 'Let an agent drive'}
          onClick={() => actions.setAgent(!agent)}
          className={cn(agent && 'bg-[#ff6a3d]/20 text-[#ffa27f]')}
        >
          <Sparkles size={17} />
        </IconButton>
        <span ref={more} className="flex">
          <IconButton label="More" onClick={openMenu}>
            <MoreHorizontal size={18} />
          </IconButton>
        </span>
      </div>
      {menu.element}
    </header>
  )
}
