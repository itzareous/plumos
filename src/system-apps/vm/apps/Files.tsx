import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowUp, ChevronRight, Download, FileText, House, Image, Monitor, Music2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import { isText, nodeAt, type FsNode } from './fsData'

const PLACES = [
  { name: 'Home', path: '', icon: House },
  { name: 'Desktop', path: 'Desktop', icon: Monitor },
  { name: 'Documents', path: 'Documents', icon: FileText },
  { name: 'Downloads', path: 'Downloads', icon: Download },
  { name: 'Pictures', path: 'Pictures', icon: Image },
  { name: 'Music', path: 'Music', icon: Music2 },
]

/** A small file manager over the guest's demo home folder. */
export function Files({ variant, onOpenFile }: { variant: 'win' | 'gnome'; onOpenFile: (path: string) => void }) {
  const [path, setPath] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const node = nodeAt(path)
  const items = useMemo(
    () => [...(node?.children ?? [])].sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1)),
    [node],
  )

  const go = (next: string) => {
    if (next === path) return
    setHistory((h) => [...h, path])
    setPath(next)
    setSelected(null)
    setNote(null)
  }
  const open = (item: FsNode) => {
    const p = path ? `${path}/${item.name}` : item.name
    if (item.type === 'dir') go(p)
    else if (isText(item.name)) onOpenFile(p)
    else setNote(`There's no app for “${item.name}” in this demo.`)
  }
  const crumbs = ['Home', ...path.split('/').filter(Boolean)]

  return (
    <div className={cn('flex h-full text-white/90', variant === 'gnome' ? 'bg-[#242429]' : 'bg-[#1b1c21]')}>
      <nav className={cn('w-[168px] shrink-0 space-y-0.5 p-2', variant === 'gnome' ? 'bg-[#2a2a30]' : 'bg-[#202127]')}>
        {PLACES.map((p) => (
          <button
            key={p.name}
            type="button"
            data-agent={`files.nav.${p.name.toLowerCase()}`}
            onClick={() => go(p.path)}
            className={cn(
              'flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[12.5px] transition outline-none focus-visible:ring-2 focus-visible:ring-white/40',
              path === p.path ? 'bg-white/[0.12] text-white' : 'text-white/70 hover:bg-white/[0.06]',
            )}
          >
            <p.icon size={14} className={path === p.path ? 'text-sky-300' : 'text-white/55'} />
            {p.name}
          </button>
        ))}
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center gap-1 border-b border-white/[0.06] px-2">
          <button
            type="button"
            aria-label="Back"
            disabled={!history.length}
            onClick={() => {
              setPath(history[history.length - 1] ?? '')
              setHistory((h) => h.slice(0, -1))
              setSelected(null)
            }}
            className="flex size-7 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 disabled:opacity-30"
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Up"
            disabled={!path}
            onClick={() => go(path.split('/').slice(0, -1).join('/'))}
            className="flex size-7 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 disabled:opacity-30"
          >
            <ArrowUp size={15} />
          </button>
          <div className="ml-1 flex h-7 min-w-0 flex-1 items-center gap-1 rounded-md bg-black/25 px-2.5 text-[12px] text-white/70">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1 truncate">
                {i > 0 && <ChevronRight size={12} className="text-white/30" />}
                <button
                  type="button"
                  onClick={() => go(crumbs.slice(1, i + 1).join('/'))}
                  className={cn('truncate hover:text-white', i === crumbs.length - 1 && 'text-white')}
                >
                  {c}
                </button>
              </span>
            ))}
          </div>
        </div>
        <div
          className="scrollbar-thin grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1 overflow-y-auto p-3"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          {items.map((item) => (
            <button
              key={item.name}
              type="button"
              data-agent={`files.item.${item.name}`}
              onClick={() => setSelected(item.name)}
              onDoubleClick={() => open(item)}
              onKeyDown={(e) => e.key === 'Enter' && open(item)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg px-1.5 pt-2.5 pb-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60',
                selected === item.name ? 'bg-sky-400/20 ring-1 ring-sky-300/40' : 'hover:bg-white/[0.06]',
              )}
            >
              <FsIcon node={item} />
              <span className="line-clamp-2 text-[11.5px] leading-tight break-words text-white/85">{item.name}</span>
            </button>
          ))}
          {!items.length && <p className="col-span-full py-16 text-center text-[13px] text-white/40">This folder is empty</p>}
        </div>
        <div className="flex h-7 shrink-0 items-center border-t border-white/[0.06] px-3 text-[11px] text-white/45 tabular-nums">
          {note ?? (selected ? selectedLabel(items.find((i) => i.name === selected)) : `${items.length} items`)}
        </div>
      </div>
    </div>
  )
}

function selectedLabel(item?: FsNode) {
  if (!item) return ''
  if (item.type === 'dir') return `“${item.name}” · ${item.children?.length ?? 0} items · Modified ${item.modified}`
  return `“${item.name}” · ${formatBytes(item.size ?? 0)} · Modified ${item.modified}`
}

export function FsIcon({ node, size = 44 }: { node: FsNode; size?: number }) {
  if (node.type === 'dir') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
        <path d="M4 12a4 4 0 0 1 4-4h11l4 4h17a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#e3a21a" />
        <path d="M4 18a4 4 0 0 1 4-4h32a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#fcc845" />
      </svg>
    )
  }
  const ext = node.name.split('.').pop()?.toLowerCase() ?? ''
  if (/jpe?g|png/.test(ext)) {
    const hue = [...node.name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
        <rect x="6" y="8" width="36" height="32" rx="4" fill={`hsl(${hue} 70% 62%)`} />
        <circle cx="32" cy="17" r="4" fill="#fff" opacity="0.8" />
        <path d="M6 33l10-10 9 9 6-5 11 9v0a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill={`hsl(${hue + 40} 60% 35%)`} />
      </svg>
    )
  }
  const color = ext === 'pdf' ? '#ef4444' : ext === 'zip' ? '#8b5cf6' : /m3u|m4a/.test(ext) ? '#ec4899' : '#60a5fa'
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path d="M12 4h17l10 10v28a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#eef1f7" />
      <path d="M29 4v8a2 2 0 0 0 2 2h8z" fill="#c9cfdc" />
      <rect x="14" y="20" width="18" height="2.4" rx="1.2" fill="#b6bdcc" />
      <rect x="14" y="25" width="20" height="2.4" rx="1.2" fill="#b6bdcc" />
      <rect x="10" y="32" width="22" height="9" rx="2" fill={color} />
      <text x="21" y="39" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif">
        {ext.toUpperCase().slice(0, 4)}
      </text>
    </svg>
  )
}

