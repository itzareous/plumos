import type { KeyboardEvent } from 'react'
import { useSettings } from '@/stores/settings'
import { cn } from '@/lib/cn'
import type { SectionId } from '../lib/nav'
import { GROUPS, SECTIONS, type SectionDef } from '../sections'
import { Avatar } from '../ui/Avatar'
import { IconTile } from '../ui/IconTile'
import { SearchField } from './SearchField'
import { useSectionSearch } from './useSectionSearch'

/** Arrow keys move between sections, like a native list. */
function onArrowKeys(e: KeyboardEvent<HTMLElement>, onSelect: (id: SectionId) => void) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[data-section]')]
  const i = items.indexOf(document.activeElement as HTMLButtonElement)
  const next = items[Math.max(0, Math.min(items.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]
  if (!next) return
  e.preventDefault()
  next.focus()
  onSelect(next.dataset.section as SectionId)
}

export function Sidebar({ active, onSelect }: { active: SectionId; onSelect: (id: SectionId) => void }) {
  const userName = useSettings((s) => s.userName)
  const { query, setQuery, results, searching } = useSectionSearch()

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.025] lg:w-[272px]">
      <div className="px-4 pt-6 pb-3">
        <SearchField value={query} onChange={setQuery} />
      </div>
      <nav aria-label="Settings" className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 pb-5" onKeyDown={(e) => onArrowKeys(e, onSelect)}>
        {searching ? (
          results.length ? (
            <ul className="flex flex-col gap-0.5">
              {results.map((s) => (
                <li key={s.id}>
                  <SectionButton section={s} active={active === s.id} onClick={() => onSelect(s.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-6 text-center text-[13px] text-white/40">No settings match “{query.trim()}”</p>
          )
        ) : (
          <>
            <button
              type="button"
              data-section="account"
              aria-current={active === 'account' ? 'page' : undefined}
              onClick={() => onSelect('account')}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                active === 'account' ? 'bg-white/[0.11]' : 'hover:bg-white/[0.05]',
              )}
            >
              <Avatar name={userName} size={40} />
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-semibold">{userName}</span>
                <span className="block truncate text-[12px] text-white/50">Account & security</span>
              </span>
            </button>
            {GROUPS.map((group, i) => (
              <ul key={i} className="mt-4 flex flex-col gap-0.5">
                {group.map((id) => (
                  <li key={id}>
                    <SectionButton section={SECTIONS[id]} active={active === id} onClick={() => onSelect(id)} />
                  </li>
                ))}
              </ul>
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}

function SectionButton({ section, active, onClick }: { section: SectionDef; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      data-section={section.id}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2 text-left text-[13.5px] font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        active ? 'bg-white/[0.11] text-white' : 'text-white/80 hover:bg-white/[0.05] hover:text-white',
      )}
    >
      <IconTile icon={section.icon} color={section.color} size={24} />
      <span className="truncate">{section.title}</span>
    </button>
  )
}
