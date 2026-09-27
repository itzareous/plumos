import { useEffect, useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/stores/toasts'
import { useUsers } from '@/stores/users'
import { Dialog, DialogIcon } from '../../ui/Dialog'
import { PasswordField, StrengthMeter } from './PasswordField'

type Errors = Partial<Record<'current' | 'next' | 'confirm', string>>

function validate(current: string, next: string, confirm: string): Errors {
  const errors: Errors = {}
  if (!current) errors.current = 'Enter your current password.'
  if (next.length < 8) errors.next = 'Use at least 8 characters.'
  else if (next === current) errors.next = 'Choose a password you haven’t used here before.'
  if (!errors.next && confirm !== next) errors.confirm = 'The passwords don’t match.'
  return errors
}

/** Mock password change: validated in the browser, nothing is sent anywhere. */
export function PasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setOwner = useUsers((s) => s.setOwner)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setCurrent('')
    setNext('')
    setConfirm('')
    setSubmitted(false)
    setSaving(false)
  }, [open])

  const errors = submitted ? validate(current, next, confirm) : {}

  const submit = () => {
    setSubmitted(true)
    if (saving || Object.keys(validate(current, next, confirm)).length) return
    setSaving(true)
    setTimeout(() => {
      setOwner({ passwordChangedAt: Date.now() })
      onClose()
      toast('Password changed', { description: 'Use your new password next time you sign in.' })
    }, 900)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={
        <DialogIcon>
          <KeyRound size={22} />
        </DialogIcon>
      }
      title="Change password"
      description="You’ll use it to sign in to Plumos and to connect from your computer."
      onSubmit={submit}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving} className="min-w-[148px]">
            {saving ? <span className="size-4 animate-spin rounded-full border-2 border-black/20 border-t-black" /> : 'Change password'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <PasswordField
          id="pw-current"
          label="Current password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          error={errors.current}
          data-autofocus
        />
        <div>
          <PasswordField
            id="pw-new"
            label="New password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            error={errors.next}
          />
          <StrengthMeter password={next} />
        </div>
        <PasswordField
          id="pw-confirm"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
      </div>
    </Dialog>
  )
}
