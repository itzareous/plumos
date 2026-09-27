import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * A titled, horizontally scrolling row. Children are laid out in a grid that
 * flows sideways; `rows` stacks them two (or more) high.
 */
export function Shelf({
  title,
  subtitle,
  action,
  rows = 1,
  itemWidth = 'min(84vw, 340px)',
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  rows?: number
  itemWidth?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () =>
      setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 })
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  const page = (dir: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  return (
    <section className="mt-9 first:mt-0">
      <div className="mb-3.5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] sm:text-[22px]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13.5px] text-white/50">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {action}
          <div className="ml-1 hidden items-center gap-1 sm:flex">
            <ArrowButton label="Scroll left" disabled={edges.start} onClick={() => page(-1)}>
              <ChevronLeft size={17} />
            </ArrowButton>
            <ArrowButton label="Scroll right" disabled={edges.end} onClick={() => page(1)}>
              <ChevronRight size={17} />
            </ArrowButton>
          </div>
        </div>
      </div>
      <div
        ref={ref}
        className={cn(
          'scrollbar-none -mx-5 grid snap-x snap-mandatory scroll-px-5 auto-cols-max grid-flow-col gap-3 overflow-x-auto px-5 pb-1 sm:-mx-10 sm:scroll-px-10 sm:px-10',
          '[&>*]:w-[var(--item-w)] [&>*]:snap-start',
        )}
        style={{ gridTemplateRows: `repeat(${rows}, auto)`, '--item-w': itemWidth } as CSSProperties}
      >
        {children}
      </div>
    </section>
  )
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full bg-white/[0.07] text-white/80 transition outline-none hover:bg-white/[0.14] hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

export function SeeAll({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-2.5 py-1 text-[13.5px] font-medium text-white/60 transition outline-none hover:bg-white/[0.07] hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
    >
      See all
    </button>
  )
}
