import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Clock, HardDriveDownload, Search, Star, Trash2, Upload, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FolderIcon } from '@/components/icons/FolderIcon'

type Kind = 'folder' | 'imported' | 'trash' | 'favorites' | 'recents' | 'search'

interface EmptyStateProps {
  kind: Kind
  query?: string
  where?: string
  canWrite?: boolean
  onUpload?: () => void
  onNewFolder?: () => void
  onClearSearch?: () => void
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-[84px] items-center justify-center rounded-[26px] bg-white/[0.06] text-white/55 ring-1 ring-inset ring-white/10">
      {children}
    </span>
  )
}

export function EmptyState({ kind, query, where, canWrite, onUpload, onNewFolder, onClearSearch }: EmptyStateProps) {
  const content: Record<Kind, { art: ReactNode; title: string; body: string }> = {
    folder: {
      art: <FolderIcon size={96} className="opacity-90 drop-shadow-[0_8px_24px_rgb(255_150_60/0.25)]" />,
      title: 'This folder is empty',
      body: canWrite ? 'Drag files or whole folders here from your computer, or upload them.' : 'Nothing in here yet.',
    },
    imported: {
      art: (
        <Badge>
          <HardDriveDownload size={36} strokeWidth={1.6} />
        </Badge>
      ),
      title: 'Nothing imported yet',
      body: 'Plug in an old drive — it appears under Locations, ready to bring everything home in one click.',
    },
    trash: {
      art: (
        <Badge>
          <Trash2 size={36} strokeWidth={1.6} />
        </Badge>
      ),
      title: 'Trash is empty',
      body: 'Things you delete wait here for 30 days, in case you change your mind.',
    },
    favorites: {
      art: (
        <Badge>
          <Star size={36} strokeWidth={1.6} />
        </Badge>
      ),
      title: 'No favorites yet',
      body: 'Right-click any file or folder and choose Add to Favorites to keep it one click away.',
    },
    recents: {
      art: (
        <Badge>
          <Clock size={36} strokeWidth={1.6} />
        </Badge>
      ),
      title: 'Nothing recent',
      body: 'Files you open, add or change will show up here.',
    },
    search: {
      art: (
        <Badge>
          <Search size={34} strokeWidth={1.6} />
        </Badge>
      ),
      title: `No results for “${query ?? ''}”`,
      body: `Nothing in ${where ?? 'this folder'} has a name like that. Check the spelling or try a shorter word.`,
    },
  }
  const c = content[kind]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="mx-auto flex max-w-[360px] flex-col items-center px-4 pt-[10vh] pb-10 text-center"
    >
      {c.art}
      <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{c.title}</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/50">{c.body}</p>
      {kind === 'folder' && canWrite && (
        <div className="mt-5 flex gap-2">
          <Button variant="primary" size="sm" icon={<Upload size={15} />} onClick={onUpload}>
            Upload
          </Button>
          <Button size="sm" icon={<FolderPlus size={15} />} onClick={onNewFolder}>
            New folder
          </Button>
        </div>
      )}
      {kind === 'search' && (
        <Button size="sm" className="mt-5" onClick={onClearSearch}>
          Clear search
        </Button>
      )}
    </motion.div>
  )
}
