import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus, Search } from 'lucide-react'
import { AppHeader, useBack } from '../phone'

export interface PhoneNote {
  id: number
  title: string
  body: string
  color: string
  fresh?: boolean
}

export const SEED_NOTES: PhoneNote[] = [
  { id: 1, title: 'Book club', body: 'Chapter 7 by Thursday. Bring the lemon cake.', color: '#3b3526' },
  { id: 2, title: 'Guest wifi', body: 'Network: plumos-guest\nPassword: plum-tree-42', color: '#263243' },
  { id: 3, title: 'Gift ideas', body: 'Mum: garden gloves, seed kit\nLeo: puzzle book', color: '#2f2940' },
  { id: 4, title: 'Car', body: 'MOT due 14 Nov. Tyres look low.', color: '#253a33' },
]

/** A notes app: a grid of cards, and an editor that saves when you go back. */
export function NotesApp({ notes, onSave }: { notes: PhoneNote[]; onSave: (title: string, body: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const close = () => {
    if (title.trim() || body.trim()) onSave(title.trim(), body.trim())
    setEditing(false)
    setTitle('')
    setBody('')
  }
  useBack(() => {
    if (!editing) return false
    close()
    return true
  })

  if (editing) {
    return (
      <motion.div className="flex h-full flex-col bg-[#15161a]" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <AppHeader title="" sub={null} right={<span className="pr-3 text-[12px] text-white/40">Saved automatically</span>} />
        <input
          data-agent="notes.title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          aria-label="Title"
          className="mx-5 bg-transparent text-[24px] font-medium outline-none placeholder:text-white/30"
        />
        <textarea
          data-agent="notes.body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Note"
          aria-label="Note"
          className="scrollbar-none mx-5 mt-3 flex-1 resize-none bg-transparent text-[16px] leading-relaxed text-white/85 outline-none placeholder:text-white/30"
        />
      </motion.div>
    )
  }

  return (
    <div className="relative flex h-full flex-col bg-[#15161a]">
      <div className="px-4 pt-3 pb-2">
        <div className="flex h-12 items-center gap-3 rounded-full bg-white/[0.08] px-4 text-[15px] text-white/50">
          <Search size={18} /> Search your notes
        </div>
      </div>
      <div className="scrollbar-none columns-2 gap-2.5 overflow-y-auto px-4 pb-24">
        <AnimatePresence initial={false}>
          {notes.map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={n.fresh ? { opacity: 0, scale: 0.85 } : false}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-2.5 break-inside-avoid rounded-2xl p-3.5 ring-1 ring-white/10"
              style={{ background: n.color }}
            >
              {n.title && <div className="text-[15px] font-medium">{n.title}</div>}
              <div className="mt-1 line-clamp-6 text-[13px] leading-snug whitespace-pre-line text-white/75">{n.body}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <button
        type="button"
        aria-label="New note"
        data-agent="notes.new"
        onClick={() => setEditing(true)}
        className="absolute right-5 bottom-5 flex size-14 items-center justify-center rounded-2xl bg-amber-200 text-amber-950 shadow-lg transition outline-none active:scale-95"
      >
        <Plus size={26} />
      </button>
    </div>
  )
}
