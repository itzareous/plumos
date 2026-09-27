import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ExternalLink, FolderOpen, Globe } from 'lucide-react'
import { Card, Row, Switch } from '@/components/ui/controls'
import { useSettings } from '@/stores/settings'
import { toast } from '@/stores/toasts'
import { hostOf } from '../../lib/hostname'
import { usePrefs } from '../../lib/prefs'
import { CopyField } from '../../ui/CopyField'
import { Group, Page, Status } from '../../ui/Page'
import { ConnectSteps } from './ConnectSteps'
import { RecentDevices } from './RecentDevices'

const reveal = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { type: 'spring', stiffness: 380, damping: 38 },
} as const

export function Sharing() {
  const deviceName = useSettings((s) => s.deviceName)
  const fileSharing = usePrefs((s) => s.fileSharing)
  const remoteAccess = usePrefs((s) => s.remoteAccess)
  const set = usePrefs((s) => s.set)
  const [connecting, setConnecting] = useState(false)
  const host = hostOf(deviceName)
  const web = `http://${host}`

  useEffect(() => {
    if (!connecting) return
    const id = setTimeout(() => {
      setConnecting(false)
      set({ remoteAccess: true })
      toast('Remote access is on', { description: 'Sign in from anywhere with your Plumos account.' })
    }, 1400)
    return () => clearTimeout(id)
  }, [connecting, set])

  return (
    <Page title="Network & sharing" description="How phones and computers in your home — and beyond — reach Plumos.">
      <Group title="Web address" footer="Open it in a browser on any phone, tablet or computer on your home network.">
        <div className="flex items-center gap-2">
          <CopyField value={web} label="web address" className="min-w-0 flex-1" />
          <a
            href={web}
            target="_blank"
            rel="noreferrer"
            aria-label="Open in a new tab"
            title="Open in a new tab"
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.07] text-white/80 ring-1 ring-inset ring-white/[0.08] transition outline-none hover:bg-white/[0.12] hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <ExternalLink size={17} />
          </a>
        </div>
      </Group>

      <Group title="File sharing">
        <Card>
          <Row
            icon={<FolderOpen size={16} />}
            title="Network drive"
            description="Computers at home can open Plumos like any other drive (SMB)."
          >
            <Switch checked={fileSharing} onChange={(v) => set({ fileSharing: v })} label="Network drive" />
          </Row>
          <AnimatePresence initial={false}>
            {fileSharing ? (
              <motion.div key="on" {...reveal} className="overflow-hidden">
                <div className="border-t border-white/[0.06] px-4 pt-4 pb-5">
                  <CopyField value={`smb://${host}`} label="network drive address" caption="Network drive address" />
                  <div className="mt-5">
                    <ConnectSteps smb={`smb://${host}`} unc={`\\\\${host}`} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.p key="off" {...reveal} className="overflow-hidden">
                <span className="block border-t border-white/[0.06] px-4 py-3 text-[13px] text-white/50">
                  Computers won’t see Plumos on the network. Files and Photos still work in the browser.
                </span>
              </motion.p>
            )}
          </AnimatePresence>
        </Card>
      </Group>

      <Group title="Remote access" footer="Connections are end-to-end encrypted, so nobody in between can see your files.">
        <Card>
          <Row icon={<Globe size={16} />} title="Access from anywhere" description="Reach Plumos when you’re away from home.">
            {connecting ? (
              <span className="flex items-center gap-2 text-[12.5px] text-white/60">
                <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Connecting…
              </span>
            ) : (
              <Switch
                checked={remoteAccess}
                label="Access from anywhere"
                onChange={(v) => (v ? setConnecting(true) : set({ remoteAccess: false }))}
              />
            )}
          </Row>
          <AnimatePresence initial={false}>
            {remoteAccess && !connecting && (
              <motion.div key="status" {...reveal} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-4 py-3">
                  <Status tone="ok">Connected · 38 ms</Status>
                  <span className="text-[12.5px] text-white/45">Sign in with your Plumos name and password</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </Group>

      <Group title="Recently connected" footer="Sample devices for this demo.">
        <RecentDevices />
      </Group>
    </Page>
  )
}
