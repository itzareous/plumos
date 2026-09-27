import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Check, CircleCheck, Hand, Info } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAgent, type LogEntry } from './store'

const stamp = (t: number) =>
  new Date(t).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

/** The agent's running commentary, newest at the bottom, with the step in progress highlighted. */
export function AgentLog({ live }: { live: boolean }) {
  const log = useAgent((s) => s.log)
  const status = useAgent((s) => s.status)
  const scroller = useRef<HTMLDivElement>(null)
  const last = log[log.length - 1]
  const currentId = live && status === 'running' && last?.kind === 'step' ? last.id : null

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [log.length])

  return (
    <div ref={scroller} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 py-2" aria-live="polite">
      {!log.length && <p className="px-2 py-6 text-center text-[13px] text-white/40">The agent's steps will show up here.</p>}
      <ol className="space-y-0.5">
        {log.map((e) => (
          <Item key={e.id} entry={e} current={e.id === currentId} />
        ))}
      </ol>
    </div>
  )
}

function Item({ entry, current }: { entry: LogEntry; current: boolean }) {
  if (entry.kind === 'user') {
    return (
      <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end py-1.5 pl-8">
        <span className="rounded-2xl rounded-br-md bg-accent px-3 py-1.5 text-[13px] text-white">{entry.text}</span>
      </motion.li>
    )
  }
  const icon =
    entry.kind === 'done' ? (
      <CircleCheck size={15} className="text-emerald-400" />
    ) : entry.kind === 'warn' ? (
      <Hand size={14} className="text-amber-300" />
    ) : entry.kind === 'info' ? (
      <Info size={14} className="text-white/35" />
    ) : current ? (
      <span className="block size-3.5 animate-spin rounded-full border-2 border-[#ff7a3d]/30 border-t-[#ff7a3d]" />
    ) : (
      <Check size={14} className="text-white/45" />
    )
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
      className={cn(
        'flex items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors',
        current && 'bg-[#ff7a3d]/[0.12] ring-1 ring-inset ring-[#ff7a3d]/30',
      )}
    >
      <span className="mt-[3px] flex size-4 shrink-0 items-center justify-center">{icon}</span>
      <span
        className={cn(
          'min-w-0 flex-1 text-[13px] leading-snug',
          current ? 'font-medium text-white' : entry.kind === 'step' ? 'text-white/70' : entry.kind === 'done' ? 'text-emerald-200' : entry.kind === 'warn' ? 'text-amber-100' : 'text-white/50',
        )}
      >
        {entry.text}
      </span>
      <time className="mt-[2px] shrink-0 text-[11px] text-white/35 tabular-nums">{stamp(entry.at)}</time>
    </motion.li>
  )
}
