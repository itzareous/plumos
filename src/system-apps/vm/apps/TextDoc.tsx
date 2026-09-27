import { useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Save } from 'lucide-react'
import { cn } from '@/lib/cn'

function caretInfo(text: string, pos: number) {
  const before = text.slice(0, pos)
  const lines = before.split('\n')
  return { ln: lines.length, col: lines[lines.length - 1].length + 1 }
}

const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0)

/** A plain text editor: "notes" is a friendly notepad, "code" adds line numbers, a tab and Save. */
export function TextDoc({
  initial = '',
  mode,
  fileName,
  placeholder,
}: {
  initial?: string
  mode: 'notes' | 'code'
  fileName: string
  placeholder?: string
}) {
  const [text, setText] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [caret, setCaret] = useState({ ln: 1, col: 1 })
  const [flash, setFlash] = useState(0)
  const gutter = useRef<HTMLDivElement>(null)
  const code = mode === 'code'
  const dirty = text !== saved
  const agentId = code ? 'editor.text' : 'notes.text'

  const save = () => {
    setSaved(text)
    setFlash((n) => n + 1)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      save()
    }
    if (code && e.key === 'Tab') {
      e.preventDefault()
      const el = e.currentTarget
      const { selectionStart: s, selectionEnd: t } = el
      setText(text.slice(0, s) + '  ' + text.slice(t))
      requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2))
    }
  }
  const trackCaret = (el: HTMLTextAreaElement) => setCaret(caretInfo(el.value, el.selectionStart))
  const lines = text.split('\n').length

  return (
    <div className={cn('flex h-full flex-col', code ? 'bg-[#1e1e23]' : 'bg-[#17181d]')}>
      {code && (
        <div className="flex h-9 shrink-0 items-end justify-between border-b border-white/[0.06] bg-[#26262c] pr-2 pl-2">
          <div className="flex h-8 items-center gap-2 rounded-t-md bg-[#1e1e23] px-3 text-[12px] text-white/85">
            {fileName}
            <span className={cn('size-1.5 rounded-full', dirty ? 'bg-amber-300' : 'bg-transparent')} />
          </div>
          <div className="flex h-9 items-center gap-2">
            <AnimatePresence>
              {flash > 0 && !dirty && (
                <motion.span
                  key={flash}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-[11px] text-emerald-300"
                >
                  <Check size={12} /> Saved
                </motion.span>
              )}
            </AnimatePresence>
            <button
              type="button"
              data-agent="editor.save"
              onClick={save}
              className="flex h-6 items-center gap-1.5 rounded-md bg-white/10 px-2.5 text-[11px] font-medium text-white/85 transition outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <Save size={12} /> Save
            </button>
          </div>
        </div>
      )}
      <div className="relative flex min-h-0 flex-1">
        {code && (
          <div
            ref={gutter}
            aria-hidden
            className="w-11 shrink-0 overflow-hidden bg-[#1e1e23] py-3 pr-3 text-right font-mono text-[12.5px] leading-[20px] text-white/25 tabular-nums"
          >
            {Array.from({ length: lines }, (_, i) => (
              <div key={i} className={cn(i + 1 === caret.ln && 'text-white/60')}>
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <textarea
          data-agent={agentId}
          value={text}
          spellCheck={false}
          placeholder={placeholder}
          aria-label={fileName}
          onChange={(e) => {
            setText(e.target.value)
            trackCaret(e.target)
          }}
          onSelect={(e) => trackCaret(e.currentTarget)}
          onKeyDown={onKeyDown}
          onScroll={(e) => gutter.current && (gutter.current.scrollTop = e.currentTarget.scrollTop)}
          className={cn(
            'scrollbar-thin h-full min-h-0 flex-1 resize-none bg-transparent text-white/90 outline-none placeholder:text-white/30',
            code ? 'py-3 pr-4 pl-2 font-mono text-[12.5px] leading-[20px] whitespace-pre' : 'px-5 py-4 text-[14px] leading-[1.65]',
          )}
        />
      </div>
      <div className="flex h-7 shrink-0 items-center gap-4 border-t border-white/[0.06] px-4 text-[11px] text-white/45 tabular-nums">
        <span>
          Ln {caret.ln}, Col {caret.col}
        </span>
        <span>{wordCount(text)} words</span>
        <span className="ml-auto">{code ? (fileName.endsWith('.md') ? 'Markdown' : 'Plain text') : '100%'}</span>
        <span>UTF-8</span>
      </div>
    </div>
  )
}
