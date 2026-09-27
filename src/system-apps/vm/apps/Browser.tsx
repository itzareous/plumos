import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Lock, Plus, RotateCw, Star } from 'lucide-react'
import { cn } from '@/lib/cn'
import { LoadingBar } from './LoadingBar'
import { useBrowserHistory } from './useBrowserHistory'
import { navigate, titleOf, urlOf } from './webData'
import { WebPageView } from './WebPages'

/** The desktop guests' web browser: one tab, an address bar and made-up pages. */
export function Browser({ variant }: { variant: 'win' | 'gnome' }) {
  const h = useBrowserHistory()
  const [address, setAddress] = useState(urlOf(h.page))
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAddress(urlOf(h.page))
    scroller.current?.scrollTo({ top: 0 })
  }, [h.navKey, h.page])

  const navBtn = 'flex size-7 items-center justify-center rounded-md text-white/75 transition hover:bg-white/10 disabled:opacity-30 outline-none focus-visible:ring-2 focus-visible:ring-white/50'

  return (
    <div className="flex h-full flex-col bg-[#202228]">
      <div className={cn('flex h-9 shrink-0 items-end gap-1 px-2', variant === 'gnome' ? 'bg-[#2e2e34]' : 'bg-[#18191e]')}>
        <div className="flex h-8 max-w-[230px] min-w-0 items-center gap-2 rounded-t-lg bg-[#202228] px-3 text-[12px] text-white/85">
          <span className="size-3 shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500" />
          <span className="truncate">{titleOf(h.page)}</span>
        </div>
        <button type="button" aria-label="New tab" onClick={() => h.go({ kind: 'home' })} className={cn(navBtn, 'mb-1')}>
          <Plus size={14} />
        </button>
      </div>
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-black/30 px-2">
        <button type="button" aria-label="Back" data-agent="browser.back" disabled={!h.canBack} onClick={h.back} className={navBtn}>
          <ArrowLeft size={15} />
        </button>
        <button type="button" aria-label="Forward" disabled={!h.canForward} onClick={h.forward} className={navBtn}>
          <ArrowRight size={15} />
        </button>
        <button type="button" aria-label="Reload" onClick={h.reload} className={navBtn}>
          <RotateCw size={14} className={cn(h.loading && 'animate-spin')} />
        </button>
        <label className="mx-1 flex h-7 flex-1 items-center gap-2 rounded-full bg-black/30 px-3 ring-1 ring-white/[0.06] focus-within:ring-2 focus-within:ring-cyan-400/60">
          <Lock size={11} className="shrink-0 text-white/40" />
          <input
            data-agent="browser.address"
            value={address}
            aria-label="Address"
            spellCheck={false}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                h.go(navigate(address))
                e.currentTarget.blur()
              }
            }}
            className="h-full min-w-0 flex-1 bg-transparent text-[12px] text-white/85 outline-none"
          />
          <Star size={12} className="shrink-0 text-white/35" />
        </label>
      </div>
      <div className="relative min-h-0 flex-1">
        <LoadingBar active={h.loading} loadKey={h.loadKey} />
        <div ref={scroller} data-agent="browser.page" className="scrollbar-thin absolute inset-0 overflow-y-auto bg-white">
          <WebPageView page={h.page} onGo={h.go} />
        </div>
      </div>
    </div>
  )
}
