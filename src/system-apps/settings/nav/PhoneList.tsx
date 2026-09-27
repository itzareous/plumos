import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/controls'
import { useSettings } from '@/stores/settings'
import type { SectionId } from '../lib/nav'
import { GROUPS, SECTIONS, type SectionDef } from '../sections'
import { Avatar } from '../ui/Avatar'
import { IconTile } from '../ui/IconTile'
import { SearchField } from './SearchField'
import { useSectionSearch } from './useSectionSearch'

/** The phone layout's first screen: every section as a grouped list. */
export function PhoneList({ onSelect }: { onSelect: (id: SectionId) => void }) {
  const userName = useSettings((s) => s.userName)
  const { query, setQuery, results, searching } = useSectionSearch()

  return (
    <div className="scrollbar-none h-full overflow-y-auto px-4 pt-6 pb-[max(env(safe-area-inset-bottom),40px)]">
      <h1 className="pr-14 text-[30px] leading-tight font-bold tracking-tight">Settings</h1>
      <div className="mt-4">
        <SearchField value={query} onChange={setQuery} />
      </div>

      {searching ? (
        results.length ? (
          <Card className="mt-5">
            {results.map((s) => (
              <ListRow key={s.id} section={s} onClick={() => onSelect(s.id)} />
            ))}
          </Card>
        ) : (
          <p className="py-10 text-center text-[14px] text-white/40">No settings match “{query.trim()}”</p>
        )
      ) : (
        <>
          <Card className="mt-5">
            <button
              type="button"
              onClick={() => onSelect('account')}
              className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition outline-none hover:bg-white/[0.05] focus-visible:bg-white/[0.08]"
            >
              <Avatar name={userName} size={52} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-semibold">{userName}</span>
                <span className="block truncate text-[13px] text-white/50">Account, security & device name</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-white/30" />
            </button>
          </Card>
          {GROUPS.map((group, i) => (
            <Card key={i} className="mt-5">
              {group.map((id) => (
                <ListRow key={id} section={SECTIONS[id]} onClick={() => onSelect(id)} />
              ))}
            </Card>
          ))}
        </>
      )}
    </div>
  )
}

function ListRow({ section, onClick }: { section: SectionDef; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-12 w-full items-center gap-3 px-4 text-left transition outline-none hover:bg-white/[0.05] focus-visible:bg-white/[0.08] [&+&]:before:absolute [&+&]:before:top-0 [&+&]:before:right-0 [&+&]:before:left-[58px] [&+&]:before:h-px [&+&]:before:bg-white/[0.07]"
    >
      <IconTile icon={section.icon} color={section.color} size={29} />
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{section.title}</span>
      <ChevronRight size={18} className="shrink-0 text-white/30" />
    </button>
  )
}
