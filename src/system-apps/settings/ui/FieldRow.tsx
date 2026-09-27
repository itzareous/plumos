import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * A settings row whose control needs room (a text field, a segmented control).
 * Side by side on wide screens, stacked on phones.
 */
export function FieldRow({
  label,
  description,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode
  description?: ReactNode
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 [&+&]:border-t [&+&]:border-white/[0.06]',
        className,
      )}
    >
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-white">
          {label}
        </label>
        {description && <div className="mt-0.5 text-[13px] leading-snug text-white/50">{description}</div>}
      </div>
      <div className="shrink-0 sm:max-w-[60%]">{children}</div>
    </div>
  )
}
