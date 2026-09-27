import { create } from 'zustand'
import type { ReactNode } from 'react'

export interface Toast {
  id: number
  title: string
  description?: string
  icon?: ReactNode
}

interface ToastState {
  toasts: Toast[]
  dismiss: (id: number) => void
}

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

let nextId = 1

/** Shows a small notification in the top-right corner for a few seconds. */
export function toast(title: string, options: Omit<Toast, 'id' | 'title'> = {}) {
  const id = nextId++
  useToasts.setState((s) => ({ toasts: [...s.toasts.slice(-3), { id, title, ...options }] }))
  setTimeout(() => useToasts.getState().dismiss(id), 4200)
}
