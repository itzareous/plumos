import { useId, type ComponentType } from 'react'
import type { AppCategory, AppInfo } from '@/apps/types'
import { appColors, seeded } from '../colors'
import { ChatMock, DashboardMock, GridMock, ListMock, PlayerMock } from './basic'
import { BudgetMock, DesktopMock, DocumentMock, TerminalMock, WorldMock } from './extra'
import { Frame, type MockProps } from './Frame'
import { BlocksMock, DevicesMock, EditorMock, FeedMock, NodesMock } from './more'

const mocks = {
  dashboard: DashboardMock,
  list: ListMock,
  grid: GridMock,
  player: PlayerMock,
  chat: ChatMock,
  nodes: NodesMock,
  blocks: BlocksMock,
  devices: DevicesMock,
  editor: EditorMock,
  feed: FeedMock,
  budget: BudgetMock,
  world: WorldMock,
  desktop: DesktopMock,
  terminal: TerminalMock,
  document: DocumentMock,
} satisfies Record<string, ComponentType<MockProps>>

export type MockKind = keyof typeof mocks

const byCategory: Record<AppCategory, MockKind[]> = {
  files: ['document', 'list', 'grid'],
  media: ['grid', 'player', 'list'],
  ai: ['chat', 'nodes', 'dashboard'],
  bitcoin: ['blocks', 'dashboard', 'list'],
  'smart-home': ['devices', 'dashboard', 'nodes'],
  automation: ['nodes', 'list', 'dashboard'],
  networking: ['dashboard', 'list', 'devices'],
  developer: ['editor', 'dashboard', 'terminal'],
  security: ['list', 'dashboard', 'document'],
  social: ['feed', 'chat', 'grid'],
  finance: ['budget', 'list', 'dashboard'],
  gaming: ['world', 'grid', 'dashboard'],
  'virtual-machines': ['desktop', 'terminal', 'dashboard'],
}

// A few apps read better with a different lead screenshot than their category's.
const byApp: Record<string, MockKind[]> = {
  immich: ['grid', 'list', 'dashboard'],
  photoprism: ['grid', 'list', 'dashboard'],
  navidrome: ['player', 'grid', 'list'],
  audiobookshelf: ['player', 'grid', 'list'],
  comfyui: ['nodes', 'grid', 'dashboard'],
  invokeai: ['grid', 'nodes', 'dashboard'],
  grafana: ['dashboard', 'editor', 'terminal'],
  'uptime-kuma': ['dashboard', 'list', 'devices'],
  'node-red': ['nodes', 'devices', 'dashboard'],
  n8n: ['nodes', 'list', 'dashboard'],
  'matrix-synapse': ['chat', 'feed', 'list'],
  'actual-budget': ['budget', 'list', 'dashboard'],
  ghostfolio: ['dashboard', 'budget', 'list'],
  vikunja: ['document', 'list', 'dashboard'],
  'code-server': ['editor', 'terminal', 'dashboard'],
}

export const screenshotKinds = (app: AppInfo) => byApp[app.id] ?? byCategory[app.category]

/** A stylised, original mock of an app's UI, tinted with its icon colours. */
export function Screenshot({ app, kind, index = 0 }: { app: AppInfo; kind: MockKind; index?: number }) {
  const id = `ss${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const c = appColors(app)
  const Mock = mocks[kind]
  const r = seeded(`${app.id}:${kind}:${index}`)
  return (
    <Frame app={app} c={c} id={id}>
      <Mock app={app} c={c} r={r} id={id} />
    </Frame>
  )
}
