import type { ReactNode } from 'react'
import { SectionTitle } from '@/components/ui/controls'
import { cn } from '@/lib/cn'

/** The content column of a settings section: a large title, then groups. */
export function Page({ title, description, children }: { title: ReactNode; description?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <header className="mb-7 pr-12">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-[560px] text-[14px] leading-relaxed text-white/55">{description}</p>}
      </header>
      <div className="flex flex-col gap-8">{children}</div>
    </div>
  )
}

/** A titled group of settings with an optional footnote underneath. */
export function Group({
  title,
  action,
  footer,
  children,
  className,
}: {
  title?: ReactNode
  action?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      {title && <SectionTitle action={action}>{title}</SectionTitle>}
      {children}
      {footer && <p className="mt-2.5 px-1 text-[12.5px] leading-relaxed text-white/45">{footer}</p>}
    </section>
  )
}

/** A soft status dot with a label. */
export function Status({ tone, children, className }: { tone: 'ok' | 'warn' | 'bad' | 'off'; children: ReactNode; className?: string }) {
  const colors = { ok: 'bg-emerald-400', warn: 'bg-amber-400', bad: 'bg-red-400', off: 'bg-white/30' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[12.5px] font-medium text-white/70', className)}>
      <span className={cn('size-1.5 rounded-full', colors[tone])} />
      {children}
    </span>
  )
}
