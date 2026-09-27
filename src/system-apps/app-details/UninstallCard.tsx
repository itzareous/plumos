import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Trash2 } from 'lucide-react'
import type { AppInfo } from '@/apps/types'
import { AppIcon } from '@/components/icons/AppIcon'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/controls'
import { useApps } from '@/stores/apps'
import { toast } from '@/stores/toasts'
import { useWindows } from '@/stores/windows'

/** Uninstall, with a confirmation step so a stray click can't remove anything. */
export function UninstallCard({ app }: { app: AppInfo }) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setConfirming(false)
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [confirming])

  const confirm = () => {
    useApps.getState().uninstall(app.id)
    useWindows.getState().close()
    toast(`${app.name} was uninstalled`, { icon: <AppIcon icon={app.icon} size={36} /> })
  }

  return (
    <Card className={confirming ? 'ring-red-400/30' : undefined}>
      <div className="flex flex-wrap items-center gap-3.5 px-4 py-3.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-300">
          <Trash2 size={16} />
        </span>
        <div className="min-w-[180px] flex-1">
          <div className="text-sm font-medium">{confirming ? `Uninstall ${app.name}?` : `Uninstall ${app.name}`}</div>
          <div className="mt-0.5 text-[13px] text-white/50">
            {confirming
              ? 'This removes the app and its data from this server. It can’t be undone.'
              : 'Remove the app and its data from this server.'}
          </div>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          {confirming ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex gap-2"
            >
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" autoFocus onClick={confirm}>
                Uninstall
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="ask"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
            >
              <Button size="sm" variant="secondary" className="text-red-300!" onClick={() => setConfirming(true)}>
                Uninstall…
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}
