import {
  AlarmClock,
  Calculator,
  CalendarDays,
  Camera,
  CloudSun,
  Compass,
  FileCode2,
  Folder,
  Gauge,
  Image,
  MessageCircle,
  Music2,
  NotebookPen,
  Phone,
  Settings,
  SquareTerminal,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

export type GuestApp =
  | 'files'
  | 'browser'
  | 'notes'
  | 'calc'
  | 'settings'
  | 'terminal'
  | 'editor'
  | 'messages'
  | 'phone'
  | 'camera'
  | 'clock'
  | 'calendar'
  | 'photos'
  | 'weather'
  | 'music'
  | 'tasks'
  | 'bin'

interface GlyphDef {
  label: string
  icon: LucideIcon
  bg: string
  fg?: string
}

/** Generic app tiles for the guests: a Lucide glyph on our own gradients. */
export const GLYPHS: Record<GuestApp, GlyphDef> = {
  files: { label: 'Files', icon: Folder, bg: 'linear-gradient(160deg,#ffd66b,#f59e0b)', fg: '#6b3b00' },
  browser: { label: 'Browser', icon: Compass, bg: 'linear-gradient(160deg,#5eead4,#2563eb)' },
  notes: { label: 'Notes', icon: NotebookPen, bg: 'linear-gradient(160deg,#fff4c2,#fcd34d)', fg: '#7a4b00' },
  calc: { label: 'Calculator', icon: Calculator, bg: 'linear-gradient(160deg,#4b5563,#1f2937)', fg: '#fdba74' },
  settings: { label: 'Settings', icon: Settings, bg: 'linear-gradient(160deg,#9ca3af,#4b5563)' },
  terminal: { label: 'Terminal', icon: SquareTerminal, bg: 'linear-gradient(160deg,#374151,#0b0f17)', fg: '#86efac' },
  editor: { label: 'Text Editor', icon: FileCode2, bg: 'linear-gradient(160deg,#c4b5fd,#7c3aed)' },
  messages: { label: 'Messages', icon: MessageCircle, bg: 'linear-gradient(160deg,#86efac,#16a34a)' },
  phone: { label: 'Phone', icon: Phone, bg: 'linear-gradient(160deg,#6ee7b7,#059669)' },
  camera: { label: 'Camera', icon: Camera, bg: 'linear-gradient(160deg,#6b7280,#111827)' },
  clock: { label: 'Clock', icon: AlarmClock, bg: 'linear-gradient(160deg,#93c5fd,#1e3a8a)' },
  calendar: { label: 'Calendar', icon: CalendarDays, bg: 'linear-gradient(160deg,#fca5a5,#dc2626)' },
  photos: { label: 'Photos', icon: Image, bg: 'linear-gradient(160deg,#f9a8d4,#8b5cf6)' },
  weather: { label: 'Weather', icon: CloudSun, bg: 'linear-gradient(160deg,#7dd3fc,#0284c7)' },
  music: { label: 'Music', icon: Music2, bg: 'linear-gradient(160deg,#fda4af,#e11d48)' },
  tasks: { label: 'Task List', icon: Gauge, bg: 'linear-gradient(160deg,#a5b4fc,#4338ca)' },
  bin: { label: 'Bin', icon: Trash2, bg: 'linear-gradient(160deg,#e5e7eb,#9ca3af)', fg: '#374151' },
}

export function AppGlyph({
  app,
  size = 32,
  shape = 'square',
  className,
}: {
  app: GuestApp
  size?: number
  shape?: 'square' | 'circle' | 'squircle'
  className?: string
}) {
  const def = GLYPHS[app]
  const Icon = def.icon
  const radius = shape === 'circle' ? size / 2 : shape === 'squircle' ? size * 0.3 : size * 0.22
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden', className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: def.bg,
        boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.35), 0 ${size * 0.05}px ${size * 0.18}px rgb(0 0 0 / 0.3)`,
      }}
    >
      <Icon size={size * 0.54} strokeWidth={2} color={def.fg ?? '#fff'} />
    </span>
  )
}
