import { createContext } from 'react'

/** The scrolling element tiles live in, so thumbnails can start painting just before they scroll into view. */
export const ScrollRootContext = createContext<Element | null>(null)
