import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy, MonitorSmartphone, UserRound } from 'lucide-react'
import { Segmented } from '@/components/ui/controls'
import { useSettings } from '@/stores/settings'
import { useUsers } from '@/stores/users'
import { cn } from '@/lib/cn'
import { copyText } from '../lib/io'
import { Modal } from './Modal'

type Platform = 'mac' | 'windows'

const guessPlatform = (): Platform => (/Win/i.test(navigator.userAgent) ? 'windows' : 'mac')

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        }
      }}
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

function Address({ value, label, caption }: { value: string; label: string; caption?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-black/25 py-2 pr-2 pl-4 ring-1 ring-inset ring-white/[0.08]">
      <div className="min-w-0 flex-1">
        {caption && <p className="text-[11px] font-semibold tracking-wide text-white/40 uppercase">{caption}</p>}
        <code className="selectable block font-mono text-[14.5px] break-all text-white">{value}</code>
      </div>
      <CopyButton text={value} label={label} />
    </div>
  )
}

function Steps({ children }: { children: ReactNode[] }) {
  return (
    <ol className="mt-4 flex flex-col gap-3">
      {children.map((step, i) => (
        <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-white/75">
          <span className="mt-px flex size-[22px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent tabular-nums">
            {i + 1}
          </span>
          <span className="min-w-0">{step}</span>
        </li>
      ))}
    </ol>
  )
}

const Key = ({ children }: { children: ReactNode }) => <span className="font-semibold text-white">{children}</span>

export function ConnectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const deviceName = useSettings((s) => s.deviceName) || 'plumos'
  const userName = useSettings((s) => s.userName)
  const members = useUsers((s) => s.members)
  const [platform, setPlatform] = useState<Platform>(guessPlatform)

  const host = `${deviceName.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}.local`
  const smb = `smb://${host}`
  const unc = `\\\\${host}`
  const people = [userName, ...members.map((m) => m.name)].filter(Boolean)
  const peopleText =
    people.length > 1 ? `${people.slice(0, -1).join(', ')} and ${people[people.length - 1]}` : (people[0] ?? 'Everyone')

  return (
    <Modal open={open} onClose={onClose} label="Connect from your computer" className="max-w-[500px]">
      <div className="p-6 pt-7 sm:p-7">
        <div className="flex items-start gap-4 pr-8">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <MonitorSmartphone size={24} />
          </span>
          <div>
            <h2 className="text-[19px] font-semibold tracking-tight">Connect from your computer</h2>
            <p className="mt-1 text-[13.5px] leading-snug text-white/55">
              {deviceName[0].toUpperCase() + deviceName.slice(1)} shows up next to your other drives, so you can drag files in and out
              like anywhere else.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Address value={smb} label="network address" caption="Network address" />
        </div>

        <div className="mt-5 flex justify-center">
          <Segmented
            value={platform}
            onChange={setPlatform}
            options={[
              { value: 'mac', label: 'Mac' },
              { value: 'windows', label: 'Windows' },
            ]}
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={platform}
            initial={{ opacity: 0, x: platform === 'mac' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: platform === 'mac' ? 10 : -10 }}
            transition={{ duration: 0.18 }}
          >
            {platform === 'mac' ? (
              <Steps>
                {[
                  <>
                    In <Key>Finder</Key>, open the <Key>Go</Key> menu and choose <Key>Connect to Server</Key> (⌘K).
                  </>,
                  <>
                    Paste <code className="font-mono text-white">{smb}</code> and click <Key>Connect</Key>.
                  </>,
                  <>Sign in with your Plumos name and password, then pick your own folder and Shared.</>,
                ]}
              </Steps>
            ) : (
              <Steps>
                {[
                  <>
                    Open <Key>File Explorer</Key>, right-click <Key>This PC</Key> and choose <Key>Map network drive</Key>.
                  </>,
                  <div className="flex flex-col gap-2">
                    <span>Choose a drive letter and enter this folder:</span>
                    <Address value={`${unc}\\${userName}`} label="Windows address" />
                    <span className="text-white/50">
                      Map <code className="font-mono text-white/80">{unc}\Shared</code> the same way for family files.
                    </span>
                  </div>,
                  <>
                    Tick <Key>Connect using different credentials</Key> and sign in with your Plumos name and password.
                  </>,
                ]}
              </Steps>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3.5 ring-1 ring-inset ring-white/[0.07]">
          <div className="flex shrink-0 -space-x-2">
            {people.slice(0, 4).map((name, i) => (
              <span
                key={name + i}
                className="flex size-8 items-center justify-center rounded-full text-[12px] font-bold text-white ring-2 ring-[#1b1b24]"
                style={{ background: i === 0 ? 'var(--color-accent)' : (members[i - 1]?.color ?? '#64748b') }}
              >
                {name ? name[0].toUpperCase() : <UserRound size={14} />}
              </span>
            ))}
          </div>
          <p className="text-[12.5px] leading-snug text-white/60">
            Everyone signs in with their own account. {peopleText} each see their own files, plus the Shared folder you all have.
          </p>
        </div>
      </div>
    </Modal>
  )
}
