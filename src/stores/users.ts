import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * People who share this Plumos. The owner is the person signed in; their
 * display name lives in `useSettings().userName`. Everyone gets a private
 * space for files and photos, plus the shared family space.
 */
export interface Member {
  id: string
  name: string
  /** Avatar background colour. */
  color: string
  role: 'admin' | 'member'
  createdAt: number
}

interface UsersState {
  members: Member[]
  addMember: (name: string, role?: Member['role']) => Member
  updateMember: (id: string, patch: Partial<Omit<Member, 'id'>>) => void
  removeMember: (id: string) => void
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6']

export const useUsers = create<UsersState>()(
  persist(
    (set, get) => ({
      members: [
        { id: 'ava', name: 'Ava', color: '#ec4899', role: 'admin', createdAt: Date.now() - 86400e3 * 120 },
        { id: 'leo', name: 'Leo', color: '#10b981', role: 'member', createdAt: Date.now() - 86400e3 * 40 },
      ],
      addMember: (name, role = 'member') => {
        const member: Member = {
          id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
          name,
          color: COLORS[get().members.length % COLORS.length],
          role,
          createdAt: Date.now(),
        }
        set((s) => ({ members: [...s.members, member] }))
        return member
      },
      updateMember: (id, patch) => set((s) => ({ members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      removeMember: (id) => set((s) => ({ members: s.members.filter((m) => m.id !== id) })),
    }),
    { name: 'plumos:users', version: 1 },
  ),
)
