import type { RefObject } from 'react'
import type { AppInfo } from '@/apps/types'

export type VmSpec = NonNullable<AppInfo['vm']>
export type VmOs = VmSpec['os']

/** Power state of the guest. `starting` and `stopping` play the boot/shutdown screens. */
export type Power = 'off' | 'starting' | 'running' | 'stopping'

/**
 * The guest's logical screen size. Everything inside the VM is laid out at
 * this size and scaled to fit the viewer, like a real remote display.
 */
export const SCREEN: Record<VmOs, { w: number; h: number }> = {
  windows: { w: 1152, h: 720 },
  linux: { w: 1152, h: 720 },
  android: { w: 360, h: 780 },
}

/** How long each guest takes to boot, in ms. */
export const BOOT_MS: Record<VmOs, number> = { windows: 4200, android: 3600, linux: 4000 }

/** What a guest desktop exposes to the viewer (and the agent). */
export interface DeskBridge {
  /** Closes every window/app and returns to a clean desktop. */
  reset: () => void
}

export interface DesktopProps {
  app: AppInfo
  spec: VmSpec
  /** Bumped each time Ctrl+Alt+Del is sent. */
  cad: number
  bridge: RefObject<DeskBridge | null>
  onShutdown: () => void
}

export const osLabel: Record<VmOs, string> = { windows: 'Windows', android: 'Android', linux: 'Linux' }
