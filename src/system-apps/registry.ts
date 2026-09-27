import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { SheetId } from '@/stores/windows'

export interface SheetProps {
  params: Record<string, string>
}

export interface SheetEntry {
  name: string
  /** Artwork id from components/icons/art.tsx, used by the dock and search. */
  art: string
  /** Shown in the dock, in this order. */
  dock: boolean
  component: LazyExoticComponent<ComponentType<SheetProps>>
}

/** Built-in apps. Each lives in its own folder and is loaded on first open. */
export const sheetRegistry: Record<SheetId, SheetEntry> = {
  files: { name: 'Files', art: 'files', dock: true, component: lazy(() => import('./files')) },
  photos: { name: 'Photos', art: 'photos', dock: true, component: lazy(() => import('./photos')) },
  'app-store': { name: 'App Store', art: 'app-store', dock: true, component: lazy(() => import('./app-store')) },
  terminal: { name: 'Terminal', art: 'terminal', dock: true, component: lazy(() => import('./terminal')) },
  settings: { name: 'Settings', art: 'settings', dock: true, component: lazy(() => import('./settings')) },
  'live-usage': { name: 'Live Usage', art: 'live-usage', dock: true, component: lazy(() => import('./live-usage')) },
  vm: { name: 'Virtual Machine', art: 'windows', dock: false, component: lazy(() => import('./vm')) },
  'app-details': { name: 'App', art: 'app-store', dock: false, component: lazy(() => import('./app-details')) },
}
