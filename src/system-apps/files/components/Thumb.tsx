import { memo, useId, useState } from 'react'
import { ArrowDown, FileText, Film, HardDriveDownload, Image as ImageIcon, Music2, Play, type LucideIcon } from 'lucide-react'
import { findApp } from '@/apps/catalog'
import { AppIcon } from '@/components/icons/AppIcon'
import { FolderIcon } from '@/components/icons/FolderIcon'
import { blobUrl, type FileNode } from '@/stores/files'
import { cn } from '@/lib/cn'
import { hashString } from '../lib/tree'
import { FileIcon } from './FileIcon'
import { PhotoArt, photoIsPortrait } from './PhotoArt'

const FOLDER_GLYPHS: Record<string, LucideIcon> = {
  Downloads: ArrowDown,
  Documents: FileText,
  Photos: ImageIcon,
  Videos: Film,
  Music: Music2,
  Imported: HardDriveDownload,
}

const APP_TINT: [string, string] = ['#a9bfd6', '#6f86a3']

/** Copies of a photo keep the same generated picture. */
export const seedOf = (node: FileNode) => hashString(`${node.name}:${node.size}`)

const isVintage = (node: FileNode) => new Date(node.modified).getFullYear() < 2013

/** A drawing of a small external drive. */
export function DriveArt({ size = 64, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b7280" />
          <stop offset="1" stopColor="#262b36" />
        </linearGradient>
        <filter id={`${id}s`} x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>
      <path d="M32 50v5.5a3 3 0 0 0 3 3h9" fill="none" stroke="#9aa3b2" strokeWidth="2.2" strokeLinecap="round" />
      <g filter={`url(#${id}s)`}>
        <rect x="7" y="13" width="50" height="37" rx="8" fill={`url(#${id}b)`} />
      </g>
      <rect x="7" y="13" width="50" height="37" rx="8" fill="none" stroke="#fff" strokeOpacity="0.18" />
      <rect x="9" y="15" width="46" height="9" rx="5" fill="#fff" opacity="0.1" />
      {[30, 34, 38].map((y) => (
        <rect key={y} x="14" y={y} width="20" height="1.6" rx="0.8" fill="#fff" opacity="0.14" />
      ))}
      <circle cx="48" cy="41" r="2" fill="#4ade80" />
      <circle cx="48" cy="41" r="4" fill="#4ade80" opacity="0.2" />
    </svg>
  )
}

function FolderThumb({ node, size }: { node: FileNode; size: number }) {
  if (node.parent === 'external') return <DriveArt size={size} />
  const app = node.parent === 'apps' ? findApp(node.name) : undefined
  const Glyph = node.parent === 'home' ? FOLDER_GLYPHS[node.name] : undefined
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <FolderIcon size={size} tint={app ? APP_TINT : undefined} className="drop-shadow-[0_2px_4px_rgb(0_0_0/0.25)]" />
      {Glyph && size >= 36 && (
        <Glyph
          size={size * 0.26}
          strokeWidth={2.4}
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: size * 0.46, color: 'rgb(150 70 10 / 0.5)' }}
        />
      )}
      {app && (
        <span className="absolute" style={{ right: size * 0.02, bottom: size * 0.1 }}>
          <AppIcon icon={app.icon} size={Math.max(12, size * 0.42)} />
        </span>
      )}
    </span>
  )
}

/** A photo-like frame around a real or generated image. */
function PhotoFrame({ node, size, url }: { node: FileNode; size: number; url?: string }) {
  const [broken, setBroken] = useState(false)
  const seed = seedOf(node)
  const portrait = photoIsPortrait(seed)
  const video = node.kind === 'video'
  const w = portrait ? size * 0.72 : size
  const h = portrait ? size : size * 0.75
  const small = size < 40
  // Files the browser can't decode get a plain type icon instead.
  if (url && broken) return <FileIcon kind={node.kind} name={node.name} size={size * 0.9} />
  return (
    <span
      className={cn(
        'relative inline-flex overflow-hidden bg-black/30 shadow-[0_2px_8px_rgb(0_0_0/0.35)] ring-1 ring-white/15',
        small ? 'rounded-[4px]' : 'rounded-[7px]',
      )}
      style={url ? { maxWidth: size, maxHeight: size } : { width: w, height: h }}
    >
      {url && !video && (
        <img src={url} alt="" draggable={false} onError={() => setBroken(true)} className="block max-h-full max-w-full object-contain" style={{ maxHeight: size, maxWidth: size }} />
      )}
      {url && video && (
        <video src={`${url}#t=0.1`} muted preload="metadata" onError={() => setBroken(true)} className="block object-cover" style={{ width: size, height: size * 0.62 }} />
      )}
      {!url && <PhotoArt seed={seed} vintage={isVintage(node)} className="block h-full w-full" />}
      {video && !small && (
        <span className="absolute bottom-1 left-1 flex size-[18px] items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
          <Play size={9} fill="white" strokeWidth={0} className="ml-px" />
        </span>
      )}
    </span>
  )
}

/** The picture for an item: folder art, a thumbnail, or a type icon. */
export const Thumb = memo(function Thumb({ node, size }: { node: FileNode; size: number }) {
  if (node.kind === 'folder') return <FolderThumb node={node} size={size} />
  if (node.kind === 'image' || node.kind === 'video') {
    if (node.uploaded) {
      const url = blobUrl(node.id)
      if (url) return <PhotoFrame node={node} size={size} url={url} />
      return <FileIcon kind={node.kind} name={node.name} size={size * 0.9} />
    }
    return <PhotoFrame node={node} size={size} />
  }
  return <FileIcon kind={node.kind} name={node.name} size={size * 0.9} />
})
