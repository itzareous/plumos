import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Clipboard API needs a secure context; fall back to a hidden textarea.
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    el.remove()
    return ok
  }
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(id)
  }, [copied])
  return (
    <button
      type="button"
      onClick={async () => setCopied(await copyText(text))}
      aria-label={`Copy ${label}`}
      className={cn(
        'flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95',
        copied ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-white/90 hover:bg-white/20',
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'y' : 'n'}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={13} />}
        </motion.span>
      </AnimatePresence>
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/** An address in monospace with a copy button. */
export function CopyField({ value, label, caption, className }: { value: string; label: string; caption?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl bg-black/25 py-2 pr-2 pl-4 ring-1 ring-inset ring-white/[0.08]', className)}>
      <div className="min-w-0 flex-1">
        {caption && <p className="text-[11px] font-semibold tracking-wide text-white/40 uppercase">{caption}</p>}
        <code className="selectable block font-mono text-[14px] break-all text-white">{value}</code>
      </div>
      <CopyButton text={value} label={label} />
    </div>
  )
}
