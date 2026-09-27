import { createContext, useContext } from 'react'

export type SectionId = 'account' | 'people' | 'appearance' | 'widgets' | 'storage' | 'sharing' | 'updates' | 'about' | 'power'

export const SECTION_IDS: SectionId[] = ['account', 'people', 'appearance', 'widgets', 'storage', 'sharing', 'updates', 'about', 'power']

export const isSectionId = (value: string | undefined): value is SectionId => SECTION_IDS.includes(value as SectionId)

/** Lets a section link to another one ("Manage people…"). */
export const NavContext = createContext<(id: SectionId) => void>(() => {})

export const useGoTo = () => useContext(NavContext)
