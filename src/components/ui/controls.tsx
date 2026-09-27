import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }>(
  function Input({ className, icon, ...props }, ref) {
    return (
      <div className={cn('relative flex items-center', className)}>
        {icon && <span className="pointer-events-none absolute left-3.5 text-white/45">{icon}</span>}
        <input
          ref={ref}
          className={cn(
            'h-10 w-full rounded-xl bg-white/[0.07] px-3.5 text-sm text-white ring-1 ring-inset ring-white/10 outline-none placeholder:text-white/35 transition focus:bg-white/10 focus:ring-white/30',
            Boolean(icon) && 'pl-10',
          )}
          {...props}
        />
      </div>
    )
  },
)

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        checked ? 'bg-accent' : 'bg-white/15',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        className={cn('absolute top-[3px] size-5 rounded-full bg-white shadow', checked ? 'right-[3px]' : 'left-[3px]')}
      />
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex rounded-full bg-white/[0.07] p-1 ring-1 ring-inset ring-white/10', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors',
            value === o.value ? 'text-black' : 'text-white/70 hover:text-white',
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${options.map((x) => x.value).join('-')}`}
              className="absolute inset-0 rounded-full bg-white"
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative flex items-center gap-1.5">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export function ProgressBar({ value, className, color }: { value: number; className?: string; color?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/15', className)}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color ?? 'white' }}
        initial={false}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 24 }}
      />
    </div>
  )
}

/** A rounded group of rows, like an iOS settings list. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.08]', className)}>
      {children}
    </div>
  )
}

export function Row({
  icon,
  title,
  description,
  children,
  onClick,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  onClick?: () => void
  className?: string
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3.5 px-4 py-3 text-left [&+&]:border-t [&+&]:border-white/[0.06]',
        onClick && 'transition hover:bg-white/[0.05]',
        className,
      )}
    >
      {icon && <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/85">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-white">{title}</span>
        {description && <span className="mt-0.5 block text-[13px] text-white/50">{description}</span>}
      </span>
      {children}
    </Tag>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between px-1">
      <h3 className="text-[13px] font-semibold tracking-wide text-white/55 uppercase">{children}</h3>
      {action}
    </div>
  )
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80', className)}>
      {children}
    </span>
  )
}
