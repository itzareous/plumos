import { useState } from 'react'
import { Input } from '@/components/ui/controls'
import { useSettings } from '@/stores/settings'
import { FieldRow } from '../../ui/FieldRow'

/** Display name. Saves as you type, so the greeting on the home screen follows along. */
export function NameField() {
  const userName = useSettings((s) => s.userName)
  const set = useSettings((s) => s.set)
  const [draft, setDraft] = useState(userName)
  const [focused, setFocused] = useState(false)
  const value = focused ? draft : userName

  return (
    <FieldRow label="Display name" description="How Plumos greets you, and how others in your home see you." htmlFor="settings-name">
      <Input
        id="settings-name"
        value={value}
        maxLength={32}
        autoComplete="name"
        placeholder="Your name"
        className="w-full sm:w-[240px]"
        onFocus={() => {
          setDraft(userName)
          setFocused(true)
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setDraft(e.target.value)
          const next = e.target.value.trim()
          if (next) set({ userName: next })
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
    </FieldRow>
  )
}
