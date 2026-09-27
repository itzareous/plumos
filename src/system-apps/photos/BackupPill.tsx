import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { usePhotos } from '@/stores/photos'
import { cn } from '@/lib/cn'
import { count } from './format'

function Ring({ value }: { value: number }) {
  const r = 7
  const c = 2 * Math.PI * r
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="-rotate-90" aria-hidden>
      <circle cx="9" cy="9" r={r} fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="2.2" />
      <motion.circle
        cx="9"
        cy="9"
        r={r}
        fill="none"
        stroke="var(--plumos-accent)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={false}
        animate={{ strokeDashoffset: c * (1 - value) }}
        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
      />
    </svg>
  )
}

/** "Backing up 1,204 of 1,390" while the phone uploads; a quiet check once it's done. */
export function BackupPill({ onClick, className }: { onClick: () => void; className?: string }) {
  const backup = usePhotos((s) => s.backup)
  const running = backup.status === 'running'
  return (
    <AnimatePresence initial={false}>
      {backup.status !== 'idle' && (
        <motion.button
          key="pill"
          type="button"
          layout
          onClick={onClick}
          initial={{ opacity: 0, scale: 0.85, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          aria-live="polite"
          className={cn(
            'inline-flex h-8 shrink-0 items-center gap-2 rounded-full bg-white/[0.08] pr-3.5 pl-2 text-[12.5px] font-medium whitespace-nowrap text-white/90 ring-1 ring-white/10 transition-colors ring-inset outline-none hover:bg-white/[0.13] focus-visible:ring-2 focus-visible:ring-white/60',
            className,
          )}
        >
          {running ? <Ring value={backup.total ? backup.done / backup.total : 0} /> : <CheckCircle2 size={17} className="text-emerald-400" />}
          <span className="tabular-nums">
            {running ? `Backing up ${count(backup.done)} of ${count(backup.total)}` : 'Phone backed up'}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
