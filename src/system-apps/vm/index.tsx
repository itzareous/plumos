import { findApp } from '@/apps/catalog'
import type { SheetProps } from '../registry'
import { NotFound } from './NotFound'
import { VmViewer } from './VmViewer'

/** Virtual machine viewer. Opened with `{ appId }` of a catalog app whose `kind` is `vm`. */
export default function VirtualMachine({ params }: SheetProps) {
  const app = params.appId ? findApp(params.appId) : undefined
  if (!app || app.kind !== 'vm' || !app.vm) return <NotFound appId={params.appId} />
  return <VmViewer key={app.id} app={app} spec={app.vm} />
}
