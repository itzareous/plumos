import { useMemo } from 'react'
import type { Photo } from '@/lib/photos'
import { useSettings } from '@/stores/settings'
import { useUsers } from '@/stores/users'

export interface Person {
  id: string
  name: string
  color: string
  me: boolean
}

/** Everyone who can add to the family space: the signed-in person first. */
export function usePeople(): Person[] {
  const userName = useSettings((s) => s.userName)
  const members = useUsers((s) => s.members)
  return useMemo(
    () => [
      { id: 'me', name: userName || 'You', color: 'var(--plumos-accent)', me: true },
      ...members.map((m) => ({ id: m.id, name: m.name, color: m.color, me: false })),
    ],
    [userName, members],
  )
}

/** Who put a shared photo in the family space. Demo photos pick someone from their seed. */
export function contributorOf(p: Photo, people: Person[]): Person {
  if (p.addedBy) {
    const found = people.find((x) => x.id === p.addedBy)
    if (found) return found
  }
  return people[(p.seed >>> 3) % people.length]
}
