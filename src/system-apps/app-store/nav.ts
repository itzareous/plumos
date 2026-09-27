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

export const routeKey = (r: Route) =>
  r.view === 'app' ? `app:${r.appId}` : r.view === 'category' ? `cat:${r.category}` : r.view === 'collection' ? `col:${r.id}` : 'home'

export const NavContext = createContext<Nav>({ go: () => {}, back: () => {}, home: () => {} })

export const useNav = () => useContext(NavContext)
