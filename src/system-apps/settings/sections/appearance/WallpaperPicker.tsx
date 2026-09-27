import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { wallpapers } from '@/lib/wallpapers'
import { cn } from '@/lib/cn'
import { useSettings } from '@/stores/settings'
import { useWallpaperUpload } from './useWallpaperUpload'
import { WallpaperTile } from './WallpaperTile'

export function WallpaperPicker() {
  const wallpaper = useSettings((s) => s.wallpaper)
  const customWallpaper = useSettings((s) => s.customWallpaper)
  const set = useSettings((s) => s.set)
  const { upload, busy } = useWallpaperUpload()
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void upload(file)
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
      {wallpapers.map((w) => (
        <WallpaperTile key={w.id} name={w.name} src={w.thumb} selected={wallpaper === w.id} onSelect={() => set({ wallpaper: w.id })} />
      ))}

      {customWallpaper && (
        <WallpaperTile
          name="Your photo"
          src={customWallpaper}
          selected={wallpaper === 'custom'}
          onSelect={() => set({ wallpaper: 'custom' })}
          accessory={
            <button
              type="button"
              aria-label="Remove your photo"
              title="Remove"
              onClick={() => set({ customWallpaper: null, wallpaper: wallpaper === 'custom' ? wallpapers[0].id : wallpaper })}
              className="absolute -top-2 -left-2 flex size-6 items-center justify-center rounded-full bg-[#2a2933] text-white/80 opacity-0 shadow-md ring-1 ring-white/15 transition group-hover:opacity-100 hover:bg-[#3a3944] hover:text-white focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/60 max-sm:opacity-100"
            >
              <X size={13} strokeWidth={2.6} />
            </button>
          }
        />
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={busy}
          className={cn(
            'flex aspect-[16/10] w-full flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed text-white/60 transition outline-none',
            'hover:border-white/40 hover:bg-white/[0.04] hover:text-white focus-visible:ring-2 focus-visible:ring-white/60',
            dragging ? 'border-accent bg-accent-soft text-white' : 'border-white/20',
          )}
        >
          {busy ? (
            <span className="size-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <>
              <ImagePlus size={22} />
              <span className="text-[12.5px] font-medium">{dragging ? 'Drop to use' : 'Upload your own'}</span>
            </>
          )}
        </button>
        <span className="px-0.5 text-[12.5px] text-white/40">JPEG, PNG or WebP</span>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void upload(file)
          }}
        />
      </div>
    </div>
  )
}
