import { createContext, useContext } from 'react'

/** How much the guest screen is scaled on the page; pointer deltas are divided by it. */
export const ScaleContext = createContext(1)
export const useScale = () => useContext(ScaleContext)
