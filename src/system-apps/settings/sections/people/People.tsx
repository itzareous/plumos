import { useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { ShieldCheck, Trash2, UserPlus, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/controls'
import { useContextMenu } from '@/components/ui/ContextMenu'
import { useSettings } from '@/stores/settings'
import { toast } from '@/stores/toasts'
import { useUsers, type Member } from '@/stores/users'
import { ConfirmDialog } from '../../ui/Dialog'
import { Group, Page } from '../../ui/Page'
import { AddPersonDialog } from './AddPersonDialog'
import { PersonRow } from './PersonRow'
import { ROLES } from './roles'
import { SpacesDiagram } from './SpacesDiagram'

export function People() {
  const userName = useSettings((s) => s.userName)
  const members = useUsers((s) => s.members)
  const updateMember = useUsers((s) => s.updateMember)
  const removeMember = useUsers((s) => s.removeMember)
  const [adding, setAdding] = useState(false)
  // Kept after closing so the dialog doesn't lose its text while it animates out.
  const [removing, setRemoving] = useState<Member | null>(null)
  const [confirming, setConfirming] = useState(false)
  const menu = useContextMenu()

  const everyone = useMemo(() => [{ id: 'me', name: userName }, ...members], [userName, members])

  const setRole = (m: Member, role: Member['role']) => {
    updateMember(m.id, { role })
    toast(role === 'admin' ? `${m.name} is now an admin` : `${m.name} is now a member`, { description: ROLES[role].description })
  }

  const actions = (m: Member) => [
    m.role === 'admin'
      ? { label: 'Make member', icon: <UserRound size={15} />, onSelect: () => setRole(m, 'member') }
      : { label: 'Make admin', icon: <ShieldCheck size={15} />, onSelect: () => setRole(m, 'admin') },
    'separator' as const,
    {
      label: `Remove ${m.name}…`,
      icon: <Trash2 size={15} />,
      danger: true,
      onSelect: () => {
        setRemoving(m)
        setConfirming(true)
      },
    },
  ]

  return (
    <Page title="People" description="Plumos is for everyone at home. Each person signs in with their own name and password.">
      <Card className="p-5">
        <SpacesDiagram people={everyone} />
        <p className="mt-4 text-[13.5px] leading-relaxed text-white/60">
          <span className="font-semibold text-white">Everyone gets their own space.</span> Private files and photos stay private —
          not even admins can open them. The <span className="text-white">shared family space</span> is for albums, documents and
          anything the whole home should see.
        </p>
      </Card>

      <Group
        title={`${everyone.length} ${everyone.length === 1 ? 'person' : 'people'}`}
        action={
          <Button size="sm" variant="primary" icon={<UserPlus size={15} />} onClick={() => setAdding(true)}>
            Add person
          </Button>
        }
        footer="Admins can install apps, manage storage and add or remove people. Members use apps, their own space and the shared space."
      >
        <Card>
          <PersonRow name={userName} you badge="Owner" badgeTone="accent" />
          <AnimatePresence initial={false}>
            {members.map((m) => (
              <PersonRow
                key={m.id}
                name={m.name}
                color={m.color}
                badge={ROLES[m.role].label}
                badgeTone={m.role === 'admin' ? 'accent' : 'plain'}
                onMenu={(x, y) => menu.openAt(x, y, actions(m))}
              />
            ))}
          </AnimatePresence>
        </Card>
      </Group>

      {menu.element}
      <AddPersonDialog open={adding} onClose={() => setAdding(false)} />
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        danger
        title={`Remove ${removing?.name ?? ''}?`}
        description={`${removing?.name ?? 'Their'}’s private files and photos will be deleted from this Plumos. Anything they added to the shared family space stays.`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (!removing) return
          removeMember(removing.id)
          toast(`${removing.name} was removed`)
        }}
      />
    </Page>
  )
}
