import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, CloudOff, Download, Info, Play, Star, X } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'
import { FolderIcon } from '@/components/icons/FolderIcon'
import { blobUrl, getBlob, hasBlob, type FileNode } from '@/stores/files'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/format'
import { kindLabel } from '../lib/kinds'
import { formatFileDate, hashString, itemsLabel, type FolderStats } from '../lib/tree'
import { FileIcon } from './FileIcon'
import { useEscapeLayer } from './Modal'
import { PhotoArt, photoIsPortrait } from './PhotoArt'
import { seedOf } from './Thumb'

interface QuickLookProps {
  node: FileNode | null
  list: FileNode[]
  stats: Map<string, FolderStats>
  displayName: (node: FileNode) => string
  onClose: () => void
  onNavigate: (id: string) => void
  onFavorite: (id: string) => void
  onInfo: (id: string) => void
  onDownload: (id: string) => void
}

/** Space-bar preview of a file, over everything. */
export function QuickLook(p: QuickLookProps) {
  const { node, list } = p
  useEscapeLayer(Boolean(node), p.onClose)
  const index = node ? list.findIndex((n) => n.id === node.id) : -1
  const prev = index > 0 ? list[index - 1] : null
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null

  useEffect(() => {
    if (!node) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'VIDEO' || tag === 'AUDIO' || tag === 'INPUT') return
      if (e.key === ' ') {
        e.preventDefault()
        p.onClose()
      } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && prev) {
        e.preventDefault()
        p.onNavigate(prev.id)
      } else if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && next) {
        e.preventDefault()
        p.onNavigate(next.id)
      }
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [node, prev, next, p])

  const size = node ? (node.kind === 'folder' ? (p.stats.get(node.id)?.bytes ?? 0) : node.size) : 0
  const meta = node
    ? [kindLabel(node.kind, node.name), node.kind === 'folder' ? itemsLabel(p.stats.get(node.id)?.count ?? 0) : null, formatBytes(size), formatFileDate(node.modified)]
        .filter(Boolean)
        .join(' · ')
    : ''

  return createPortal(
    <AnimatePresence>
      {node && (
        <motion.div
          key="quicklook"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview of ${p.displayName(node)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
          className="fixed inset-0 z-[60] flex flex-col bg-[rgb(8_8_12/0.78)] backdrop-blur-2xl"
        >
          <header className="flex shrink-0 items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 sm:px-6 sm:pt-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{p.displayName(node)}</p>
              <p className="truncate text-[12px] text-white/50 tabular-nums">{meta}</p>
            </div>
            {!node.trashed && (
              <IconButton label={node.favorite ? 'Remove from Favorites' : 'Add to Favorites'} onClick={() => p.onFavorite(node.id)}>
                <Star size={18} className={cn(node.favorite && 'fill-amber-300 text-amber-300')} />
              </IconButton>
            )}
            <IconButton label="Get info" onClick={() => p.onInfo(node.id)}>
              <Info size={18} />
            </IconButton>
            {node.uploaded && hasBlob(node.id) && (
              <IconButton label="Download" onClick={() => p.onDownload(node.id)}>
                <Download size={18} />
              </IconButton>
            )}
            <IconButton label="Close (Space)" onClick={p.onClose} className="bg-white/10">
              <X size={18} />
            </IconButton>
          </header>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-20">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                className="flex h-full w-full items-center justify-center"
              >
                <Preview node={node} size={size} stats={p.stats} name={p.displayName(node)} />
              </motion.div>
            </AnimatePresence>
            {prev && (
              <NavArrow side="left" label={`Previous: ${p.displayName(prev)}`} onClick={() => p.onNavigate(prev.id)} />
            )}
            {next && <NavArrow side="right" label={`Next: ${p.displayName(next)}`} onClick={() => p.onNavigate(next.id)} />}
          </div>
          {list.length > 1 && index >= 0 && (
            <p className="shrink-0 pb-[max(env(safe-area-inset-bottom),16px)] text-center text-[12px] text-white/40 tabular-nums">
              {index + 1} of {list.length}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function NavArrow({ side, label, onClick }: { side: 'left' | 'right'; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/10 backdrop-blur transition outline-none hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95 sm:flex',
        side === 'left' ? 'left-5' : 'right-5',
      )}
    >
      {side === 'left' ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
    </button>
  )
}

function Caption({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-[420px] text-center text-[13px] leading-relaxed text-white/50">{children}</p>
}

function Preview({ node, size, stats, name }: { node: FileNode; size: number; stats: Map<string, FolderStats>; name: string }) {
  const url = node.uploaded ? blobUrl(node.id) : undefined
  const missing = node.uploaded && !url

  if (node.kind === 'folder') {
    return (
      <IconCard art={<FolderIcon size={180} className="drop-shadow-[0_20px_40px_rgb(0_0_0/0.4)]" />} title={name}>
        {itemsLabel(stats.get(node.id)?.count ?? 0)} · {formatBytes(size)}
      </IconCard>
    )
  }

  if (missing) {
    return (
      <IconCard art={<FileIcon kind={node.kind} name={node.name} size={170} />} title={name}>
        <span className="inline-flex items-center gap-1.5">
          <CloudOff size={14} /> Preview unavailable
        </span>
        <Caption>This file was uploaded before the page reloaded. The demo keeps uploaded contents in memory only, so there's nothing left to show.</Caption>
      </IconCard>
    )
  }

  if (node.kind === 'image') {
    if (url) return <img src={url} alt={name} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" draggable={false} />
    return <GeneratedPhoto node={node} />
  }

  if (node.kind === 'video') {
    if (url) return <video src={url} controls autoPlay className="max-h-full max-w-full rounded-xl bg-black shadow-2xl" />
    return (
      <div className="flex max-h-full w-full flex-col items-center">
        <div className="relative w-full max-w-[880px]">
          <GeneratedPhoto node={node} />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-black/40 ring-1 ring-white/30 backdrop-blur-md">
              <Play size={26} fill="white" strokeWidth={0} className="ml-1" />
            </span>
          </span>
        </div>
        <Caption>A demo video — upload one of your own to watch it right here.</Caption>
      </div>
    )
  }

  if (node.kind === 'audio') return <AudioCard node={node} url={url} name={name} />

  if (node.kind === 'pdf' && url) return <iframe src={url} title={name} className="h-full w-full max-w-[900px] rounded-xl bg-white shadow-2xl" />

  if (node.kind === 'text' || node.kind === 'code') return <TextPreview node={node} name={name} size={size} />

  return (
    <IconCard art={<FileIcon kind={node.kind} name={node.name} size={180} />} title={name}>
      {kindLabel(node.kind, node.name)} · {formatBytes(size)}
    </IconCard>
  )
}

function IconCard({ art, title, children }: { art: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      {art}
      <p className="mt-6 max-w-[520px] text-[19px] font-semibold tracking-tight break-words">{title}</p>
      <div className="mt-1 flex flex-col items-center text-[13px] text-white/55 tabular-nums">{children}</div>
    </div>
  )
}

function GeneratedPhoto({ node }: { node: FileNode }) {
  const seed = seedOf(node)
  const portrait = photoIsPortrait(seed)
  return (
    <div
      className="overflow-hidden rounded-xl shadow-[0_30px_80px_-20px_rgb(0_0_0/0.7)] ring-1 ring-white/10"
      style={{ aspectRatio: portrait ? '3 / 4' : '4 / 3', height: portrait ? 'min(100%, 78vh)' : undefined, width: portrait ? undefined : 'min(100%, 880px, 100vh)' }}
    >
      <PhotoArt seed={seed} vintage={new Date(node.modified).getFullYear() < 2013} className="block h-full w-full" />
    </div>
  )
}

function AudioCard({ node, url, name }: { node: FileNode; url?: string; name: string }) {
  const seed = hashString(node.name)
  const bars = Array.from({ length: 48 }, (_, i) => 0.25 + Math.abs(Math.sin(seed * 0.001 + i * 0.55) * Math.cos(i * 0.17 + seed)) * 0.75)
  return (
    <div className="flex w-full max-w-[520px] flex-col items-center rounded-[28px] bg-white/[0.06] p-8 ring-1 ring-white/10">
      <div
        className="flex size-32 items-center justify-center rounded-[28px] shadow-2xl"
        style={{ background: `linear-gradient(135deg, hsl(${seed % 360} 80% 62%), hsl(${(seed + 70) % 360} 70% 45%))` }}
      >
        <FileIcon kind="audio" name="" size={70} />
      </div>
      <p className="mt-5 max-w-full truncate text-[17px] font-semibold">{name}</p>
      <div className="mt-5 flex h-12 w-full items-center gap-[3px]" aria-hidden>
        {bars.map((h, i) => (
          <span key={i} className="flex-1 rounded-full bg-white/35" style={{ height: `${h * 100}%` }} />
        ))}
      </div>
      {url ? (
        <audio src={url} controls autoPlay className="mt-5 w-full" />
      ) : (
        <Caption>A demo recording — upload your own audio to play it here.</Caption>
      )}
    </div>
  )
}

function TextPreview({ node, name, size }: { node: FileNode; name: string; size: number }) {
  const [text, setText] = useState<string | null>(node.content ?? null)
  const tooBig = node.uploaded && size > 400_000

  useEffect(() => {
    if (node.content || !node.uploaded || tooBig) return
    let alive = true
    getBlob(node.id)
      ?.text()
      .then((t) => alive && setText(t))
      .catch(() => alive && setText(null))
    return () => {
      alive = false
    }
  }, [node.id, node.content, node.uploaded, tooBig])

  if (text === null) {
    return (
      <IconCard art={<FileIcon kind={node.kind} name={node.name} size={180} />} title={name}>
        {kindLabel(node.kind, node.name)} · {formatBytes(size)}
        {tooBig && <Caption>This file is too large to preview.</Caption>}
      </IconCard>
    )
  }
  return (
    <pre
      className={cn(
        'selectable scrollbar-thin max-h-full w-full max-w-[780px] overflow-auto rounded-2xl bg-[#15151c] p-6 text-[13.5px] leading-relaxed whitespace-pre-wrap text-white/85 shadow-2xl ring-1 ring-white/10 sm:p-8',
        node.kind === 'code' ? 'font-mono text-[12.5px]' : 'font-sans',
      )}
    >
      {text}
    </pre>
  )
}
