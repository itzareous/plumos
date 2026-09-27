import { create } from 'zustand'

/**
 * Plumos opens its built-in apps as "sheets": one large panel that slides up
 * over the home screen. Only one sheet is open at a time.
 */
export type SheetId =
  | 'files'
  | 'photos'
  | 'app-store'
  | 'settings'
  | 'live-usage'
  | 'terminal'
  | 'vm'
  | 'app-details'

export interface OpenSheet {
  id: SheetId
  /** Free-form parameters, e.g. `{ appId: 'windows' }` for the VM viewer. */
  params?: Record<string, string>
}

interface WindowsState {
  sheet: OpenSheet | null
  paletteOpen: boolean
  open: (id: SheetId, params?: Record<string, string>) => void
  close: () => void
  setPaletteOpen: (open: boolean) => void
}

export const useWindows = create<WindowsState>((set) => ({
  sheet: null,
  paletteOpen: false,
  open: (id, params) => set({ sheet: { id, params }, paletteOpen: false }),
  close: () => set({ sheet: null }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}))
