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

/** Sign-in security for the owner's account (a mock: nothing leaves the browser). */
export interface OwnerSecurity {
  twoFactor: boolean
  /** When the password was last changed, ms since epoch. */
  passwordChangedAt: number
}

interface UsersState {
  members: Member[]
  owner: OwnerSecurity
  addMember: (name: string, role?: Member['role']) => Member
  updateMember: (id: string, patch: Partial<Omit<Member, 'id'>>) => void
  removeMember: (id: string) => void
  setOwner: (patch: Partial<OwnerSecurity>) => void
}

export const MEMBER_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6']

/** A colour no one else is using yet, so avatars stay easy to tell apart. */
function nextColor(members: Member[]) {
  const used = new Set(members.map((m) => m.color))
  return MEMBER_COLORS.find((c) => !used.has(c)) ?? MEMBER_COLORS[members.length % MEMBER_COLORS.length]
}

export const useUsers = create<UsersState>()(
  persist(
    (set, get) => ({
      members: [
        { id: 'ava', name: 'Ava', color: '#ec4899', role: 'admin', createdAt: Date.now() - 86400e3 * 120 },
        { id: 'leo', name: 'Leo', color: '#10b981', role: 'member', createdAt: Date.now() - 86400e3 * 40 },
      ],
      owner: { twoFactor: false, passwordChangedAt: Date.now() - 86400e3 * 97 },
      addMember: (name, role = 'member') => {
        const member: Member = {
          id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
          name,
          color: nextColor(get().members),
          role,
          createdAt: Date.now(),
        }
        set((s) => ({ members: [...s.members, member] }))
        return member
      },
      updateMember: (id, patch) => set((s) => ({ members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      removeMember: (id) => set((s) => ({ members: s.members.filter((m) => m.id !== id) })),
      setOwner: (patch) => set((s) => ({ owner: { ...s.owner, ...patch } })),
    }),
    { name: 'plumos:users', version: 1 },
  ),
)
