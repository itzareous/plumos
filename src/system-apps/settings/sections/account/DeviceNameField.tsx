import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toasts'
import { useSettings } from '@/stores/settings'
import { cn } from '@/lib/cn'
import { MAX_HOSTNAME, hostnameError, softenHostname } from '../../lib/hostname'
import { FieldRow } from '../../ui/FieldRow'

/** The server's network name. Only saved when valid, since it changes every address. */
export function DeviceNameField() {
  const deviceName = useSettings((s) => s.deviceName)
  const set = useSettings((s) => s.set)
  const [draft, setDraft] = useState<string | null>(null)
  const value = draft ?? deviceName
  const dirty = draft !== null && draft !== deviceName
  const error = dirty ? hostnameError(draft) : null

  const save = () => {
    if (!dirty || error) return
    set({ deviceName: draft })
    setDraft(null)
    toast('Device name changed', { description: `Plumos is now at http://${draft}.local` })
  }

  return (
    <FieldRow
      label="Device name"
      htmlFor="settings-device"
      description={
        <>
          Your server’s name on the network. Letters, numbers and hyphens.
          <AnimatePresence initial={false}>
            {error && (
              <motion.span
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="block overflow-hidden pt-1 text-red-300"
              >
                {error}
              </motion.span>
            )}
          </AnimatePresence>
        </>
      }
    >
      <div className="flex w-full flex-col gap-2 sm:w-[240px]">
        <div
          className={cn(
            'flex h-10 items-center rounded-xl bg-white/[0.07] ring-1 ring-inset transition focus-within:bg-white/10',
            error ? 'ring-red-400/60' : 'ring-white/10 focus-within:ring-white/30',
          )}
        >
          <input
            id="settings-device"
            value={value}
            maxLength={MAX_HOSTNAME + 8}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-invalid={Boolean(error)}
            onChange={(e) => setDraft(softenHostname(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape' && dirty) {
                // Undo the edit instead of closing Settings.
                e.preventDefault()
                setDraft(null)
              }
            }}
            className="h-full min-w-0 flex-1 bg-transparent pl-3.5 font-mono text-[13.5px] text-white outline-none placeholder:text-white/35"
            placeholder="plumos"
          />
          <span className="pr-3.5 font-mono text-[13.5px] text-white/40">.local</span>
        </div>
        <AnimatePresence initial={false}>
          {dirty && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-end gap-2 overflow-hidden"
            >
              <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={save} disabled={Boolean(error)}>
                Rename
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FieldRow>
  )
}
