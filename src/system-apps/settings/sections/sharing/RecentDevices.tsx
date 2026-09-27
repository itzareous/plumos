import { useMemo } from 'react'
import { Laptop, Monitor, Smartphone, Tv, type LucideIcon } from 'lucide-react'
import { Card, Row } from '@/components/ui/controls'
import { useSettings } from '@/stores/settings'
import { useUsers } from '@/stores/users'
import { Status } from '../../ui/Page'

interface Device {
  id: string
  name: string
  icon: LucideIcon
  via: string
  when: string
  active: boolean
}

/** Demo list of devices that used Plumos lately, named after the people at home. */
export function RecentDevices() {
  const userName = useSettings((s) => s.userName)
  const members = useUsers((s) => s.members)
  const devices = useMemo<Device[]>(() => {
    const [a, b] = members
    return [
      { id: 'laptop', name: `${userName}’s laptop`, icon: Laptop, via: 'Network drive', when: 'Connected now', active: true },
      { id: 'phone', name: `${a?.name ?? 'Family'}’s phone`, icon: Smartphone, via: 'Photo backup', when: '12 min ago', active: false },
      { id: 'tv', name: 'Living room TV', icon: Tv, via: 'Media streaming', when: '2 hr ago', active: false },
      { id: 'desktop', name: `${b?.name ?? 'Office'}’s desktop`, icon: Monitor, via: 'Browser', when: 'Yesterday', active: false },
    ]
  }, [userName, members])

  return (
    <Card>
      {devices.map((d) => (
        <Row key={d.id} icon={<d.icon size={16} />} title={d.name} description={`via ${d.via}`}>
          <Status tone={d.active ? 'ok' : 'off'} className="shrink-0 text-[12px] text-white/50">
            {d.when}
          </Status>
        </Row>
      ))}
    </Card>
  )
}
