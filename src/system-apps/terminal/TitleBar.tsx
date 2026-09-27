import type { MouseEvent } from 'react'
import { AArrowDown, AArrowUp, Eraser } from 'lucide-react'
import { IconButton } from '@/components/ui/Button'

/** Slim bar across the top: tools on the left, the session name centred. */
export function TitleBar({
  title,
  onClear,
  onSmaller,
  onLarger,
}: {
  title: string
  onClear: () => void
  onSmaller?: () => void
  onLarger?: () => void
}) {
  // Buttons don't steal focus from the prompt.
  const keepFocus = (e: MouseEvent) => e.preventDefault()
  return (
    <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/[0.07] px-3 pt-4 pb-2 font-sans sm:px-4">
      <div className="flex items-center gap-0.5">
        <IconButton
          label="Clear screen (Ctrl+L)"
          onClick={onClear}
          onMouseDown={keepFocus}
          className="size-8 text-white/60"
        >
          <Eraser size={16} />
        </IconButton>
        <IconButton
          label="Smaller text"
          onClick={onSmaller}
          onMouseDown={keepFocus}
          disabled={!onSmaller}
          className="size-8 text-white/60 disabled:opacity-30"
        >
          <AArrowDown size={17} />
        </IconButton>
        <IconButton
          label="Larger text"
          onClick={onLarger}
          onMouseDown={keepFocus}
          disabled={!onLarger}
          className="size-8 text-white/60 disabled:opacity-30"
        >
          <AArrowUp size={17} />
        </IconButton>
      </div>
      <div className="flex h-9 min-w-0 items-center gap-2 text-[13px] font-medium text-white/75">
        <span className="relative flex size-2 shrink-0" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-[#6ee7a0]/60 [animation-duration:2.4s]" />
          <span className="relative size-2 rounded-full bg-[#6ee7a0]" />
        </span>
        <span className="truncate">{title}</span>
        <span className="shrink-0 text-white/40">— ssh</span>
      </div>
      {/* Keeps the title centred and the sheet's close button clear. */}
      <div className="min-w-[52px]" />
    </header>
  )
}
