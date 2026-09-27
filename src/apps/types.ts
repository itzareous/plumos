import type { LucideIcon } from 'lucide-react'

export type AppCategory =
  | 'files'
  | 'media'
  | 'ai'
  | 'bitcoin'
  | 'smart-home'
  | 'automation'
  | 'networking'
  | 'developer'
  | 'security'
  | 'social'
  | 'finance'
  | 'gaming'
  | 'virtual-machines'

export type AppIconSpec =
  /** Hand-drawn artwork from components/icons/art.tsx. */
  | { type: 'art'; art: string }
  /** A Lucide glyph on a CSS background (usually a gradient). */
  | { type: 'glyph'; glyph: LucideIcon; background: string; color?: string }

export interface AppInfo {
  id: string
  name: string
  /** One short line shown under the name in the App Store. */
  tagline: string
  description: string
  category: AppCategory
  developer: string
  version: string
  icon: AppIconSpec
  /** Port the app's web UI listens on, used to build its default link. */
  port?: number
  path?: string
  /** `vm` apps open the built-in virtual machine viewer instead of a link. */
  kind?: 'web' | 'vm'
  vm?: { os: 'windows' | 'android' | 'linux'; cpus: number; memoryGb: number; diskGb: number }
  /** Rough install size in bytes, shown in the App Store. */
  size?: number
}

export const categoryLabels: Record<AppCategory, string> = {
  files: 'Files & Productivity',
  media: 'Media',
  ai: 'AI',
  bitcoin: 'Bitcoin',
  'smart-home': 'Smart Home',
  automation: 'Automation',
  networking: 'Networking',
  developer: 'Developer Tools',
  security: 'Privacy & Security',
  social: 'Social',
  finance: 'Finance',
  gaming: 'Gaming',
  'virtual-machines': 'Virtual Machines',
}
