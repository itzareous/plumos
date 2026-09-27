import type { Member } from '@/stores/users'

export const ROLES: Record<Member['role'], { label: string; description: string }> = {
  member: { label: 'Member', description: 'Uses apps, their own space and the shared space.' },
  admin: { label: 'Admin', description: 'Also installs apps, manages storage and adds people.' },
}
