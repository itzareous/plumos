import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp } from 'lucide-react'
import { Input } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import type { VmOs } from '../types'
import { buildPlan, matchTask, suggestions } from './plans'
import { useAgent } from './store'

/** "Give the agent a task": picks one of the scripted plans by keyword. */
export function TaskField({ os }: { os: VmOs }) {
  const [text, setText] = useState('')
  const [error, setError] = useState(false)
  const assign = useAgent((s) => s.assign)

  const submit = (value: string) => {
    const t = value.trim()
    if (!t) return
    const m = matchTask(os, t)
    if (!m) {
      setError(true)
      return
    }
    setError(false)
    setText('')
    assign(m.planId, m.param, buildPlan(os, m.planId, m.param).task, t)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit(text)
  }

  return (
    <div className="shrink-0 border-t border-white/[0.07] p-3">
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden px-1 pb-2 text-[12px] text-amber-200/90"
          >
            This demo agent only knows a few tasks. Try one of these:
          </motion.p>
        )}
      </AnimatePresence>
      <div className="mb-2.5 flex flex-wrap gap-1.5">
        {suggestions(os).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => submit(s)}
            className={cn(
              'shrink-0 rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] whitespace-nowrap text-white/75 ring-1 ring-inset ring-white/10 transition outline-none hover:bg-white/[0.12] hover:text-white focus-visible:ring-2 focus-visible:ring-white/50',
              error && 'ring-amber-300/30',
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setError(false)
          }}
          placeholder="Give the agent a task…"
          aria-label="Give the agent a task"
          className="min-w-0 flex-1"
        />
        <button
          type="submit"
          aria-label="Send task"
          disabled={!text.trim()}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition outline-none hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95 disabled:opacity-30"
        >
          <ArrowUp size={18} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  )
}
