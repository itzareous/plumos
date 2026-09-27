import { Glass } from '@/components/ui/Glass'
import { useWindows } from '@/stores/windows'

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function SearchButton() {
  const setPaletteOpen = useWindows((s) => s.setPaletteOpen)
  return (
    <Glass
      as="button"
      radius={999}
      refraction={24}
      depth={0.3}
      onClick={() => setPaletteOpen(true)}
      className="flex h-8 items-center gap-1.5 px-3.5 text-[13px] font-semibold text-white/90 transition hover:scale-[1.04] active:scale-95"
      aria-label="Search"
    >
      Search
      <span className="text-white/45">{isMac ? '⌘K' : 'Ctrl K'}</span>
    </Glass>
  )
}
