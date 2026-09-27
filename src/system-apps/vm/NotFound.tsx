import { MonitorX } from 'lucide-react'
import { catalog } from '@/apps/catalog'
import { AppIcon } from '@/components/icons/AppIcon'
import { Button } from '@/components/ui/Button'
import { Card, Row } from '@/components/ui/controls'
import { SheetPage } from '@/components/ui/Sheet'
import { useWindows } from '@/stores/windows'

/** Shown when the viewer is opened without a valid VM app id. */
export function NotFound({ appId }: { appId?: string }) {
  const open = useWindows((s) => s.open)
  const vms = catalog.filter((a) => a.kind === 'vm' && a.vm)
  return (
    <SheetPage title="Virtual Machines" subtitle="Run other operating systems on your home server.">
      <div className="mx-auto flex max-w-[560px] flex-col items-center pt-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-white/[0.07] text-white/60 ring-1 ring-white/10">
          <MonitorX size={28} />
        </span>
        <h2 className="mt-4 text-[19px] font-semibold">
          {appId ? `There's no virtual machine called “${appId}”` : 'Pick a virtual machine to open'}
        </h2>
        <p className="mt-1.5 text-[14px] text-white/55">
          It may have been removed. Open one of these instead, or find more in the App Store.
        </p>
        <Card className="mt-6 w-full text-left">
          {vms.map((vm) => (
            <Row
              key={vm.id}
              icon={<AppIcon icon={vm.icon} size={32} />}
              title={vm.name}
              description={`${vm.vm!.cpus} vCPU · ${vm.vm!.memoryGb} GB memory · ${vm.vm!.diskGb} GB disk`}
              onClick={() => open('vm', { appId: vm.id })}
              className="[&>span:first-child]:bg-transparent"
            >
              <span className="text-[13px] font-medium text-accent">Open</span>
            </Row>
          ))}
        </Card>
        <Button className="mt-5" onClick={() => open('app-store')}>
          Browse the App Store
        </Button>
      </div>
    </SheetPage>
  )
}
