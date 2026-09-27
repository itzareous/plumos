import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_INSTALLED, findApp } from '@/apps/catalog'
import type { AppInfo } from '@/apps/types'

type InstallState = { progress: number; phase: 'downloading' | 'installing' | 'starting' }

interface AppsState {
  /** Installed app ids, in home screen order. */
  installed: string[]
  /** User-edited links, keyed by app id. */
  links: Record<string, string>
  /** Apps currently being installed (not persisted). */
  installing: Record<string, InstallState>
  install: (id: string) => void
  uninstall: (id: string) => void
  move: (id: string, toIndex: number) => void
  setLink: (id: string, url: string | null) => void
}

export const useApps = create<AppsState>()(
  persist(
    (set, get) => ({
      installed: DEFAULT_INSTALLED,
      links: {},
      installing: {},

      install: (id) => {
        if (get().installed.includes(id) || get().installing[id]) return
        // Simulated install; a real backend would stream progress here.
        let progress = 0
        const tick = () => {
          progress = Math.min(1, progress + 0.04 + Math.random() * 0.08)
          const phase = progress < 0.7 ? 'downloading' : progress < 0.95 ? 'installing' : 'starting'
          if (progress >= 1) {
            set((s) => {
              const { [id]: _, ...rest } = s.installing
              return { installing: rest, installed: [...s.installed.filter((x) => x !== id), id] }
            })
            return
          }
          set((s) => ({ installing: { ...s.installing, [id]: { progress, phase } } }))
          setTimeout(tick, 180 + Math.random() * 220)
        }
        set((s) => ({ installing: { ...s.installing, [id]: { progress: 0, phase: 'downloading' } } }))
        setTimeout(tick, 200)
      },

      uninstall: (id) => set((s) => ({ installed: s.installed.filter((x) => x !== id) })),

      move: (id, toIndex) =>
        set((s) => {
          const list = s.installed.filter((x) => x !== id)
          list.splice(Math.max(0, Math.min(toIndex, list.length)), 0, id)
          return { installed: list }
        }),

      setLink: (id, url) =>
        set((s) => {
          const links = { ...s.links }
          if (url) links[id] = url
          else delete links[id]
          return { links }
        }),
    }),
    {
      name: 'plumos:apps',
      version: 1,
      partialize: (s) => ({ installed: s.installed, links: s.links }),
    },
  ),
)

/** The URL an app opens at: the user's custom link, or host + default port. */
export function appUrl(app: AppInfo, links: Record<string, string>): string | null {
  if (links[app.id]) return links[app.id]
  if (!app.port) return null
  const { protocol, hostname } = window.location
  return `${protocol}//${hostname}:${app.port}${app.path ?? ''}`
}

export const useInstalledApps = () =>
  useApps((s) => s.installed).map(findApp).filter((a): a is AppInfo => Boolean(a))
