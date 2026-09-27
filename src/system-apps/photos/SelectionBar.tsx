import type { MouseEvent, ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { FolderMinus, FolderPlus, Heart, RotateCcw, Trash2, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { plural } from './format'

function Action({ label, icon, onClick, danger, disabled }: { label: string; icon: ReactNode; onClick: (e: MouseEvent<HTMLButtonElement>) => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-10 items-center gap-2 rounded-full px-3 text-[13.5px] font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none disabled:opacity-35 active:scale-95',
        danger ? 'text-red-300 hover:bg-red-500/15' : 'text-white/90 hover:bg-white/10',
      )}
    >
      {icon}
      <span className="hidden whitespace-nowrap lg:inline">{label}</span>
    </button>
  )
}

/** Floating actions for the selected photos. */
export function SelectionBar({
  open,
  count,
  allFavorite,
  allShared,
  targetAlbum,
  inAlbum,
  onDone,
  onFavorite,
  onAddToAlbum,
  onAddToTarget,
  onRemoveFromAlbum,
  onShare,
  onDelete,
  bin,
}: {
  open: boolean
  count: number
  allFavorite: boolean
  allShared: boolean
  targetAlbum: string | null
  inAlbum: boolean
  onDone: () => void
  onFavorite: () => void
  onAddToAlbum: (e: MouseEvent<HTMLButtonElement>) => void
  onAddToTarget: () => void
  onRemoveFromAlbum: () => void
  onShare: () => void
  onDelete: () => void
  /** In Recently Deleted the only choices are to recover or to delete for good. */
  bin?: { onRecover: () => void; onPurge: () => void }
}) {
  const none = count === 0
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 460, damping: 34 }}
          className="glass-dark absolute bottom-[100px] left-1/2 z-30 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-1 rounded-full py-1.5 pr-1.5 pl-2 sm:bottom-[108px]"
          role="toolbar"
          aria-label="Selection"
        >
          <button
            type="button"
            onClick={onDone}
            aria-label="Cancel selection (Esc)"
            title="Cancel selection (Esc)"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-white/75 transition outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X size={18} />
          </button>
          <span className="min-w-[88px] px-1.5 text-[13.5px] font-semibold whitespace-nowrap tabular-nums" aria-live="polite">
            {none ? 'Select items' : `${plural(count, 'item')}`}
          </span>
          <span className="mx-1 h-6 w-px bg-white/10" />
          {bin ? (
            <>
              <Action label="Recover" disabled={none} onClick={bin.onRecover} icon={<RotateCcw size={18} />} />
              <Action label="Delete Permanently" danger disabled={none} onClick={bin.onPurge} icon={<Trash2 size={18} />} />
            </>
          ) : targetAlbum ? (
            <Button variant="primary" size="sm" disabled={none} onClick={onAddToTarget} className="mx-1 max-w-[220px]">
              <span className="truncate">Add to “{targetAlbum}”</span>
            </Button>
          ) : (
            <>
              <Action label={allFavorite ? 'Unfavorite' : 'Favorite'} disabled={none} onClick={onFavorite} icon={<Heart size={18} fill={allFavorite && !none ? 'currentColor' : 'none'} />} />
              <Action label="Add to Album" disabled={none} onClick={onAddToAlbum} icon={<FolderPlus size={18} />} />
              {inAlbum && <Action label="Remove from Album" disabled={none} onClick={onRemoveFromAlbum} icon={<FolderMinus size={18} />} />}
              <Action label={allShared ? 'Move to My Library' : 'Share with Family'} disabled={none} onClick={onShare} icon={<Users size={18} />} />
              <Action label="Delete" danger disabled={none} onClick={onDelete} icon={<Trash2 size={18} />} />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
