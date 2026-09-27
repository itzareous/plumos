import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import type { AppCategory } from '@/apps/types'
import { cn } from '@/lib/cn'
import { categoryLabel, categoryMeta, categoryOrder } from './data'
import { useNav } from './nav'

/** Horizontally scrolling category chips. The active one (if any) is highlighted. */
export function CategoryPills({
  active,
  wrap,
  className,
}: {
  active?: AppCategory
  /** Wrap onto several centred lines instead of scrolling sideways. */
  wrap?: boolean
  className?: string
}) {
  const nav = useNav()
  const ref = useRef<HTMLDivElement>(null)

  // Keep the active chip in view when a category page opens.
  useEffect(() => {
    if (!active) return
    const el = ref.current?.querySelector<HTMLElement>(`[data-cat="${active}"]`)
    el?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [active])

  return (
    <nav
      ref={ref}
      aria-label="Categories"
      className={cn(
        wrap
          ? 'flex flex-wrap justify-center gap-2'
          : 'scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 py-1 sm:-mx-10 sm:px-10 [mask-image:linear-gradient(90deg,transparent,black_20px,black_calc(100%-28px),transparent)]',
        className,
      )}
    >
      {categoryOrder.map((c) => {
        const meta = categoryMeta[c]
        const isActive = c === active
        return (
          <button
            key={c}
            type="button"
            data-cat={c}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => (isActive ? undefined : nav.go({ view: 'category', category: c }))}
            className={cn(
              'relative flex h-9 shrink-0 items-center gap-2 rounded-full pr-3.5 pl-1.5 text-[13.5px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/60',
              isActive ? 'text-black' : 'bg-white/[0.06] text-white/80 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.11] hover:text-white',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="store-category-pill"
                className="absolute inset-0 rounded-full bg-white"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span
              className="relative flex size-6 items-center justify-center rounded-full text-white"
              style={{ background: meta.tint }}
            >
              <meta.icon size={13} strokeWidth={2.4} />
            </span>
            <span className="relative">{categoryLabel(c)}</span>
          </button>
        )
      })}
    </nav>
  )
}
