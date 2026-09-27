import type { AppInfo } from './types'

const GB = 1e9

/**
 * Every app Plumos knows about. The home screen shows the ones in the apps
 * store's `installed` list; the App Store shows all of them.
 */
export const catalog: AppInfo[] = [
  {
    id: 'android',
    name: 'Android 13',
    tagline: 'A full Android phone, running on your server',
    description:
      'Run Android apps from any browser. Great for apps that only exist on phones, for testing, or for giving an AI agent a phone of its own.',
    category: 'virtual-machines',
    developer: 'Plumos',
    version: '13.0',
    icon: { type: 'art', art: 'android' },
    kind: 'vm',
    vm: { os: 'android', cpus: 4, memoryGb: 4, diskGb: 32 },
    size: 3.2 * GB,
  },
  {
    id: 'home-assistant',
    name: 'Home Assistant',
    tagline: 'Home automation that puts local control first',
    description:
      'Control your lights, sensors, locks and thermostats from one place, with automations that keep running even when the internet is down.',
    category: 'smart-home',
    developer: 'Home Assistant',
    version: '2026.9.1',
    icon: { type: 'art', art: 'home-assistant' },
    port: 8123,
    size: 1.1 * GB,
  },
  {
    id: 'hermes-agent',
    name: 'Hermes Agent',
    tagline: 'A personal AI agent that works for you',
    description:
      'An autonomous assistant that can browse, write, run tasks and use your other apps, powered by local or cloud models of your choice.',
    category: 'ai',
    developer: 'Nous Research',
    version: '0.9.2',
    icon: { type: 'art', art: 'hermes-agent' },
    port: 3200,
    size: 0.8 * GB,
  },
  {
    id: 'immich',
    name: 'Immich',
    tagline: 'Photo and video backup from your phone',
    description:
      'Automatically back up every photo and video from your phone, then browse by date, place and person — without handing your memories to anyone else.',
    category: 'files',
    developer: 'Immich',
    version: '1.140.0',
    icon: { type: 'art', art: 'immich' },
    port: 2283,
    size: 1.6 * GB,
  },
  {
    id: 'jellyfin',
    name: 'Jellyfin',
    tagline: 'Stream your movies, shows and music',
    description:
      'A free media server for your own collection. Stream to your TV, phone or browser with beautiful posters and metadata.',
    category: 'media',
    developer: 'Jellyfin',
    version: '10.11.0',
    icon: { type: 'art', art: 'jellyfin' },
    port: 8096,
    size: 0.9 * GB,
  },
  {
    id: 'n8n',
    name: 'n8n',
    tagline: 'Workflow automation for technical people',
    description:
      'Connect your apps and services with a visual workflow editor, then add code wherever you need it. Hundreds of integrations built in.',
    category: 'automation',
    developer: 'n8n',
    version: '1.112.0',
    icon: { type: 'art', art: 'n8n' },
    port: 5678,
    size: 0.6 * GB,
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    tagline: 'Files, calendars and contacts in your own cloud',
    description:
      'Sync files across your devices, share folders with family, and keep your calendar and contacts on hardware you own.',
    category: 'files',
    developer: 'Nextcloud',
    version: '31.0.4',
    icon: { type: 'art', art: 'nextcloud' },
    port: 8085,
    size: 1.2 * GB,
  },
  {
    id: 'bitcoin-node',
    name: 'Bitcoin Node',
    tagline: 'Run your own full Bitcoin node',
    description:
      'Verify every transaction yourself, broadcast privately, and connect your wallets to a node you control.',
    category: 'bitcoin',
    developer: 'Bitcoin Core',
    version: '29.1',
    icon: { type: 'art', art: 'bitcoin-node' },
    port: 2100,
    size: 0.4 * GB,
  },
  {
    id: 'windows',
    name: 'Windows 11',
    tagline: 'A Windows PC in a browser tab',
    description:
      'Run Windows programs from any device on your network. Perfect for the one app that only runs on Windows.',
    category: 'virtual-machines',
    developer: 'Plumos',
    version: '24H2',
    icon: { type: 'art', art: 'windows' },
    kind: 'vm',
    vm: { os: 'windows', cpus: 4, memoryGb: 8, diskGb: 64 },
    size: 6.4 * GB,
  },
  {
    id: 'ollama',
    name: 'Ollama',
    tagline: 'Run large language models locally',
    description:
      'Download and run open models on your own hardware, with an API that your other apps and agents can use.',
    category: 'ai',
    developer: 'Ollama',
    version: '0.12.3',
    icon: { type: 'art', art: 'ollama' },
    port: 11434,
    size: 2.3 * GB,
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    tagline: 'An open-source AI agent with a computer of its own',
    description:
      'An agent that can use a desktop, browser and terminal to get real work done, running entirely on your server.',
    category: 'ai',
    developer: 'OpenClaw',
    version: '2.4.0',
    icon: { type: 'art', art: 'openclaw' },
    port: 3300,
    size: 1.4 * GB,
  },
  {
    id: 'plex',
    name: 'Plex',
    tagline: 'Your personal media, on every screen',
    description:
      'Organise your movies, TV and music, and stream them to your devices at home or away.',
    category: 'media',
    developer: 'Plex',
    version: '1.42.1',
    icon: { type: 'art', art: 'plex' },
    port: 32400,
    path: '/web',
    size: 0.7 * GB,
  },
]

export const DEFAULT_INSTALLED = [
  'android',
  'home-assistant',
  'hermes-agent',
  'immich',
  'jellyfin',
  'n8n',
  'nextcloud',
  'bitcoin-node',
  'windows',
  'ollama',
  'openclaw',
  'plex',
]

export const findApp = (id: string) => catalog.find((a) => a.id === id)
