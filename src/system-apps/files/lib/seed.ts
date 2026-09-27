import type { FileNode } from '@/stores/files'
import { extensionOf, kindFromName, type FileKind } from './kinds'

/**
 * Believable demo content for the file tree. Deterministic, so every fresh
 * browser sees the same house full of files.
 */

const DAY = 864e5
const KB = 1e3
const MB = 1e6
const GB = 1e9

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface FileOpts {
  size?: number
  at?: number
  fav?: boolean
  content?: string
}

type Range = [from: number, to: number]

function sizeFor(kind: FileKind, ext: string, r: () => number): number {
  const between = (a: number, b: number) => Math.round(a + (b - a) * r())
  switch (kind) {
    case 'image':
      if (ext === 'png') return between(0.4 * MB, 2.2 * MB)
      if (ext === 'heic') return between(1.6 * MB, 3.8 * MB)
      if (ext === 'tif') return between(18 * MB, 42 * MB)
      return between(2.2 * MB, 6.4 * MB)
    case 'video':
      return between(90 * MB, 1.8 * GB)
    case 'audio':
      return ext === 'flac' || ext === 'wav' ? between(24 * MB, 68 * MB) : between(3 * MB, 11 * MB)
    case 'pdf':
      return between(90 * KB, 4.2 * MB)
    case 'document':
      return ext === 'pptx' ? between(2 * MB, 18 * MB) : between(24 * KB, 640 * KB)
    case 'spreadsheet':
      return between(14 * KB, 420 * KB)
    case 'archive':
      return between(8 * MB, 900 * MB)
    case 'code':
      return between(0.6 * KB, 24 * KB)
    case 'text':
      return between(0.4 * KB, 18 * KB)
    default:
      return between(40 * KB, 60 * MB)
  }
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

function createBuilder(seed: number, nodes: Record<string, FileNode>, prefix: string) {
  const r = mulberry32(seed)
  let counter = 0
  const nextId = () => `${prefix}${(counter++).toString(36)}`
  const within = ([from, to]: Range) => Math.round(from + (to - from) * r())

  const folder = (parent: string | null, name: string, opts: { id?: string; fav?: boolean } = {}) => {
    const id = opts.id ?? nextId()
    nodes[id] = { id, parent, name, kind: 'folder', size: 0, modified: 0, ...(opts.fav ? { favorite: true } : {}) }
    return id
  }

  const file = (parent: string, name: string, at: number, opts: FileOpts = {}) => {
    const id = nextId()
    const kind = kindFromName(name)
    const size = opts.size ?? (opts.content ? new Blob([opts.content]).size : sizeFor(kind, extensionOf(name), r))
    nodes[id] = {
      id,
      parent,
      name,
      kind,
      size,
      modified: opts.at ?? at,
      ...(opts.fav ? { favorite: true } : {}),
      ...(opts.content ? { content: opts.content } : {}),
    }
    return id
  }

  /** Adds files with random dates in a range. Entries can carry options. */
  const files = (parent: string, range: Range, entries: (string | [string, FileOpts])[]) =>
    entries.forEach((e) => {
      const [name, opts] = typeof e === 'string' ? [e, {}] : e
      file(parent, name, within(range), opts)
    })

  /** A run of camera photos, e.g. IMG_4821.HEIC … */
  const camera = (parent: string, range: Range, count: number, pattern: (i: number) => string) => {
    const start = Math.floor(r() * 3000) + 1000
    const times = Array.from({ length: count }, () => within(range)).sort((a, b) => a - b)
    times.forEach((t, i) => file(parent, pattern(start + i * (1 + Math.floor(r() * 4))), t))
  }

  return { folder, file, files, camera, within, r }
}

/** Folder dates follow their newest item, like a real filesystem. */
function settleFolderDates(nodes: Record<string, FileNode>, fallback: number) {
  const children = new Map<string, FileNode[]>()
  for (const n of Object.values(nodes)) {
    if (!n.parent) continue
    const list = children.get(n.parent) ?? []
    list.push(n)
    children.set(n.parent, list)
  }
  const visit = (node: FileNode): number => {
    if (node.kind !== 'folder') return node.modified
    const kids = children.get(node.id) ?? []
    const latest = kids.reduce((m, k) => Math.max(m, visit(k)), 0)
    if (!node.modified) node.modified = latest || fallback
    return node.modified
  }
  Object.values(nodes)
    .filter((n) => !n.parent || !nodes[n.parent])
    .forEach(visit)
}

const NOTES = `# Things to sort out this month

- Move the old laptop backups onto Plumos
- Ask Ava which photos should go in the shared album
- Renew the car insurance before the 14th
- Try the new sourdough schedule (see Shared › Recipes)

Ideas
- A family recipe book, printed, for the holidays
- Digitise the box of old photo prints in the attic
`

const SOURDOUGH = `Sourdough starter — feeding schedule

Day 1-3   50 g flour + 50 g water, twice a day
Day 4-7   discard half, then feed 1:1:1
Ready when it doubles within 6 hours and smells pleasantly sour.

Keep it in the fridge between bakes. Feed once a week.
Name: Doughbert (Leo insisted)
`

const PANCAKES = `# Pancakes (the good ones)

2 cups flour · 2 tbsp sugar · 2 tsp baking powder · pinch of salt
2 eggs · 1¾ cups milk · 3 tbsp melted butter

Whisk wet into dry, don't overmix — lumps are fine.
Rest 10 minutes. Medium heat. Flip when bubbles pop.
Saturday rule: first one is always for the cook.
`

const GUEST_WIFI = `Guest Wi-Fi

Network   Home-Guest
Password  ask Ava or check the fridge magnet :)

The guest network can't see Plumos or anything else at home.
`

const HA_CONFIG = `# Loads default set of integrations. Do not remove.
default_config:

homeassistant:
  name: Home
  unit_system: metric
  time_zone: Europe/Lisbon

automation: !include automations.yaml
script: !include scripts.yaml
scene: !include scenes.yaml

http:
  use_x_forwarded_for: true
  trusted_proxies:
    - 172.17.0.0/16
`

const BITCOIN_CONF = `# Managed by Plumos. Changes may be overwritten on update.
server=1
prune=0
txindex=1
dbcache=2048
maxconnections=40
listen=1
rpcbind=0.0.0.0
rpcallowip=10.21.0.0/16
zmqpubrawblock=tcp://0.0.0.0:28332
zmqpubrawtx=tcp://0.0.0.0:28333
`

const SETUP_SH = `#!/usr/bin/env bash
# Pull the models we use for the kitchen assistant.
set -euo pipefail

for model in llama3.1:8b qwen2.5-coder:7b nomic-embed-text; do
  echo "Pulling $model…"
  ollama pull "$model"
done

echo "All set."
`

const ITINERARY = `Road trip — summer 2010

Fri   leave after work, stop at the diner halfway
Sat   coast road, lighthouse, camp by the dunes
Sun   farmers market, long drive home

Pack: tent, spare tyre check, camera batteries (!), maps
`

/** The whole demo tree. */
export function seedFiles(now = Date.now()): Record<string, FileNode> {
  const nodes: Record<string, FileNode> = {}
  const b = createBuilder(20260927, nodes, 's')
  const { folder, files, camera, file } = b
  const ago = (days: number): Range => [now - days * DAY, now - (days * DAY) / 6]
  const stamp = (t: number) => {
    const d = new Date(t)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }

  // ---- Roots
  const home = folder(null, 'Home', { id: 'home' })
  const shared = folder(null, 'Shared', { id: 'shared' })
  const apps = folder(null, 'Apps', { id: 'apps' })
  folder(null, 'External', { id: 'external' })

  // ---- Home
  const downloads = folder(home, 'Downloads')
  const documents = folder(home, 'Documents', { fav: true })
  const photos = folder(home, 'Photos')
  const videos = folder(home, 'Videos')
  const music = folder(home, 'Music')
  folder(home, 'Imported')

  const shot1 = now - 2 * DAY - 3.4 * 3600e3
  const shot2 = now - 6 * DAY - 7.1 * 3600e3
  file(downloads, `Screenshot ${stamp(shot1)} at 09.41.12.png`, shot1)
  file(downloads, `Screenshot ${stamp(shot2)} at 21.07.55.png`, shot2)
  file(downloads, `IMG_${stamp(now - 1 * DAY).replace(/-/g, '')}_182233.jpg`, now - 1 * DAY - 5 * 3600e3)
  files(downloads, ago(21), [
    'boarding-pass-LIS.pdf',
    'invoice-4471.pdf',
    'Bank statement — August.pdf',
    ['plumos-backup-full.tar.gz', { size: 2.14 * GB }],
    ['debian-13.1.0-amd64-netinst.iso', { size: 754 * MB }],
    ['setup-models.sh', { content: SETUP_SH }],
    'Kids chore chart.pdf',
    'lease-renewal-signed.pdf',
    ['Handwriting fonts.zip', { size: 18.2 * MB }],
    'Garden planner.xlsx',
    ['podcast-episode-42.mp3', { size: 48.6 * MB }],
    'Concert tickets.pdf',
    ['birthday-invite.png', { size: 1.1 * MB }],
  ])

  const work = folder(documents, 'Work')
  files(work, ago(60), ['Q3 planning.pptx', 'Team offsite.pdf', 'Expense report — September.xlsx', 'Meeting notes.md'])
  const personal = folder(documents, 'Personal')
  files(personal, ago(300), ['Passport scan.pdf', 'Car insurance 2026.pdf', 'Wedding speech.docx', 'Vaccination record.pdf'])
  const house = folder(documents, 'House')
  files(house, ago(200), [
    'Mortgage statement.pdf',
    'Floor plan.pdf',
    ['Appliance manuals.zip', { size: 64 * MB }],
    'Renovation budget.xlsx',
    'Paint colours.jpg',
  ])
  files(documents, ago(120), [
    ['Resume 2026.docx', { fav: true }],
    'Budget 2026.xlsx',
    'Lease agreement.pdf',
    ['Notes.md', { content: NOTES, at: now - 3 * DAY }],
    'Recipes to try.txt',
    'Tax checklist.pdf',
    'Book club list.docx',
  ])

  const iceland = folder(photos, 'Iceland 2025', { fav: true })
  const iceTrip: Range = [now - 380 * DAY, now - 372 * DAY]
  camera(iceland, iceTrip, 22, (i) => `IMG_${i}.HEIC`)
  files(iceland, iceTrip, ['Waterfall timelapse.mov', 'Black sand beach.mov'])
  const screenshots = folder(photos, 'Screenshots')
  camera(screenshots, ago(90), 7, (i) => `Screenshot ${i}.png`)
  camera(photos, ago(45), 26, (i) => `IMG_${i + 3000}.HEIC`)
  files(photos, ago(200), ['Profile picture.png'])

  files(videos, ago(240), [
    ['First steps.mov', { size: 820 * MB, fav: true }],
    ['Birthday party.mp4', { size: 1.42 * GB }],
    ['Drone — coastline.mp4', { size: 2.21 * GB }],
    ['Screen recording.mov', { size: 164 * MB }],
    ['Guitar lesson 03.mp4', { size: 540 * MB }],
    ['Sunset over the bay.mov', { size: 312 * MB }],
  ])

  const sketches = folder(music, 'Piano sketches')
  camera(sketches, ago(150), 8, (i) => `Sketch ${pad((i % 12) + 1)}.m4a`)
  files(music, ago(160), [
    'Field recording — rain on the roof.flac',
    'Voice memo — grocery list.m4a',
    'Lullabies we made up.m4a',
    'Road trip mix.m3u',
  ])
  const podcast = folder(music, 'Podcast drafts')
  files(podcast, ago(30), ['Episode 12 rough cut.wav', 'Episode 12 notes.md', 'Intro music.wav'])

  // ---- Shared (the family space)
  const familyPhotos = folder(shared, 'Family Photos', { fav: true })
  const xmas = folder(familyPhotos, 'Christmas 2025')
  camera(xmas, [now - 276 * DAY, now - 274 * DAY], 16, (i) => `IMG_${i}.jpg`)
  const lake = folder(familyPhotos, 'Summer at the lake')
  camera(lake, [now - 70 * DAY, now - 62 * DAY], 18, (i) => `IMG_${i}.jpg`)
  files(lake, [now - 70 * DAY, now - 62 * DAY], ['Jumping off the dock.mp4', 'Canoe race.mp4'])
  camera(familyPhotos, ago(400), 12, (i) => `Family ${pad(i % 100)}.jpg`)

  const recipes = folder(shared, 'Recipes')
  files(recipes, ago(500), [
    "Grandma's lasagna.pdf",
    ['Sourdough starter.txt', { content: SOURDOUGH }],
    'Weeknight curry.docx',
    ['Pancakes (the good ones).md', { content: PANCAKES, fav: true }],
    'Meal plan — October.xlsx',
    'Birthday cake.jpg',
    'Lemon bars.pdf',
  ])

  const taxes = folder(shared, 'Taxes 2025')
  files(taxes, [now - 200 * DAY, now - 150 * DAY], [
    'Wage statement — Ava.pdf',
    'Interest statement — credit union.pdf',
    ['Charitable receipts.zip', { size: 12.4 * MB }],
    'Deductions.xlsx',
    'Filed return 2025.pdf',
    'Childcare receipts.pdf',
  ])

  const holiday = folder(shared, 'Holiday Videos')
  files(holiday, ago(700), [
    ['Christmas morning.mp4', { size: 1.12 * GB }],
    ['Lake house.mov', { size: 2.6 * GB }],
    ['New Year fireworks.mp4', { size: 480 * MB }],
    ['Snow day.mov', { size: 690 * MB }],
  ])

  const school = folder(shared, 'School')
  files(school, ago(40), [
    'Leo — Science fair poster.pdf',
    'Reading log.xlsx',
    'Field trip permission slip.pdf',
    'School calendar 2026-27.pdf',
    'Book report — Leo.docx',
    'Art project.jpg',
    'Spelling words week 3.txt',
  ])
  files(shared, ago(90), [['Guest Wi-Fi.txt', { content: GUEST_WIFI }], 'Emergency contacts.pdf'])

  // ---- Apps (app data, managed by each app)
  const app = (id: string) => folder(apps, id)
  const appFiles = ago(20)

  const jellyfin = app('jellyfin')
  const jfConfig = folder(jellyfin, 'config')
  files(jfConfig, appFiles, ['system.xml', 'network.xml', 'encoding.xml'])
  const jfMeta = folder(jellyfin, 'metadata')
  folder(jfMeta, 'library')
  folder(jfMeta, 'People')
  folder(jellyfin, 'cache')
  const jfLog = folder(jellyfin, 'log')
  files(jfLog, ago(3), ['log_latest.log', 'log_previous.log'])

  const immich = app('immich')
  const immLib = folder(immich, 'library')
  folder(immLib, 'upload')
  folder(immich, 'thumbs')
  folder(immich, 'encoded-video')
  const immDb = folder(immich, 'postgres')
  files(immDb, ago(1), [['base.tar', { size: 1.8 * GB }]])

  const nextcloud = app('nextcloud')
  folder(nextcloud, 'data')
  const ncConfig = folder(nextcloud, 'config')
  files(ncConfig, appFiles, ['config.php', 'apps.config.php'])
  folder(nextcloud, 'apps')

  const ha = app('home-assistant')
  files(ha, ago(10), [
    ['configuration.yaml', { content: HA_CONFIG }],
    'automations.yaml',
    'scripts.yaml',
    'secrets.yaml',
    ['home-assistant_v2.db', { size: 412 * MB }],
  ])

  const ollama = app('ollama')
  const models = folder(ollama, 'models')
  files(models, ago(50), [
    ['llama3.1-8b-instruct-q4_K_M.gguf', { size: 4.92 * GB }],
    ['qwen2.5-coder-7b-q4_K_M.gguf', { size: 4.68 * GB }],
    ['nomic-embed-text-v1.5.gguf', { size: 274 * MB }],
  ])

  const btc = app('bitcoin-node')
  const blocks = folder(btc, 'blocks')
  camera(blocks, ago(4), 6, (i) => `blk0${i + 4000}.dat`)
  folder(btc, 'chainstate')
  files(btc, ago(2), [['bitcoin.conf', { content: BITCOIN_CONF }], ['debug.log', { size: 88 * MB }]])

  const n8n = app('n8n')
  files(n8n, ago(12), [['database.sqlite', { size: 36 * MB }], 'config.json'])
  const flows = folder(n8n, 'workflows')
  files(flows, ago(40), ['Morning digest.json', 'Backup photos to cold storage.json', 'Plant watering reminder.json'])

  const win = app('windows')
  files(win, ago(6), [['disk.qcow2', { size: 38.4 * GB }], ['nvram.fd', { size: 540 * KB }]])
  const android = app('android')
  files(android, ago(9), [['userdata.img', { size: 9.4 * GB }], ['system.img', { size: 3.1 * GB }]])

  for (const id of ['hermes-agent', 'openclaw']) {
    const f = app(id)
    folder(f, 'workspace')
    files(f, ago(5), [['memory.db', { size: 96 * MB }], 'config.toml'])
  }
  const plex = app('plex')
  folder(plex, 'Library')
  folder(plex, 'Cache')
  files(plex, ago(30), ['Preferences.xml'])

  // ---- The old USB backup drive
  seedDriveInto(nodes, 'usb0', 'Old Backup Drive', b)

  settleFolderDates(nodes, now)
  return nodes
}

type Builder = ReturnType<typeof createBuilder>

function seedDriveInto(nodes: Record<string, FileNode>, driveId: string, name: string, b: Builder) {
  const { folder, files, camera } = b
  const root = folder('external', name, { id: driveFolderId(driveId) })
  const year = (y: number): Range => [new Date(y, 1, 1).getTime(), new Date(y, 10, 28).getTime()]

  const d2009 = folder(root, 'DCIM 2009')
  camera(d2009, year(2009), 34, (i) => `DSC0${i + 1000}.JPG`)
  files(d2009, year(2009), ['MVI_0231.AVI', 'MVI_0266.AVI'])

  const d2011 = folder(root, 'DCIM 2011')
  camera(d2011, year(2011), 40, (i) => `IMG_${i}.JPG`)
  files(d2011, year(2011), ['MOV_0045.MOV', 'MOV_0051.MOV', 'MOV_0070.MOV'])

  const scans = folder(root, 'Scans')
  files(scans, year(2013), [
    'Wedding invitation.pdf',
    'Birth certificate.pdf',
    'Letters from Grandpa, 1987.pdf',
    'Report card 1994.pdf',
  ])
  camera(scans, year(2013), 6, (i) => `Old family photo ${pad(i % 100)}.tif`)

  const old = folder(root, 'Old Documents')
  files(old, year(2010), [
    'Thesis final FINAL (2).doc',
    'CV 2010.doc',
    'Budget 2012.xls',
    ['Apartment photos.zip', { size: 210 * MB }],
    ['Road trip itinerary.txt', { content: ITINERARY }],
  ])
  const mixtape = folder(old, 'Mixtape 2008')
  camera(mixtape, year(2008), 8, (i) => `Track ${pad((i % 12) + 1)}.mp3`)
}

export const driveFolderId = (driveId: string) => `drive:${driveId}`

/** Contents for a drive we have no demo data for (e.g. one plugged in from Settings). */
export function seedDrive(driveId: string, name: string, now = Date.now()): Record<string, FileNode> {
  const nodes: Record<string, FileNode> = {}
  let hash = 0
  for (const ch of driveId) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  const b = createBuilder(hash >>> 0, nodes, `d${driveId}-`)
  const { folder, files, camera } = b
  const root = folder('external', name, { id: driveFolderId(driveId) })
  const range: Range = [now - 1400 * DAY, now - 700 * DAY]
  const dcim = folder(root, 'DCIM')
  camera(dcim, range, 24, (i) => `IMG_${i}.JPG`)
  files(dcim, range, ['VID_0012.MP4', 'VID_0019.MP4'])
  const docs = folder(root, 'Documents')
  files(docs, range, ['Notes.txt', 'Budget.xlsx', 'Letter.docx', 'Manual.pdf'])
  const tunes = folder(root, 'Music')
  camera(tunes, range, 6, (i) => `Track ${pad((i % 12) + 1)}.mp3`)
  settleFolderDates(nodes, now)
  return nodes
}

/** A plain data folder for an app we have no demo data for. */
export function seedAppFolder(appId: string, now = Date.now()): Record<string, FileNode> {
  const nodes: Record<string, FileNode> = {}
  const b = createBuilder(appId.length * 7919, nodes, `a${appId}-`)
  const root = b.folder('apps', appId)
  b.folder(root, 'config')
  b.folder(root, 'data')
  const logs = b.folder(root, 'logs')
  b.files(logs, [now - DAY, now], ['app.log'])
  settleFolderDates(nodes, now)
  return nodes
}
