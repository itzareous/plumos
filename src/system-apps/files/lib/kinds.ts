export type FileKind =
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'pdf'
  | 'spreadsheet'
  | 'archive'
  | 'code'
  | 'text'
  | 'other'

const BY_EXTENSION: Record<string, FileKind> = {}
const register = (kind: FileKind, list: string) => list.split(' ').forEach((ext) => (BY_EXTENSION[ext] = kind))

register('image', 'jpg jpeg png gif webp heic heif avif bmp svg tif tiff raw cr2 nef dng')
register('video', 'mp4 mov m4v mkv avi webm mts 3gp')
register('audio', 'mp3 m4a flac wav aac ogg opus aiff')
register('pdf', 'pdf')
register('spreadsheet', 'xlsx xls csv tsv ods numbers')
register('document', 'doc docx odt rtf pages ppt pptx odp key epub')
register('archive', 'zip tar gz tgz bz2 xz 7z rar dmg iso img zst')
register(
  'code',
  'js mjs ts tsx jsx py sh bash json yaml yml toml conf ini env html css scss go rs java kt c h cpp rb php sql lua swift',
)
register('text', 'txt md log nfo srt')

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : ''
}

/** The name without its extension, used to pre-select text when renaming. */
export function baseName(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

export function kindFromName(name: string, mime = ''): FileKind {
  const byExt = BY_EXTENSION[extensionOf(name)]
  if (byExt) return byExt
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('text/')) return 'text'
  if (mime === 'application/pdf') return 'pdf'
  return 'other'
}

const NOUN: Record<FileKind, string> = {
  folder: 'Folder',
  image: 'image',
  video: 'video',
  audio: 'audio',
  document: 'document',
  pdf: 'document',
  spreadsheet: 'spreadsheet',
  archive: 'archive',
  code: 'source file',
  text: 'text',
  other: 'file',
}

/** "JPG image", "PDF document", "Folder". */
export function kindLabel(kind: FileKind, name: string): string {
  if (kind === 'folder') return 'Folder'
  const ext = extensionOf(name)
  if (!ext) return kind === 'other' ? 'Document' : NOUN[kind][0].toUpperCase() + NOUN[kind].slice(1)
  return `${ext.toUpperCase()} ${NOUN[kind]}`
}

/** Colours for each type's icon: [main, soft]. */
export const KIND_COLORS: Record<FileKind, [string, string]> = {
  folder: ['#ffb057', '#ffd89c'],
  image: ['#22c3a6', '#b8f2e6'],
  video: ['#6d6af8', '#cfcffe'],
  audio: ['#f5569b', '#ffc9df'],
  document: ['#3d8bfd', '#c6dcff'],
  pdf: ['#f0473e', '#ffc8c4'],
  spreadsheet: ['#23b35c', '#bfeccf'],
  archive: ['#c28a3c', '#f1dcb9'],
  code: ['#9b6bf2', '#e0d1ff'],
  text: ['#8a94a6', '#dfe3ea'],
  other: ['#6b7486', '#d6dae2'],
}

/** Grouping order used when sorting by kind. */
export const KIND_ORDER: FileKind[] = [
  'folder',
  'image',
  'video',
  'audio',
  'pdf',
  'document',
  'spreadsheet',
  'text',
  'code',
  'archive',
  'other',
]
