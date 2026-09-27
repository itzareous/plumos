import { AnimatePresence, motion, type MotionValue } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { useScale } from '../screen/scale'
import { useAgent } from './store'

const LABEL = { pointer: 'Agent', text: 'Agent · typing', scroll: 'Agent · scrolling' } as const

/**
 * The agent's own cursor, drawn inside the guest screen. It is counter-scaled
 * so it stays legible when the guest display is shrunk to fit.
 */
export function AgentCursor({ x, y, visible }: { x: MotionValue<number>; y: MotionValue<number>; visible: boolean }) {
  const k = Math.min(3.2, Math.max(1, 0.95 / useScale()))
  const mode = useAgent((s) => s.cursorMode)
  const presses = useAgent((s) => s.presses)
  const paused = useAgent((s) => s.status === 'paused')

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-[5000]"
          style={{ x, y }}
          initial={{ opacity: 0 }}
          animate={{ opacity: paused ? 0.55 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div style={{ transform: `scale(${k})`, transformOrigin: '0 0' }}>
            {presses > 0 && (
              <motion.span
                key={presses}
                className="absolute -top-5 -left-5 size-10 rounded-full border-2 border-[#ff6a3d]"
                initial={{ scale: 0.2, opacity: 0.9 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              />
            )}
            <motion.div
              key={`p${presses}`}
              initial={{ scale: presses ? 0.78 : 1 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 700, damping: 18 }}
              style={{ transformOrigin: '0 0' }}
              className="drop-shadow-[0_3px_6px_rgb(0_0_0/0.45)]"
            >
              {mode === 'text' ? <IBeam /> : <Arrow />}
            </motion.div>
            <div
              className="absolute top-[22px] left-[14px] flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ff7a3d] to-[#ff3d7f] py-[3px] pr-2 pl-1.5 text-[11px] font-semibold whitespace-nowrap text-white shadow-[0_4px_14px_-2px_rgb(255_80_80/0.6)] ring-1 ring-white/40"
            >
              <Sparkles size={11} strokeWidth={2.4} />
              {paused ? 'Agent · paused' : LABEL[mode]}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Arrow() {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" className="block">
      <defs>
        <linearGradient id="vm-agent-cursor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8a3d" />
          <stop offset="1" stopColor="#ff2d78" />
        </linearGradient>
      </defs>
      <path d="M1.5 1.5v19.2l5.1-4.6 3.6 8 3.6-1.6-3.6-7.9h7z" fill="url(#vm-agent-cursor)" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function IBeam() {
  return (
    <svg width="14" height="24" viewBox="0 0 14 24" className="-mt-3 -ml-[7px] block">
      <path d="M3 2h3.2c.6 0 .8.4.8.8v18.4c0 .4-.2.8-.8.8H3M11 2H7.8M11 22H7.8" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M3 2h3.2c.6 0 .8.4.8.8v18.4c0 .4-.2.8-.8.8H3M11 2H7.8M11 22H7.8" stroke="#ff4d6a" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}
