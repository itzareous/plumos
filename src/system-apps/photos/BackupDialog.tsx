import { useMemo } from 'react'
import { CheckCircle2, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/controls'
import { useSettings } from '@/stores/settings'
import { usePhotos } from '@/stores/photos'
import { Dialog, DialogFooter } from './Dialog'
import { PairingCode, pairingText } from './PairingCode'
import { PhoneArt } from './Illustrations'
import { count } from './format'

const STEPS = [
  'Install the Plumos app on your phone.',
  'Tap “Add a server” and point the camera at this pairing code.',
  'Pick what to back up. From then on it just happens.',
]

export function BackupDialog({ open, onClose, onShowLibrary }: { open: boolean; onClose: () => void; onShowLibrary: () => void }) {
  const deviceName = useSettings((s) => s.deviceName)
  const userName = useSettings((s) => s.userName)
  const backup = usePhotos((s) => s.backup)
  const startBackup = usePhotos((s) => s.startBackup)
  const code = useMemo(() => pairingText(deviceName), [deviceName])
  const phone = `${userName || 'Your'}’s phone`
  const ratio = backup.total ? backup.done / backup.total : 0

  return (
    <Dialog open={open} onClose={onClose} label="Back up your phone" className="max-w-[640px]">
      {backup.status === 'idle' ? (
        <>
          <div className="grid gap-7 px-6 pt-8 pb-6 sm:grid-cols-[auto_1fr] sm:px-8 sm:pt-9">
            <div className="flex flex-col items-center">
              <div className="rounded-[22px] bg-white p-2.5 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.7)]">
                <PairingCode value={`${deviceName}:${code}`} size={172} />
              </div>
              <div className="mt-3 text-[11px] font-semibold tracking-[0.12em] text-white/45 uppercase">Pairing code</div>
              <div className="selectable mt-0.5 font-mono text-[13.5px] tracking-[0.14em] text-white/85">{code}</div>
            </div>
            <div className="min-w-0 pr-6 sm:pr-4">
              <h2 className="text-[22px] leading-tight font-bold tracking-tight">Back up your phone</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                Every photo and video you take is copied to <span className="text-white/85">{deviceName}</span> moments later. At home it
                travels over your own Wi-Fi, and nothing is stored in anyone else’s cloud.
              </p>
              <ol className="mt-5 space-y-3">
                {STEPS.map((s, i) => (
                  <li key={i} className="flex gap-3 text-[13.5px] leading-snug text-white/80">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold text-white tabular-nums">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <DialogFooter>
            <span className="mr-auto hidden text-[12.5px] text-white/40 sm:block">No phone handy? Try the demo.</span>
            <Button variant="ghost" onClick={onClose}>
              Not now
            </Button>
            <Button variant="primary" icon={<Smartphone size={16} />} onClick={() => startBackup(phone)} data-autofocus>
              Simulate phone connected
            </Button>
          </DialogFooter>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center px-6 pt-9 pb-7 text-center sm:px-10">
            <PhoneArt active={backup.status === 'running'} />
            <h2 className="mt-4 text-[22px] font-bold tracking-tight">
              {backup.status === 'running' ? `${backup.device || phone} is connected` : 'Your phone is backed up'}
            </h2>
            <p className="mt-2 max-w-[420px] text-[14px] leading-relaxed text-white/60">
              {backup.status === 'running'
                ? 'New photos appear at the top of your library as they arrive. You can close this window, the backup keeps going.'
                : 'From now on, new photos and videos are backed up automatically whenever your phone has a connection.'}
            </p>
            <div className="mt-6 w-full max-w-[420px] rounded-2xl bg-white/[0.06] p-4 text-left ring-1 ring-white/[0.08] ring-inset">
              <div className="mb-2.5 flex items-center justify-between text-[13.5px]">
                <span className="flex items-center gap-2 font-medium">
                  {backup.status === 'done' && <CheckCircle2 size={16} className="text-emerald-400" />}
                  {backup.status === 'running' ? `Backing up ${count(backup.done)} of ${count(backup.total)}` : `${count(backup.total)} photos and videos`}
                </span>
                <span className="text-white/50 tabular-nums">{Math.round(ratio * 100)}%</span>
              </div>
              <ProgressBar value={ratio} color={backup.status === 'done' ? '#34d399' : 'var(--plumos-accent)'} className="h-2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              data-autofocus
              onClick={() => {
                onClose()
                onShowLibrary()
              }}
            >
              Show in Library
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  )
}
