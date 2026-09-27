import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export function WallpaperTile({
  name,
  src,
  selected,
  onSelect,
  accessory,
}: {
  name: string
  src: string
  selected: boolean
  onSelect: () => void
  accessory?: ReactNode
}) {
  return (
    <div className="group relative flex flex-col gap-2">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${name} wallpaper`}
        className={cn(
          'relative aspect-[16/10] w-full overflow-hidden rounded-[14px] bg-white/5 outline-none',
          'ring-offset-[3px] ring-offset-[#17161f] transition-[box-shadow,transform] duration-200 active:scale-[0.97]',
          selected ? 'ring-2 ring-white' : 'ring-1 ring-white/10 hover:ring-white/30 focus-visible:ring-2 focus-visible:ring-white/60',
        )}
      >
        <img src={src} alt="" draggable={false} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        {selected && (
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className="absolute right-2 bottom-2 flex size-6 items-center justify-center rounded-full bg-white text-black shadow-lg"
          >
            <Check size={14} strokeWidth={3} />
          </motion.span>
        )}
      </button>
      <span className={cn('truncate px-0.5 text-[12.5px] font-medium', selected ? 'text-white' : 'text-white/60')}>{name}</span>
      {accessory}
    </div>
  )
}
