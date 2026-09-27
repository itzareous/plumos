import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toasts'
import { useUsers } from '@/stores/users'
import { CopyButton, CopyField } from '../../ui/CopyField'
import { Dialog, DialogIcon } from '../../ui/Dialog'
import { PairingCode } from './PairingCode'

type Step = 'scan' | 'verify' | 'codes'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomString(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')
}

const STEP_TEXT: Record<Step, { title: string; description: string }> = {
  scan: {
    title: 'Set up two-factor sign-in',
    description: 'Scan this code with an authenticator app on your phone. It will start showing a new 6-digit code every 30 seconds.',
  },
  verify: {
    title: 'Enter the 6-digit code',
    description: 'Type the code your authenticator app shows for Plumos, to make sure everything is linked up.',
  },
  codes: {
    title: 'Save your recovery codes',
    description: 'If you lose your phone, each of these codes lets you sign in once. Keep them somewhere safe.',
  },
}

/** Mock two-factor setup: pairing code → verify → recovery codes. */
export function TwoFactorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setOwner = useUsers((s) => s.setOwner)
  const [step, setStep] = useState<Step>('scan')
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secret, setSecret] = useState(() => randomString(16))
  // New codes with every new secret.
  const recovery = useMemo(() => Array.from({ length: 8 }, () => `${randomString(4)}-${randomString(4)}`.toLowerCase()), [secret])

  useEffect(() => {
    if (!open) return
    setStep('scan')
    setCode('')
    setError(null)
    setChecking(false)
    setSecret(randomString(16))
  }, [open])

  // Enter moves things along: focus the main button on steps without a text field.
  useEffect(() => {
    if (!open || step === 'verify') return
    const id = requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-two-factor-next]')?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(id)
  }, [open, step])

  const verify = (value = code) => {
    if (checking) return
    if (!/^\d{6}$/.test(value)) {
      setError('Enter all 6 digits.')
      return
    }
    setError(null)
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
      setStep('codes')
    }, 800)
  }

  const finish = () => {
    setOwner({ twoFactor: true })
    onClose()
    toast('Two-factor sign-in is on', { description: 'You’ll enter a code from your phone when you sign in.' })
  }

  const text = STEP_TEXT[step]
  const grouped = secret.match(/.{4}/g)?.join(' ') ?? secret

  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={
        <DialogIcon color="#10b981">
          <ShieldCheck size={22} />
        </DialogIcon>
      }
      title={text.title}
      description={text.description}
      onSubmit={() => (step === 'scan' ? setStep('verify') : step === 'verify' ? verify() : finish())}
      footer={
        <>
          {step === 'verify' && (
            <Button className="mr-auto" variant="ghost" onClick={() => setStep('scan')}>
              Back
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button data-two-factor-next type="submit" variant="primary" disabled={checking} className="min-w-[96px]">
            {checking ? (
              <span className="size-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
            ) : step === 'codes' ? (
              'Turn on'
            ) : step === 'verify' ? (
              'Verify'
            ) : (
              'Next'
            )}
          </Button>
        </>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16, transition: { duration: 0.1 } }}
          transition={{ duration: 0.18 }}
        >
          {step === 'scan' && (
            <div className="flex flex-col items-center gap-4">
              <PairingCode secret={secret} />
              <CopyField value={grouped} label="setup key" caption="Can’t scan? Enter this key" className="w-full" />
            </div>
          )}
          {step === 'verify' && (
            <div>
              <input
                autoFocus
                value={code}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="6-digit code"
                aria-invalid={Boolean(error)}
                maxLength={6}
                placeholder="000000"
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(v)
                  setError(null)
                  if (v.length === 6) verify(v)
                }}
                className="h-16 w-full rounded-2xl bg-white/[0.07] text-center font-mono text-[30px] tracking-[0.45em] text-white tabular-nums ring-1 ring-inset ring-white/10 outline-none placeholder:text-white/15 focus:bg-white/10 focus:ring-white/30"
              />
              <p className={error ? 'mt-2 text-[12.5px] text-red-300' : 'mt-2 text-[12.5px] text-white/40'} role={error ? 'alert' : undefined}>
                {error ?? 'This is a demo — any 6 digits will do.'}
              </p>
            </div>
          )}
          {step === 'codes' && (
            <div>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/25 p-4 ring-1 ring-inset ring-white/[0.08]">
                {recovery.map((c) => (
                  <code key={c} className="selectable text-center font-mono text-[14px] tracking-wide text-white/90">
                    {c}
                  </code>
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <CopyButton text={recovery.join('\n')} label="recovery codes" />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Dialog>
  )
}
