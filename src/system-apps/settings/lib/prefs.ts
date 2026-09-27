import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Server preferences that only Settings shows: sharing, remote access and
 * updates. Mocked in the browser; a real backend would own these.
 */
interface PrefsState {
  /** SMB file sharing, so computers on the network can mount Plumos. */
  fileSharing: boolean
  remoteAccess: boolean
  autoUpdate: boolean
  /** When updates were last checked, ms since epoch. */
  lastUpdateCheck: number
  set: (patch: Partial<Omit<PrefsState, 'set'>>) => void
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      fileSharing: true,
      remoteAccess: false,
      autoUpdate: true,
      lastUpdateCheck: Date.now() - 3600e3 * 7,
      set: (patch) => set(patch),
    }),
    { name: 'plumos:server-prefs', version: 1 },
  ),
)
