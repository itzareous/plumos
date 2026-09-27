import type { ComponentType } from 'react'
import { Globe, HardDrive, Info, LayoutGrid, Palette, Power as PowerIcon, RefreshCw, UserRound, Users, type LucideIcon } from 'lucide-react'
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

export const SECTIONS: Record<SectionId, SectionDef> = {
  account: { id: 'account', title: 'Account', icon: UserRound, color: '#8b7cf6', keywords: 'name profile password two-factor 2fa security device hostname', component: Account },
  people: { id: 'people', title: 'People', icon: Users, color: '#f97316', keywords: 'users family members accounts admin roles shared space', component: People },
  appearance: { id: 'appearance', title: 'Appearance', icon: Palette, color: '#a855f7', keywords: 'wallpaper background theme temperature celsius fahrenheit transparency', component: Appearance },
  widgets: { id: 'widgets', title: 'Widgets', icon: LayoutGrid, color: '#0ea5e9', keywords: 'home screen clock storage memory photos files', component: Widgets },
  storage: { id: 'storage', title: 'Storage', icon: HardDrive, color: '#10b981', keywords: 'drives disks pool mirror raid capacity hdd ssd usb', component: Storage },
  sharing: { id: 'sharing', title: 'Network & sharing', icon: Globe, color: '#3b82f6', keywords: 'smb network drive finder explorer remote access address local devices', component: Sharing },
  updates: { id: 'updates', title: 'Updates', icon: RefreshCw, color: '#6366f1', keywords: 'software version upgrade automatic', component: Updates },
  about: { id: 'about', title: 'About', icon: Info, color: '#64748b', keywords: 'hostname os cpu processor memory ram uptime version hardware', component: About },
  power: { id: 'power', title: 'Power', icon: PowerIcon, color: '#e11d48', keywords: 'restart reboot shut down turn off', component: Power },
}

/** Sidebar groups, below the profile header (which is the Account section). */
export const GROUPS: SectionId[][] = [['people'], ['appearance', 'widgets'], ['storage', 'sharing'], ['updates', 'about', 'power']]

export function searchSections(query: string): SectionDef[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return Object.values(SECTIONS).filter((s) => `${s.title} ${s.keywords}`.toLowerCase().includes(q))
}
