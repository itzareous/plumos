import { useEffect, useRef, useState } from 'react'
import { Lock, RotateCw } from 'lucide-react'
import { LoadingBar } from '../../apps/LoadingBar'
import { useBrowserHistory } from '../../apps/useBrowserHistory'
import { navigate, urlOf } from '../../apps/webData'
import { WebPageView } from '../../apps/WebPages'
import { useBack } from '../phone'

/** A phone browser: address bar on top, pages below. Back goes back in history first. */
export function PhoneBrowser({ focus }: { focus: boolean }) {
  const h = useBrowserHistory()
  const [address, setAddress] = useState('')
  const [editing, setEditing] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAddress(h.page.kind === 'home' ? '' : urlOf(h.page))
    scroller.current?.scrollTo({ top: 0 })
  }, [h.navKey, h.page])

  useEffect(() => {
    if (focus) input.current?.focus({ preventScroll: true })
  }, [focus])

  useBack(() => {
    if (!h.canBack) return false
    h.back()
    return true
  })

  return (
    <div className="flex h-full flex-col bg-[#18191d]">
      <div className="flex h-14 shrink-0 items-center gap-2 px-3">
        <label className="flex h-11 flex-1 items-center gap-2.5 rounded-full bg-white/10 px-4">
          {!editing && h.page.kind !== 'home' && <Lock size={13} className="shrink-0 text-white/45" />}
          <input
            ref={input}
            data-agent="browser.address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={(e) => {
              setEditing(true)
              e.currentTarget.select()
            }}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && address.trim()) {
                h.go(navigate(address))
                e.currentTarget.blur()
              }
            }}
            placeholder="Search or type web address"
            aria-label="Address"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/45"
          />
        </label>
        <button type="button" aria-label="Reload" onClick={h.reload} className="flex size-10 items-center justify-center rounded-full text-white/75">
          <RotateCw size={18} className={h.loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <LoadingBar active={h.loading} loadKey={h.loadKey} />
        <div ref={scroller} data-agent="browser.page" className="scrollbar-none absolute inset-0 overflow-y-auto bg-white">
          <WebPageView page={h.page} onGo={h.go} compact />
        </div>
      </div>
    </div>
  )
}
