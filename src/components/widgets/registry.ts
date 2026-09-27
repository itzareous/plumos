import type { ComponentType } from 'react'
import type { WidgetId } from '@/stores/settings'
import { StorageWidget } from './StorageWidget'
import { FilesWidget } from './FilesWidget'
import { SystemWidget } from './SystemWidget'
import { ClockWidget } from './ClockWidget'
import { MemoryWidget } from './MemoryWidget'
import { PhotosWidget } from './PhotosWidget'

export const MAX_WIDGETS = 3

export const widgetRegistry: Record<WidgetId, { name: string; description: string; component: ComponentType }> = {
  storage: { name: 'Storage', description: 'Used and available space', component: StorageWidget },
  files: { name: 'Files', description: 'Jump into your favourite folders', component: FilesWidget },
  system: { name: 'System', description: 'CPU, memory and storage at a glance', component: SystemWidget },
  memory: { name: 'Memory', description: 'Memory in use', component: MemoryWidget },
  photos: { name: 'Photos', description: 'Your latest photos', component: PhotosWidget },
  clock: { name: 'Clock', description: 'Date and time', component: ClockWidget },
}
