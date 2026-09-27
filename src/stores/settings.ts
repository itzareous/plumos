import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_WALLPAPER } from '@/lib/wallpapers'

export type WidgetId = 'storage' | 'files' | 'system' | 'photos' | 'clock' | 'memory'

interface SettingsState {
  userName: string
  deviceName: string
  wallpaper: string
  /** Data URL of a user-uploaded wallpaper, used when `wallpaper === 'custom'`. */
  customWallpaper: string | null
  temperatureUnit: 'c' | 'f'
  widgets: WidgetId[]
  reduceTransparency: boolean
  /** Set once the first-run onboarding has been completed. */
  onboarded: boolean
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      userName: 'Milo',
      deviceName: 'plumos',
      wallpaper: DEFAULT_WALLPAPER,
      customWallpaper: null,
      temperatureUnit: 'c',
      widgets: ['storage', 'files', 'system'],
      reduceTransparency: false,
      onboarded: true,
      set: (patch) => set(patch),
    }),
    { name: 'plumos:settings', version: 1 },
  ),
)
