import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/controls'

/** A password input with a show/hide toggle and an inline error. */
export function PasswordField({
  label,
  error,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null; id: string }) {
  const [shown, setShown] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-white/70">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={shown ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          style={{ paddingRight: 44 }}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? 'Hide password' : 'Show password'}
          className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/50 transition outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {shown ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[12.5px] text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}

/** 0–4, from length and variety. Good enough to nudge people toward longer passwords. */
export function passwordScore(pw: string) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length
  if (kinds >= 2) score++
  if (kinds >= 3 && pw.length >= 10) score++
  return Math.min(4, Math.max(1, score))
}

const LEVELS = [
  { label: 'Too short', color: '#f87171' },
  { label: 'Weak', color: '#f87171' },
  { label: 'Okay', color: '#fbbf24' },
  { label: 'Good', color: '#34d399' },
  { label: 'Strong', color: '#34d399' },
]

export function StrengthMeter({ password }: { password: string }) {
  const score = password.length < 8 ? (password ? 0 : -1) : passwordScore(password)
  const level = score >= 0 ? LEVELS[score] : null
  return (
    <div className="mt-2 flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full bg-white/10 transition-colors duration-300"
            style={score >= i ? { background: level?.color } : undefined}
          />
        ))}
      </div>
      <span className="w-16 text-right text-[12px] font-medium text-white/55">{level?.label ?? ''}</span>
    </div>
  )
}
