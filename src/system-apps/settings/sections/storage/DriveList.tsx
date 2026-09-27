import { useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { HardDrive, Plug } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/controls'
import { formatBytes } from '@/lib/format'
import { poolCapacity, useStorage, type Drive } from '@/stores/storage'
import { toast } from '@/stores/toasts'
import { ConfirmDialog, DialogIcon } from '../../ui/Dialog'
import { Group } from '../../ui/Page'
import { DriveRow } from './DriveRow'
import { usePool } from './usePool'

const poolSize = () => {
  const { drives, poolMode } = useStorage.getState()
  return formatBytes(poolCapacity(drives, poolMode))
}

export function DriveList() {
  const { drives, members, mode, task, used } = usePool()
  const expandPool = useStorage((s) => s.expandPool)
  const shrinkPool = useStorage((s) => s.shrinkPool)
  const ejectDrive = useStorage((s) => s.ejectDrive)
  const simulateNewDrive = useStorage((s) => s.simulateNewDrive)
  const [removing, setRemoving] = useState<Drive | null>(null)
  const [confirming, setConfirming] = useState(false)

  const internal = useMemo(() => drives.filter((d) => d.location === 'internal'), [drives])
  const external = useMemo(() => drives.filter((d) => d.location === 'external'), [drives])

  /** Why a drive can't leave the pool right now, if it can't. */
  const removeBlocker = (d: Drive) => {
    if (members.length <= 1) return 'It’s the only drive in your pool.'
    const after = poolCapacity(
      drives.map((x) => (x.id === d.id ? { ...x, inPool: false } : x)),
      mode,
    )
    if (after < used) return `The other drives can’t hold the ${formatBytes(used)} you’re using.`
    return null
  }

  const add = (d: Drive) => {
    if (task) return
    expandPool(d.id, () => toast('Storage expanded', { description: `${d.name} joined your pool — ${poolSize()} in total.` }))
  }

  const askRemove = (d: Drive) => {
    if (task) return
    const blocker = removeBlocker(d)
    if (blocker) {
      toast(`${d.name} can’t be removed`, { description: blocker })
      return
    }
    setRemoving(d)
    setConfirming(true)
  }

  const plugIn = () => {
    const d = simulateNewDrive()
    toast('New drive connected', { description: `${formatBytes(d.size)} ${d.kind === 'hdd' ? 'hard drive' : 'drive'} — add it to your pool for more space.` })
  }

  return (
    <>
      <Group
        title="Drives"
        action={
          <Button size="sm" icon={<Plug size={14} />} onClick={plugIn}>
            <span className="max-sm:hidden">Simulate plugging in a drive</span>
            <span className="sm:hidden">Plug in a drive</span>
          </Button>
        }
        footer="Drives inside your server can join the pool. USB drives show up in Files, where you can browse them and import photos."
      >
        <Card>
          <AnimatePresence initial={false}>
            {internal.map((d) => (
              <DriveRow
                key={d.id}
                drive={d}
                task={task}
                actions={
                  d.inPool ? (
                    <Button size="sm" variant="ghost" onClick={() => askRemove(d)} disabled={Boolean(task)} aria-label={`Remove ${d.name} from pool`}>
                      Remove
                    </Button>
                  ) : (
                    <Button size="sm" variant="primary" onClick={() => add(d)} disabled={Boolean(task)}>
                      Add to pool
                    </Button>
                  )
                }
              />
            ))}
          </AnimatePresence>
        </Card>
      </Group>

      {external.length > 0 && (
        <Group title="External drives">
          <Card>
            <AnimatePresence initial={false}>
              {external.map((d) => (
                <DriveRow
                  key={d.id}
                  drive={d}
                  task={task}
                  actions={
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        ejectDrive(d.id)
                        toast(`${d.name} ejected`, { description: 'It’s safe to unplug it now.' })
                      }}
                    >
                      Eject
                    </Button>
                  }
                />
              ))}
            </AnimatePresence>
          </Card>
        </Group>
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        icon={
          <DialogIcon color="#64748b">
            <HardDrive size={22} />
          </DialogIcon>
        }
        title={`Remove ${removing?.name ?? 'drive'} from the pool?`}
        description={
          mode === 'mirrored' && members.length === 2
            ? 'Your files will no longer have a second copy until you add another drive. You can keep using Plumos meanwhile.'
            : 'Plumos will first move everything on it to your other drives. It can take a while — you can keep using Plumos meanwhile.'
        }
        confirmLabel="Remove"
        danger
        onConfirm={() => {
          if (!removing) return
          const name = removing.name
          shrinkPool(removing.id, () => toast(`${name} left the pool`, { description: `Your pool is now ${poolSize()}.` }))
        }}
      />
    </>
  )
}
