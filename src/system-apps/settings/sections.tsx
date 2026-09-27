import type { ComponentType } from 'react'
import {
  Globe,
  HardDrive,
  Info,
  LayoutGrid,
  Palette,
  Power as PowerIcon,
  RefreshCw,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { SectionId } from './lib/nav'
import { About } from './sections/about/About'
import { Account } from './sections/account/Account'
import { Appearance } from './sections/appearance/Appearance'
import { People } from './sections/people/People'
import { Power } from './sections/power/Power'
import { Sharing } from './sections/sharing/Sharing'
import { Storage } from './sections/storage/Storage'
import { Updates } from './sections/updates/Updates'
import { Widgets } from './sections/widgets/Widgets'

export interface SectionDef {
  id: SectionId
  title: string
  icon: LucideIcon
  /** Tile colour in the sidebar. */
  color: string
  /** Extra words the sidebar search matches. */
  keywords: string
  component: ComponentType
}

const section = (
  id: SectionId,
  title: string,
  icon: LucideIcon,
  color: string,
  component: ComponentType,
  keywords: string,
): SectionDef => ({ id, title, icon, color, component, keywords })

export const SECTIONS: Record<SectionId, SectionDef> = {
  account: section('account', 'Account', UserRound, '#8b7cf6', Account, 'name profile password two-factor 2fa security device hostname'),
  people: section('people', 'People', Users, '#f97316', People, 'users family members accounts admin roles shared space'),
  appearance: section(
    'appearance',
    'Appearance',
    Palette,
    '#a855f7',
    Appearance,
    'wallpaper background photo temperature celsius fahrenheit transparency',
  ),
  widgets: section('widgets', 'Widgets', LayoutGrid, '#0ea5e9', Widgets, 'home screen clock storage memory photos files'),
  storage: section('storage', 'Storage', HardDrive, '#10b981', Storage, 'drives disks pool mirror raid capacity hdd ssd usb'),
  sharing: section(
    'sharing',
    'Network & sharing',
    Globe,
    '#3b82f6',
    Sharing,
    'smb network drive finder explorer remote access address local devices',
  ),
  updates: section('updates', 'Updates', RefreshCw, '#6366f1', Updates, 'software version upgrade automatic'),
  about: section('about', 'About', Info, '#64748b', About, 'hostname os cpu processor memory ram uptime version hardware'),
  power: section('power', 'Power', PowerIcon, '#e11d48', Power, 'restart reboot shut down turn off'),
}

/** Sidebar groups, below the profile header (which is the Account section). */
export const GROUPS: SectionId[][] = [['people'], ['appearance', 'widgets'], ['storage', 'sharing'], ['updates', 'about', 'power']]

export function searchSections(query: string): SectionDef[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return Object.values(SECTIONS).filter((s) => `${s.title} ${s.keywords}`.toLowerCase().includes(q))
}
