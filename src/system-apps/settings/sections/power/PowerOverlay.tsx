import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { Logo } from '@/components/icons/Logo'
import { useWindows } from '@/stores/windows'

export type PowerAction = 'restart' | 'shutdown'

const TEXT: Record<PowerAction, [string, string]> = {
  restart: ['Restarting…', 'Starting up…'],
  shutdown: ['Shutting down…', 'This is a demo — starting back up…'],
}

/**
 * The black screen a server shows while it restarts. It closes Settings once
 * the screen is dark, then fades back to the home screen after about 4 s.
 */
function PowerOverlay({ action, onDone }: { action: PowerAction; onDone: () => void }) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => {
        useWindows.getState().close()
        setPhase(1)
      }, 2100),
      setTimeout(() => setPhase(2), 4200),
    ]
    // Nothing else responds while the "server" is down.
    const swallow = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('keydown', swallow, { capture: true })
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('keydown', swallow, { capture: true })
    }
  }, [])

  const off = action === 'shutdown' && phase === 1

  return (
    <AnimatePresence onExitComplete={onDone}>
      {phase < 2 && (
        <motion.div
          role="alertdialog"
          aria-live="assertive"
          aria-label={TEXT[action][Math.min(phase, 1)]}
          className="fixed inset-0 z-[200] flex cursor-none flex-col items-center justify-center bg-black text-white select-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } }}
          transition={{ duration: 0.45 }}
        >
          <motion.div
            animate={{ opacity: off ? 0.25 : [0.55, 1, 0.55], scale: off ? 0.94 : 1 }}
            transition={off ? { duration: 0.6 } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Logo size={76} />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="mt-7 text-[15px] font-medium text-white/75"
            >
              {TEXT[action][Math.min(phase, 1)]}
            </motion.p>
          </AnimatePresence>
          <div className="mt-6 h-1 w-40 overflow-hidden rounded-full bg-white/15">
            <motion.div
              className="h-full rounded-full bg-white/85"
              initial={{ width: '0%' }}
              animate={{ width: phase === 0 ? '45%' : '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Shows the overlay in its own root, so it outlives the Settings sheet it closes. */
export function showPowerOverlay(action: PowerAction) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  root.render(
    <MotionConfig reducedMotion="user">
      <PowerOverlay
        action={action}
        onDone={() => {
          // Unmount outside React's commit phase.
          setTimeout(() => {
            root.unmount()
            host.remove()
          })
        }}
      />
    </MotionConfig>,
  )
}
