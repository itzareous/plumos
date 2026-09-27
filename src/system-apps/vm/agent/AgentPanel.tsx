import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ChevronUp, PanelRightClose, PanelRightOpen, Pause, Play } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import type { Power, VmOs } from '../types'
import { AgentLog } from './AgentLog'
import { useAgent } from './store'
import { TaskField } from './TaskField'

interface PanelProps {
  os: VmOs
  power: Power
}

function useStatusText(power: Power) {
  const status = useAgent((s) => s.status)
  if (power !== 'running') return power === 'off' || power === 'stopping' ? 'Waiting for the VM to start' : 'Waiting for the VM to boot…'
  if (status === 'paused') return 'Paused — you took over'
  return 'Using the virtual machine'
}

/** A glowing orb for the agent, pulsing while it works. */
export function AgentAvatar({ size = 32, active }: { size?: number; active: boolean }) {
  return (
    <span className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      {active && (
        <motion.span
          className="absolute inset-0 rounded-full bg-[#ff6a3d]/40"
          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <span
        className="relative size-full rounded-full shadow-[inset_0_1px_1px_rgb(255_255_255/0.5)]"
        style={{ background: 'radial-gradient(circle at 35% 30%, #ffd2a8, #ff7a3d 45%, #ff2d78 100%)' }}
      />
    </span>
  )
}

function PauseButton() {
  const status = useAgent((s) => s.status)
  const pause = useAgent((s) => s.pause)
  const resume = useAgent((s) => s.resume)
  if (status === 'idle') return null
  return status === 'paused' ? (
    <IconButton label="Resume agent" onClick={resume} className="bg-white/10">
      <Play size={15} />
    </IconButton>
  ) : (
    <IconButton label="Pause agent" onClick={() => pause('Paused. Press play when you want me to carry on.')}>
      <Pause size={15} />
    </IconButton>
  )
}

function TaskCard() {
  const task = useAgent((s) => s.task)
  const step = useAgent((s) => s.step)
  const total = useAgent((s) => s.total)
  if (!task) return null
  const done = total > 0 && step >= total
  return (
    <div className="mx-3 rounded-2xl bg-white/[0.05] p-3.5 ring-1 ring-inset ring-white/[0.07]">
      <p className="text-[11px] font-semibold tracking-wide text-white/45 uppercase">Current task</p>
      <p className="mt-1 text-[14px] leading-snug font-medium text-white">{task}</p>
      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={total ? step / total : 0} color="linear-gradient(90deg,#ff8a3d,#ff2d78)" />
        <span className="shrink-0 text-[11px] text-white/45 tabular-nums">
          {done ? 'Done' : total ? `${Math.min(step + 1, total)} / ${total}` : '—'}
        </span>
      </div>
    </div>
  )
}

function Header({ power, onCollapse, collapseIcon }: { power: Power; onCollapse: () => void; collapseIcon: React.ReactNode }) {
  const status = useAgent((s) => s.status)
  const text = useStatusText(power)
  return (
    <div className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-3">
      <AgentAvatar active={status === 'running' && power === 'running'} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">Agent</p>
        <p className={cn('truncate text-[12px]', status === 'paused' ? 'text-amber-200/90' : 'text-white/50')}>{text}</p>
      </div>
      <PauseButton />
      <IconButton label="Hide agent panel" onClick={onCollapse}>
        {collapseIcon}
      </IconButton>
    </div>
  )
}

function Body({ os, power }: { os: VmOs; power: Power }) {
  return (
    <>
      <TaskCard />
      <AgentLog live={power === 'running'} />
      <TaskField os={os} />
    </>
  )
}

/** Docked to the right of the screen on wide layouts; collapses to a slim rail. */
export function AgentSidePanel({ os, power, collapsed, onToggle }: PanelProps & { collapsed: boolean; onToggle: () => void }) {
  const status = useAgent((s) => s.status)
  const step = useAgent((s) => s.step)
  const total = useAgent((s) => s.total)
  return (
    <motion.aside
      aria-label="Agent"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0, width: collapsed ? 60 : 340 }}
      exit={{ opacity: 0, x: 24, width: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      className="relative flex shrink-0 flex-col overflow-hidden border-l border-white/[0.07] bg-black/15"
    >
      {collapsed ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Show agent panel"
          className="flex h-full w-[60px] flex-col items-center gap-4 pt-5 text-white/70 transition outline-none hover:bg-white/[0.04] focus-visible:bg-white/[0.06]"
        >
          <AgentAvatar size={30} active={status === 'running' && power === 'running'} />
          <PanelRightOpen size={17} />
          {total > 0 && (
            <span className="text-[11px] text-white/50 tabular-nums [writing-mode:vertical-rl]">
              Step {Math.min(step + 1, total)} of {total}
            </span>
          )}
        </button>
      ) : (
        <div className="flex h-full w-[340px] flex-col">
          <Header power={power} onCollapse={onToggle} collapseIcon={<PanelRightClose size={17} />} />
          <Body os={os} power={power} />
        </div>
      )}
    </motion.aside>
  )
}

/** On narrow layouts: a bar under the screen that expands into a drawer. */
export function AgentDrawer({ os, power, open, onToggle }: PanelProps & { open: boolean; onToggle: () => void }) {
  const status = useAgent((s) => s.status)
  const log = useAgent((s) => s.log)
  const text = useStatusText(power)
  const last = log[log.length - 1]
  return (
    <>
      <div className="relative z-10 mx-3 mb-2 flex h-[52px] shrink-0 items-center gap-3 rounded-2xl bg-white/[0.07] pr-1.5 pl-3 ring-1 ring-inset ring-white/10 sm:mx-5">
        <AgentAvatar size={26} active={status === 'running' && power === 'running'} />
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left outline-none" aria-expanded={open}>
          <span className="block truncate text-[13px] font-medium text-white">{last?.text ?? 'Agent'}</span>
          <span className="block truncate text-[11px] text-white/45">{text}</span>
        </button>
        <PauseButton />
        <IconButton label={open ? 'Hide agent steps' : 'Show agent steps'} onClick={onToggle}>
          <ChevronUp size={18} className={cn('transition-transform', open && 'rotate-180')} />
        </IconButton>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            className="glass-dark absolute inset-x-2 top-[20%] bottom-[150px] z-30 flex flex-col overflow-hidden rounded-3xl sm:inset-x-5"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          >
            <Header power={power} onCollapse={onToggle} collapseIcon={<ChevronDown size={18} />} />
            <Body os={os} power={power} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
