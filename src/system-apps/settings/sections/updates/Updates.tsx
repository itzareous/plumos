import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleCheck, HardDrive, LayoutGrid, Monitor, RefreshCw, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, Row, Switch } from '@/components/ui/controls'
import { formatRelativeDate } from '@/lib/format'
import { usePrefs } from '../../lib/prefs'
import { PLUMOS_VERSION } from '../../lib/version'
import { LogoTile } from '../../ui/LogoTile'
import { Group, Page } from '../../ui/Page'

const NOTES = [
  { icon: HardDrive, text: 'Plug in a drive and grow your storage pool in a couple of clicks.' },
  { icon: Users, text: 'A private space for everyone at home, plus one to share.' },
  { icon: LayoutGrid, text: 'Pick and arrange the widgets on your home screen.' },
  { icon: Monitor, text: 'Run Windows, Linux or Android in a virtual machine.' },
]

const lastChecked = (t: number) => {
  const text = formatRelativeDate(t)
  return text === 'Just now' ? 'just now' : text
}

export function Updates() {
  const autoUpdate = usePrefs((s) => s.autoUpdate)
  const lastUpdateCheck = usePrefs((s) => s.lastUpdateCheck)
  const set = usePrefs((s) => s.set)
  const [state, setState] = useState<'idle' | 'checking' | 'done'>('idle')

  useEffect(() => {
    if (state !== 'checking') return
    const id = setTimeout(() => {
      set({ lastUpdateCheck: Date.now() })
      setState('done')
    }, 2200)
    return () => clearTimeout(id)
  }, [state, set])

  return (
    <Page title="Updates">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <LogoTile size={56} />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-semibold tracking-tight">Plumos {PLUMOS_VERSION}</p>
            <div className="relative mt-0.5 h-5 overflow-hidden text-[13px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={state}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-1.5 text-white/55"
                  aria-live="polite"
                >
                  {state === 'checking' && 'Checking for updates…'}
                  {state === 'done' && (
                    <>
                      <CircleCheck size={14} className="text-emerald-400" />
                      <span className="font-medium text-white">Plumos is up to date</span>
                    </>
                  )}
                  {state === 'idle' && `Last checked ${lastChecked(lastUpdateCheck)}`}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <Button
            onClick={() => setState('checking')}
            disabled={state === 'checking'}
            icon={state === 'checking' ? <span className="size-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" /> : <RefreshCw size={15} />}
            className="max-sm:w-full"
          >
            {state === 'checking' ? 'Checking…' : 'Check for updates'}
          </Button>
        </div>
      </Card>

      <Group
        footer={
          autoUpdate
            ? 'Updates install overnight, when nobody is using Plumos. Your apps and files stay just as they are.'
            : 'You’ll see a notification here when a new version is ready.'
        }
      >
        <Card>
          <Row title="Automatic updates" description="Download and install new versions of Plumos.">
            <Switch checked={autoUpdate} onChange={(v) => set({ autoUpdate: v })} label="Automatic updates" />
          </Row>
        </Card>
      </Group>

      <Group title={`What’s new in ${PLUMOS_VERSION.split('.').slice(0, 2).join('.')}`}>
        <Card className="p-2">
          <ul>
            {NOTES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-[13.5px] text-white/75">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon size={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </Card>
      </Group>
    </Page>
  )
}
