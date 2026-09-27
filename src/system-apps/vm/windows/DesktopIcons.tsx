import { useState } from 'react'
import { cn } from '@/lib/cn'
import { AppGlyph, type GuestApp } from '../apps/glyphs'
import { FsIcon } from '../apps/Files'
import { nodeAt } from '../apps/fsData'

type Icon = { id: string; label: string; app?: GuestApp; file?: string }

const ICONS: Icon[] = [
  { id: 'files', label: 'Files', app: 'files' },
  { id: 'browser', label: 'Browser', app: 'browser' },
  { id: 'notes', label: 'Notes', app: 'notes' },
  { id: 'welcome', label: 'Welcome.txt', file: 'Desktop/Welcome.txt' },
  { id: 'bin', label: 'Bin', app: 'bin' },
]

/** Desktop shortcuts: click to select, double-click (or Enter) to open. */
export function DesktopIcons({ onOpenApp, onOpenFile }: { onOpenApp: (app: GuestApp) => void; onOpenFile: (path: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const open = (icon: Icon) => {
    if (icon.file) onOpenFile(icon.file)
    else if (icon.app === 'bin') onOpenApp('files')
    else if (icon.app) onOpenApp(icon.app)
  }
  return (
    <div className="absolute top-3 left-2 flex flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
      {ICONS.map((icon) => (
        <button
          key={icon.id}
          type="button"
          data-agent={`desk.${icon.id}`}
          onClick={() => setSelected(icon.id)}
          onDoubleClick={() => open(icon)}
          onKeyDown={(e) => e.key === 'Enter' && open(icon)}
          onBlur={() => setSelected((s) => (s === icon.id ? null : s))}
          className={cn(
            'flex w-[78px] flex-col items-center gap-1.5 rounded-md border px-1 pt-2 pb-1.5 text-center outline-none',
            selected === icon.id ? 'border-white/25 bg-white/15' : 'border-transparent hover:bg-white/[0.08]',
          )}
        >
          {icon.file ? <FsIcon node={nodeAt(icon.file)!} size={40} /> : <AppGlyph app={icon.app!} size={38} />}
          <span className="text-[11.5px] leading-tight text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.8)]">{icon.label}</span>
        </button>
      ))}
    </div>
  )
}
