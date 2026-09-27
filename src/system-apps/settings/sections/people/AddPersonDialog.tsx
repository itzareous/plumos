import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import { useSettings } from '@/stores/settings'
import { toast } from '@/stores/toasts'
import { useUsers, type Member } from '@/stores/users'
import { hostOf } from '../../lib/hostname'
import { Dialog, DialogIcon } from '../../ui/Dialog'
import { ROLES } from './roles'

export function AddPersonDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const members = useUsers((s) => s.members)
  const addMember = useUsers((s) => s.addMember)
  const userName = useSettings((s) => s.userName)
  const deviceName = useSettings((s) => s.deviceName)
  const [name, setName] = useState('')
  const [role, setRole] = useState<Member['role']>('member')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setRole('member')
    setSubmitted(false)
  }, [open])

  const trimmed = name.trim()
  const taken = [userName, ...members.map((m) => m.name)].some((n) => n.toLowerCase() === trimmed.toLowerCase())
  const error = !trimmed ? 'Enter a name.' : taken ? `Someone called ${trimmed} is already here.` : null
  const shownError = submitted || (trimmed && taken) ? error : null

  const submit = () => {
    setSubmitted(true)
    if (error) return
    addMember(trimmed, role)
    onClose()
    toast(`${trimmed} was added`, { description: `They can sign in at http://${hostOf(deviceName)}` })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={
        <DialogIcon color="#f97316">
          <UserPlus size={22} />
        </DialogIcon>
      }
      title="Add a person"
      description="They’ll get their own private space for files and photos, and access to the shared family space."
      onSubmit={submit}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            Add person
          </Button>
        </>
      }
    >
      <label htmlFor="person-name" className="mb-1.5 block text-[13px] font-medium text-white/70">
        Name
      </label>
      <Input
        id="person-name"
        data-autofocus
        value={name}
        maxLength={32}
        autoComplete="off"
        placeholder="e.g. Grandma"
        aria-invalid={Boolean(shownError)}
        onChange={(e) => setName(e.target.value)}
      />
      {shownError && (
        <p role="alert" className="mt-1.5 text-[12.5px] text-red-300">
          {shownError}
        </p>
      )}

      <p id="person-role" className="mt-5 mb-1.5 text-[13px] font-medium text-white/70">
        Role
      </p>
      <div role="radiogroup" aria-labelledby="person-role" className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(ROLES) as Member['role'][]).map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={role === r}
            onClick={() => setRole(r)}
            className={cn(
              'rounded-2xl p-3.5 text-left ring-1 ring-inset transition outline-none focus-visible:ring-2 focus-visible:ring-white/60',
              role === r ? 'bg-accent-soft ring-accent/60' : 'bg-white/[0.05] ring-white/[0.08] hover:bg-white/[0.08]',
            )}
          >
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold">{ROLES[r].label}</span>
              <span className={cn('size-4 rounded-full ring-2 ring-inset transition', role === r ? 'bg-accent ring-accent' : 'ring-white/25')}>
                {role === r && <span className="m-[5px] block size-1.5 rounded-full bg-white" />}
              </span>
            </span>
            <span className="mt-1 block text-[12.5px] leading-snug text-white/55">{ROLES[r].description}</span>
          </button>
        ))}
      </div>
    </Dialog>
  )
}
