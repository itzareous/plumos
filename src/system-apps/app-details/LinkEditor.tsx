import { useEffect, useId, useRef, useState } from 'react'
import { Check, Link2, RotateCcw } from 'lucide-react'
import type { AppInfo } from '@/apps/types'
import { Button } from '@/components/ui/Button'
import { Badge, Card, Input, SectionTitle } from '@/components/ui/controls'
import { appUrl, useApps } from '@/stores/apps'
import { toast } from '@/stores/toasts'

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname)
  } catch {
    return false
  }
}

/** Edit the address an app opens at, with Save and Reset to default. */
export function LinkEditor({ app, autoFocus }: { app: AppInfo; autoFocus: boolean }) {
  const links = useApps((s) => s.links)
  const setLink = useApps((s) => s.setLink)
  const custom = links[app.id]
  const defaultUrl = appUrl(app, {})
  const current = appUrl(app, links) ?? ''
  const [value, setValue] = useState(current)
  const [touched, setTouched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const hintId = useId()

  // Pick up changes made elsewhere (another tab, or Reset).
  useEffect(() => setValue(current), [current])

  useEffect(() => {
    if (!autoFocus) return
    // Wait for the sheet's slide-up so the focus ring lands in place.
    const t = setTimeout(() => {
      const el = inputRef.current
      if (!el) return
      el.focus({ preventScroll: true })
      el.select()
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 420)
    return () => clearTimeout(t)
  }, [autoFocus])

  const trimmed = value.trim()
  const dirty = trimmed !== current
  const valid = isValidUrl(trimmed)
  const showError = touched && dirty && trimmed.length > 0 && !valid

  const save = () => {
    setTouched(true)
    if (!dirty || !valid) return
    setLink(app.id, trimmed === defaultUrl ? null : trimmed)
    toast('Link saved', { description: `${app.name} now opens ${trimmed}` })
  }

  const reset = () => {
    setLink(app.id, null)
    setValue(defaultUrl ?? '')
    setTouched(false)
    toast('Link reset', { description: defaultUrl ? `Back to ${defaultUrl}` : undefined })
  }

  return (
    <section>
      <SectionTitle action={custom ? <Badge className="bg-accent-soft text-white">Custom</Badge> : undefined}>
        Link
      </SectionTitle>
      <Card className="p-4">
        <label htmlFor={inputId} className="block text-[13px] text-white/60">
          The address Plumos opens when you open {app.name}
        </label>
        <form
          className="mt-2.5 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <Input
            ref={inputRef}
            id={inputId}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && dirty) {
                e.preventDefault()
                setValue(current)
                setTouched(false)
              }
            }}
            icon={<Link2 size={16} />}
            placeholder="https://"
            inputMode="url"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-invalid={showError}
            aria-describedby={hintId}
            className="min-w-0 flex-1 font-mono [&_input]:text-[13.5px]"
          />
          <Button type="submit" variant="primary" disabled={!dirty || !valid} icon={<Check size={16} />}>
            Save
          </Button>
        </form>
        <p id={hintId} className="mt-2 text-[12.5px] text-white/45" aria-live="polite">
          {showError ? (
            <span className="text-red-300">Enter a full address that starts with http:// or https://</span>
          ) : dirty ? (
            'Press Enter to save, or Escape to undo.'
          ) : custom ? (
            'You’re using a custom address.'
          ) : (
            'Change it if you reach this app through a domain or a different port.'
          )}
        </p>
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
          <span className="min-w-0 truncate text-[12.5px] text-white/45">
            Default: <span className="font-mono text-white/60">{defaultUrl ?? 'none'}</span>
          </span>
          <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} disabled={!custom} onClick={reset}>
            Reset to default
          </Button>
        </div>
      </Card>
    </section>
  )
}
