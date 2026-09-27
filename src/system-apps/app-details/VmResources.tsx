import { Cpu, HardDrive, MemoryStick, Monitor } from 'lucide-react'
import type { AppInfo } from '@/apps/types'
import { Card, Row, SectionTitle } from '@/components/ui/controls'

const osNames = { windows: 'Windows', linux: 'Linux', android: 'Android' } as const

/** CPU, memory and disk allotted to a virtual machine. */
export function VmResources({ app }: { app: AppInfo }) {
  const vm = app.vm
  if (!vm) return null
  const value = (v: string) => <span className="text-sm font-medium text-white/80 tabular-nums">{v}</span>
  return (
    <section>
      <SectionTitle>Resources</SectionTitle>
      <Card>
        <Row icon={<Cpu size={16} />} title="Processor" description="Virtual CPU cores">
          {value(`${vm.cpus} cores`)}
        </Row>
        <Row icon={<MemoryStick size={16} />} title="Memory" description="Reserved while the machine runs">
          {value(`${vm.memoryGb} GB`)}
        </Row>
        <Row icon={<HardDrive size={16} />} title="Disk" description="Space for the system and your files">
          {value(`${vm.diskGb} GB`)}
        </Row>
        <Row icon={<Monitor size={16} />} title="Operating system">
          {value(`${osNames[vm.os]} ${app.version}`)}
        </Row>
      </Card>
    </section>
  )
}
