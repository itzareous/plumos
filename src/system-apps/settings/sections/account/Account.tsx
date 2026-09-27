import { useState } from 'react'
import { ChevronRight, KeyRound, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge, Card, Row, Switch } from '@/components/ui/controls'
import { formatRelativeDate } from '@/lib/format'
import { useSettings } from '@/stores/settings'
import { toast } from '@/stores/toasts'
import { useUsers } from '@/stores/users'
import { hostOf } from '../../lib/hostname'
import { useGoTo } from '../../lib/nav'
import { Avatar } from '../../ui/Avatar'
import { ConfirmDialog } from '../../ui/Dialog'
import { Group, Page } from '../../ui/Page'
import { DeviceNameField } from './DeviceNameField'
import { NameField } from './NameField'
import { PasswordDialog } from './PasswordDialog'
import { TwoFactorDialog } from './TwoFactorDialog'

export function Account() {
  const userName = useSettings((s) => s.userName)
  const deviceName = useSettings((s) => s.deviceName)
  const owner = useUsers((s) => s.owner)
  const setOwner = useUsers((s) => s.setOwner)
  const memberCount = useUsers((s) => s.members.length)
  const goTo = useGoTo()
  const [dialog, setDialog] = useState<'password' | 'two-factor' | 'two-factor-off' | null>(null)
  const close = () => setDialog(null)

  return (
    <Page title="Account">
      <Card className="flex items-center gap-4 p-5">
        <Avatar name={userName} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold tracking-tight">{userName}</h2>
            <Badge className="bg-accent-soft text-accent">Owner</Badge>
          </div>
          <p className="mt-0.5 truncate text-[13px] text-white/50">Signed in on {hostOf(deviceName)}</p>
        </div>
      </Card>

      <Group title="Profile">
        <Card>
          <NameField />
          <DeviceNameField />
        </Card>
      </Group>

      <Group title="Sign-in & security" footer="Two-factor sign-in asks for a code from your phone as well as your password.">
        <Card>
          <Row
            icon={<KeyRound size={16} />}
            title="Password"
            description={`Last changed ${formatRelativeDate(owner.passwordChangedAt).replace(/^Just now$/, 'just now')}`}
          >
            <Button size="sm" onClick={() => setDialog('password')}>
              Change…
            </Button>
          </Row>
          <Row
            icon={<ShieldCheck size={16} />}
            title="Two-factor sign-in"
            description={owner.twoFactor ? 'On — codes from your authenticator app' : 'Off'}
          >
            <Switch
              checked={owner.twoFactor}
              label="Two-factor sign-in"
              onChange={(on) => setDialog(on ? 'two-factor' : 'two-factor-off')}
            />
          </Row>
        </Card>
      </Group>

      <Group>
        <Card>
          <Row
            icon={<Users size={16} />}
            title="People in your home"
            description={`${memberCount + 1} ${memberCount ? 'people' : 'person'} with their own space`}
            onClick={() => goTo('people')}
          >
            <ChevronRight size={17} className="text-white/35" />
          </Row>
        </Card>
      </Group>

      <PasswordDialog open={dialog === 'password'} onClose={close} />
      <TwoFactorDialog open={dialog === 'two-factor'} onClose={close} />
      <ConfirmDialog
        open={dialog === 'two-factor-off'}
        onClose={close}
        danger
        title="Turn off two-factor sign-in?"
        description="Anyone who knows your password will be able to sign in as you."
        confirmLabel="Turn off"
        onConfirm={() => {
          setOwner({ twoFactor: false })
          toast('Two-factor sign-in is off')
        }}
      />
    </Page>
  )
}
