import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Layers, ShieldCheck } from 'lucide-react'
import { Card, Segmented } from '@/components/ui/controls'
import { formatBytes } from '@/lib/format'
import { poolCapacity, useStorage, type PoolMode } from '@/stores/storage'
import { toast } from '@/stores/toasts'
import { ConfirmDialog, DialogIcon } from '../../ui/Dialog'
import { ModeDiagram } from './ModeDiagram'
import { usePool } from './usePool'

const COPY: Record<PoolMode, { title: string; body: string }> = {
  combined: {
    title: 'Most space',
    body: 'Every drive’s space adds up into one big pool. If a drive fails, the files that were on it are lost — so keep a backup of anything precious.',
  },
  mirrored: {
    title: 'Most safety',
    body: 'Every file is kept on two drives at once. You get about half the space, but a drive can fail without losing a single photo.',
  },
}

export function PoolModeCard() {
  const { drives, members, mode, task, used } = usePool()
  const convertPool = useStorage((s) => s.convertPool)
  const [target, setTarget] = useState<PoolMode | null>(null)
  const [shown, setShown] = useState<PoolMode>(mode)
  // Show where the pool is heading while a switch is being confirmed or is under way.
  const view = target ?? (task?.kind === 'convert' && task.mode ? task.mode : mode)

  const request = (next: PoolMode) => {
    if (next === mode || task) return
    if (next === 'mirrored' && members.length < 2) {
      toast('Mirroring needs two drives', { description: 'Add another drive to your pool first.' })
      return
    }
    const after = poolCapacity(drives, next)
    if (after < used) {
      toast('Not enough space to mirror', { description: `You’re using ${formatBytes(used)}, but a mirrored pool would hold ${formatBytes(after)}.` })
      return
    }
    setShown(next)
    setTarget(next)
  }

  const afterCapacity = poolCapacity(drives, shown)

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <Segmented
            value={view}
            onChange={request}
            options={[
              { value: 'combined', label: <><Layers size={14} /> Combined</> },
              { value: 'mirrored', label: <><ShieldCheck size={14} /> Mirrored</> },
            ]}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              <p className="mt-4 text-[15px] font-semibold">{COPY[view].title}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-white/60">{COPY[view].body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <ModeDiagram mode={view} />
      </div>

      <ConfirmDialog
        open={target !== null}
        onClose={() => setTarget(null)}
        icon={<DialogIcon color="#10b981">{shown === 'mirrored' ? <ShieldCheck size={22} /> : <Layers size={22} />}</DialogIcon>}
        title={shown === 'mirrored' ? 'Switch to mirrored?' : 'Switch to combined?'}
        description={
          shown === 'mirrored'
            ? `Plumos will copy every file onto a second drive. Your pool will hold ${formatBytes(afterCapacity)}. You can keep using Plumos while it works.`
            : `Your drives will add up to ${formatBytes(afterCapacity)}, but files will no longer have a second copy.`
        }
        confirmLabel="Switch"
        onConfirm={() =>
          convertPool(shown, () =>
            toast(shown === 'mirrored' ? 'Your pool is mirrored' : 'Your drives are combined', {
              description: `${formatBytes(poolCapacity(useStorage.getState().drives, shown))} of space`,
            }),
          )
        }
      />
    </Card>
  )
}
