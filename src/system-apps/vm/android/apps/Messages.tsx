import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MessageSquarePlus, SendHorizontal } from 'lucide-react'
import { cn } from '@/lib/cn'
import { AppHeader, useBack } from '../phone'

interface Msg {
  me: boolean
  text: string
}
interface Thread {
  name: string
  color: string
  time: string
  msgs: Msg[]
  replies: string[]
}

const THREADS: Thread[] = [
  {
    name: 'Sam',
    color: '#f59e0b',
    time: '9:12',
    msgs: [
      { me: false, text: 'Dinner at ours tonight?' },
      { me: true, text: 'Yes please! What can I bring?' },
      { me: false, text: 'Just yourself. Are you still coming at 7?' },
    ],
    replies: ['Great, see you soon!', 'Perfect, the door is open.'],
  },
  {
    name: 'Mum',
    color: '#ec4899',
    time: 'Yesterday',
    msgs: [{ me: false, text: 'Call me when you are free, love' }],
    replies: ['Talk later x'],
  },
  {
    name: 'Priya',
    color: '#8b5cf6',
    time: 'Fri',
    msgs: [{ me: false, text: 'Receipts are in the shared folder' }],
    replies: ['Thanks!'],
  },
  {
    name: 'Parcel updates',
    color: '#0ea5e9',
    time: 'Thu',
    msgs: [{ me: false, text: 'Your parcel arrives today between 2 and 4 pm.' }],
    replies: [],
  },
]

/** Messages: a list of chats and a conversation with auto-replies. */
export function MessagesApp() {
  const [threads, setThreads] = useState(THREADS)
  const [open, setOpen] = useState<number | null>(null)

  useBack(() => {
    if (open === null) return false
    setOpen(null)
    return true
  })

  if (open !== null) {
    return <Conversation thread={threads[open]} onChange={(t) => setThreads((ts) => ts.map((x, i) => (i === open ? t : x)))} />
  }

  return (
    <div className="relative flex h-full flex-col bg-[#111214]">
      <AppHeader title="Messages" />
      <div className="scrollbar-none flex-1 overflow-y-auto">
        {threads.map((t, i) => {
          const last = t.msgs[t.msgs.length - 1]
          return (
            <button
              key={t.name}
              type="button"
              data-agent={`msg.thread.${i}`}
              onClick={() => setOpen(i)}
              className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition outline-none active:bg-white/[0.06]"
            >
              <Avatar name={t.name} color={t.color} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[16px] font-medium">{t.name}</span>
                  <span className="shrink-0 text-[12px] text-white/45">{t.time}</span>
                </div>
                <div className="truncate text-[14px] text-white/55">
                  {last.me && 'You: '}
                  {last.text}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <span className="absolute right-5 bottom-5 flex h-14 items-center gap-2 rounded-2xl bg-emerald-300 px-5 text-[15px] font-medium text-emerald-950 shadow-lg">
        <MessageSquarePlus size={20} /> Start chat
      </span>
    </div>
  )
}

function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}
    >
      {name[0]}
    </span>
  )
}

function Conversation({ thread, onChange }: { thread: Thread; onChange: (t: Thread) => void }) {
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const latest = useRef(thread)
  useEffect(() => {
    latest.current = thread
  }, [thread])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [thread.msgs.length, typing])

  const send = () => {
    const t = text.trim()
    if (!t) return
    setText('')
    const next = { ...thread, time: 'Now', msgs: [...thread.msgs, { me: true, text: t }] }
    onChange(next)
    if (!thread.replies.length) return
    setTimeout(() => setTyping(true), 700)
    setTimeout(() => {
      setTyping(false)
      const cur = latest.current
      const reply = cur.replies[0]
      onChange({ ...cur, msgs: [...cur.msgs, { me: false, text: reply }], replies: [...cur.replies.slice(1), reply] })
    }, 1900)
  }

  return (
    <motion.div className="flex h-full flex-col bg-[#111214]" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
      <AppHeader title={thread.name} sub="Mobile" />
      <div ref={scroller} className="scrollbar-none flex-1 space-y-2 overflow-y-auto px-3 py-3">
        <AnimatePresence initial={false}>
          {thread.msgs.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn('flex', m.me ? 'justify-end' : 'justify-start')}
            >
              <span
                className={cn(
                  'max-w-[78%] rounded-3xl px-4 py-2.5 text-[15px] leading-snug',
                  m.me ? 'rounded-br-lg bg-emerald-300 text-emerald-950' : 'rounded-bl-lg bg-white/10 text-white',
                )}
              >
                {m.text}
              </span>
            </motion.div>
          ))}
          {typing && (
            <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex">
              <span className="flex gap-1 rounded-3xl rounded-bl-lg bg-white/10 px-4 py-3.5">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="size-2 rounded-full bg-white/60"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                  />
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 px-3 pt-1 pb-3">
        <input
          data-agent="msg.input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Text message"
          aria-label="Text message"
          className="h-12 min-w-0 flex-1 rounded-full bg-white/10 px-5 text-[15px] outline-none placeholder:text-white/40"
        />
        <button
          type="button"
          aria-label="Send"
          data-agent="msg.send"
          onClick={send}
          className={cn(
            'flex size-12 items-center justify-center rounded-full transition outline-none',
            text.trim() ? 'bg-emerald-300 text-emerald-950' : 'bg-white/10 text-white/40',
          )}
        >
          <SendHorizontal size={20} />
        </button>
      </div>
    </motion.div>
  )
}
