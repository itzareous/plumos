import { createContext, useContext } from 'react'
import type { AppCategory } from '@/apps/types'

export type Route =
  | { view: 'home' }
  | { view: 'category'; category: AppCategory }
  | { view: 'collection'; id: string }
  | { view: 'app'; appId: string }

export interface Nav {
  /** Pushes a page. */
  go: (route: Route) => void
  back: () => void
  /** Clears the stack and returns to the front page. */
  home: () => void
}

export function routeKey(r: Route) {
  if (r.view === 'app') return `app:${r.appId}`
  if (r.view === 'category') return `cat:${r.category}`
  if (r.view === 'collection') return `col:${r.id}`
  return 'home'
}

export const NavContext = createContext<Nav>({ go: () => {}, back: () => {}, home: () => {} })

export const useNav = () => useContext(NavContext)
