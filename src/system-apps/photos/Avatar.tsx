import { cn } from '@/lib/cn'
import type { Person } from './people'

export function Avatar({ person, size = 20, className, ring = false }: { person: Person; size?: number; className?: string; ring?: boolean }) {
  return (
    <span
      title={person.me ? `${person.name} (you)` : person.name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none',
        ring && 'ring-2 ring-[rgb(22_22_30)]',
        className,
      )}
      style={{ width: size, height: size, background: person.color, fontSize: Math.max(9, size * 0.46) }}
    >
      {person.name.slice(0, 1).toUpperCase()}
    </span>
  )
}
