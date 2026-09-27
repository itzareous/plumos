import {
  Code,
  Coins,
  FolderOpen,
  Film,
  Gamepad2,
  House,
  MessagesSquare,
  Monitor,
  Network,
  Shield,
  Sparkles,
  Wallet,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { catalog, findApp } from '@/apps/catalog'
import { categoryLabels, type AppCategory, type AppInfo } from '@/apps/types'

export interface CategoryMeta {
  icon: LucideIcon
  blurb: string
  /** Tile gradient for the category's icon. */
  tint: string
}

export const categoryMeta: Record<AppCategory, CategoryMeta> = {
  ai: {
    icon: Sparkles,
    blurb: 'Local models, chat and image tools that keep your data at home.',
    tint: 'linear-gradient(150deg, #a78bfa, #6d28d9)',
  },
  media: {
    icon: Film,
    blurb: 'Stream your movies, shows, music and books to every screen.',
    tint: 'linear-gradient(150deg, #fb923c, #db2777)',
  },
  files: {
    icon: FolderOpen,
    blurb: 'Sync, share and organise everything from photos to paperwork.',
    tint: 'linear-gradient(150deg, #38bdf8, #2563eb)',
  },
  bitcoin: {
    icon: Coins,
    blurb: 'Run your own node and take charge of your own money.',
    tint: 'linear-gradient(150deg, #fcd34d, #ea580c)',
  },
  'smart-home': {
    icon: House,
    blurb: 'Lights, cameras and sensors that answer to you, not a cloud.',
    tint: 'linear-gradient(150deg, #5eead4, #0f766e)',
  },
  automation: {
    icon: Workflow,
    blurb: 'Let your server take care of the repetitive stuff.',
    tint: 'linear-gradient(150deg, #fb7185, #be123c)',
  },
  networking: {
    icon: Network,
    blurb: 'Reach home from anywhere and keep an eye on everything.',
    tint: 'linear-gradient(150deg, #4ade80, #15803d)',
  },
  developer: {
    icon: Code,
    blurb: 'Code, containers and dashboards for tinkerers.',
    tint: 'linear-gradient(150deg, #7dd3fc, #0369a1)',
  },
  security: {
    icon: Shield,
    blurb: 'Passwords, ad blocking and private search for the whole house.',
    tint: 'linear-gradient(150deg, #93c5fd, #4338ca)',
  },
  social: {
    icon: MessagesSquare,
    blurb: 'Chat, post and follow on networks you own.',
    tint: 'linear-gradient(150deg, #818cf8, #7c3aed)',
  },
  finance: {
    icon: Wallet,
    blurb: 'Budgets and portfolios that stay off other people’s servers.',
    tint: 'linear-gradient(150deg, #86efac, #047857)',
  },
  gaming: {
    icon: Gamepad2,
    blurb: 'Game servers and retro collections for family game night.',
    tint: 'linear-gradient(150deg, #f0abfc, #a21caf)',
  },
  'virtual-machines': {
    icon: Monitor,
    blurb: 'Whole computers in a browser tab: Windows, Linux and Android.',
    tint: 'linear-gradient(150deg, #67e8f9, #0e7490)',
  },
}

/** Categories in the order the store shows them. */
export const categoryOrder: AppCategory[] = [
  'ai',
  'media',
  'files',
  'smart-home',
  'bitcoin',
  'virtual-machines',
  'security',
  'networking',
  'automation',
  'developer',
  'social',
  'finance',
  'gaming',
]

export const categoryLabel = (c: AppCategory) => categoryLabels[c]

const byIds = (ids: string[]) => ids.map(findApp).filter((a): a is AppInfo => Boolean(a))
const byName = (a: AppInfo, b: AppInfo) => a.name.localeCompare(b.name)

export const appsInCategory = (category: AppCategory) => catalog.filter((a) => a.category === category).sort(byName)

export interface Collection {
  id: string
  title: string
  subtitle: string
  apps: AppInfo[]
  /** "See all" opens this category instead of the collection itself. */
  category?: AppCategory
}

export const collections: Record<string, Collection> = {
  new: {
    id: 'new',
    title: 'New & noteworthy',
    subtitle: 'Fresh arrivals worth a closer look',
    apps: catalog.filter((a) => a.isNew),
  },
  ai: {
    id: 'ai',
    title: 'AI on your terms',
    subtitle: 'Models, chat and creative tools that run on your server',
    category: 'ai',
    apps: byIds([
      'ollama',
      'open-webui',
      'hermes-agent',
      'openclaw',
      'comfyui',
      'librechat',
      'whisper',
      'localai',
      'invokeai',
    ]),
  },
  media: {
    id: 'media',
    title: 'Media',
    subtitle: 'Your library, streamed to every screen',
    category: 'media',
    apps: byIds([
      'jellyfin',
      'plex',
      'navidrome',
      'audiobookshelf',
      'kavita',
      'sonarr',
      'radarr',
      'calibre-web',
      'prowlarr',
      'qbittorrent',
      'transmission',
    ]),
  },
  essentials: {
    id: 'essentials',
    title: 'Home server essentials',
    subtitle: 'The apps nearly everyone installs first',
    apps: byIds([
      'immich',
      'nextcloud',
      'vaultwarden',
      'tailscale',
      'pi-hole',
      'syncthing',
      'uptime-kuma',
      'paperless-ngx',
    ]),
  },
  bitcoin: {
    id: 'bitcoin',
    title: 'Bitcoin',
    subtitle: 'Be your own bank, starting with your own node',
    category: 'bitcoin',
    apps: byIds(['bitcoin-node', 'mempool', 'lightning-node', 'btcpay-server', 'electrs', 'ride-the-lightning']),
  },
  'smart-home': {
    id: 'smart-home',
    title: 'Smart home',
    subtitle: 'Local control for lights, cameras and sensors',
    category: 'smart-home',
    apps: byIds(['home-assistant', 'frigate', 'zigbee2mqtt', 'esphome', 'homebridge', 'node-red']),
  },
}

/** Rows on the store's front page, top to bottom. */
export const homeShelves = ['ai', 'media', 'essentials', 'bitcoin', 'smart-home']

/** Case-insensitive search over names, taglines, developers, categories and keywords. */
export function searchApps(query: string): AppInfo[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const scored = catalog.map((app) => {
    const name = app.name.toLowerCase()
    let score = 0
    if (name === q) score = 100
    else if (name.startsWith(q)) score = 80
    else if (name.split(/[\s-]+/).some((w) => w.startsWith(q))) score = 60
    else if (name.includes(q)) score = 50
    else if (app.keywords?.some((k) => k.startsWith(q))) score = 40
    else if (categoryLabels[app.category].toLowerCase().includes(q)) score = 30
    else if (`${app.tagline} ${app.developer} ${app.keywords?.join(' ') ?? ''}`.toLowerCase().includes(q)) score = 20
    else if (app.description.toLowerCase().includes(q)) score = 10
    return { app, score }
  })
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || byName(a.app, b.app))
    .map((x) => x.app)
}

// Categories that pair well, for "You might also like".
const neighbours: Partial<Record<AppCategory, AppCategory[]>> = {
  ai: ['automation', 'developer'],
  media: ['files', 'gaming'],
  files: ['media', 'security'],
  bitcoin: ['finance', 'security'],
  'smart-home': ['automation', 'ai'],
  automation: ['smart-home', 'developer'],
  networking: ['security', 'developer'],
  developer: ['networking', 'automation'],
  security: ['networking', 'files'],
  social: ['files', 'media'],
  finance: ['bitcoin', 'files'],
  gaming: ['media', 'virtual-machines'],
  'virtual-machines': ['ai', 'developer'],
}

export function relatedApps(app: AppInfo, limit = 8): AppInfo[] {
  const same = catalog.filter((a) => a.category === app.category && a.id !== app.id)
  const near = (neighbours[app.category] ?? []).flatMap((c) => catalog.filter((a) => a.category === c))
  const seen = new Set<string>()
  return [...same, ...near].filter((a) => !seen.has(a.id) && seen.add(a.id)).slice(0, limit)
}
