import { useState } from 'react'
import { Power as PowerIcon, RotateCcw, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/controls'
import { useSettings } from '@/stores/settings'
import { hostOf } from '../../lib/hostname'
import { ConfirmDialog, DialogIcon } from '../../ui/Dialog'
import { IconTile } from '../../ui/IconTile'
import { Page } from '../../ui/Page'
import { showPowerOverlay, type PowerAction } from './PowerOverlay'

const ACTIONS: Record<
  PowerAction,
  { title: string; icon: LucideIcon; color: string; blurb: string; question: string; detail: string; confirm: string }
> = {
  restart: {
    title: 'Restart',
    icon: RotateCcw,
    color: '#f59e0b',
    blurb: 'Turn your server off and on again. Takes about a minute.',
    question: 'Restart Plumos?',
    detail: 'Apps pause and anyone connected is signed out for about a minute. Transfers pick up where they left off.',
    confirm: 'Restart',
  },
  shutdown: {
    title: 'Shut down',
    icon: PowerIcon,
    color: '#e11d48',
    blurb: 'Turn your server off, for example before moving it.',
    question: 'Shut down Plumos?',
    detail: 'Everything stops until someone presses the power button on the server.',
    confirm: 'Shut down',
  },
}

export function Power() {
  const deviceName = useSettings((s) => s.deviceName)
  const [asking, setAsking] = useState<PowerAction | null>(null)
  const [open, setOpen] = useState(false)
  const current = asking ? ACTIONS[asking] : null

  return (
    <Page title="Power" description={`Restart or shut down ${hostOf(deviceName)}.`}>
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(ACTIONS) as PowerAction[]).map((key) => {
          const a = ACTIONS[key]
          return (
            <Card key={key} className="flex flex-col p-5">
              <IconTile icon={a.icon} color={a.color} size={40} />
              <p className="mt-4 text-[16px] font-semibold">{a.title}</p>
              <p className="mt-1 flex-1 text-[13.5px] leading-relaxed text-white/55">{a.blurb}</p>
              <Button
                className="mt-5 self-start"
                variant={key === 'shutdown' ? 'danger' : 'secondary'}
                onClick={() => {
                  setAsking(key)
                  setOpen(true)
                }}
              >
                {a.title}…
              </Button>
            </Card>
          )
        })}
      </div>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        icon={current && <DialogIcon color={current.color}>{<current.icon size={22} />}</DialogIcon>}
        title={current?.question ?? ''}
        description={current?.detail}
        confirmLabel={current?.confirm ?? 'OK'}
        danger={asking === 'shutdown'}
        onConfirm={() => asking && showPowerOverlay(asking)}
      />
    </Page>
  )
}
