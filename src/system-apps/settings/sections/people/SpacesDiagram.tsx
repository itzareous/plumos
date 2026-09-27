import { House, Lock } from 'lucide-react'
import { Avatar } from '../../ui/Avatar'

export interface DiagramPerson {
  id: string
  name: string
  color?: string
}

/** Each person above their private space, all joined to the shared family space below. */
export function SpacesDiagram({ people }: { people: DiagramPerson[] }) {
  const shown = people.slice(0, 4)
  const extra = people.length - shown.length
  return (
    <div aria-hidden className="select-none">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${shown.length + (extra > 0 ? 1 : 0)}, minmax(0, 1fr))` }}>
        {shown.map((p) => (
          <div key={p.id} className="flex flex-col items-center">
            <Avatar name={p.name} color={p.color} size={34} />
            <div className="mt-2 flex w-full max-w-[112px] items-center justify-center gap-1 rounded-lg bg-white/[0.07] px-2 py-1.5 text-[11px] font-medium text-white/70 ring-1 ring-inset ring-white/[0.08]">
              <Lock size={10} className="shrink-0 text-white/45" />
              <span className="truncate">{p.name}</span>
            </div>
            <span className="h-3 w-px bg-gradient-to-b from-white/25 to-accent/70" />
          </div>
        ))}
        {extra > 0 && (
          <div className="flex flex-col items-center">
            <span className="flex size-[34px] items-center justify-center rounded-full bg-white/10 text-[12px] font-semibold text-white/70">
              +{extra}
            </span>
            <div className="mt-2 w-full max-w-[112px] rounded-lg bg-white/[0.07] px-2 py-1.5 text-center text-[11px] font-medium text-white/50 ring-1 ring-inset ring-white/[0.08]">
              more
            </div>
            <span className="h-3 w-px bg-gradient-to-b from-white/25 to-accent/70" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-1.5 rounded-xl bg-accent-soft py-2 text-[12px] font-semibold text-accent ring-1 ring-inset ring-accent/30">
        <House size={13} />
        Shared family space
      </div>
    </div>
  )
}
