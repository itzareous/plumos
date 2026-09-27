import { Suspense, useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useWindows } from '@/stores/windows'
import { sheetRegistry } from '@/system-apps/registry'
import { cn } from '@/lib/cn'

/** Renders whichever built-in app is open as a sheet over the home screen. */
export function SheetHost() {
  const sheet = useWindows((s) => s.sheet)
  const close = useWindows((s) => s.close)

  useEffect(() => {
    if (!sheet) return
    const onKey = (e: KeyboardEvent) => {
      // Let inputs and open menus handle Escape first.
      if (e.key !== 'Escape' || e.defaultPrevented) return
      close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheet, close])

  const entry = sheet ? sheetRegistry[sheet.id] : null
  const Component = entry?.component

  return (
    <AnimatePresence>
      {sheet && Component && (
        <motion.div key="sheet-root" className="fixed inset-0 z-40">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.section
            key={sheet.id + JSON.stringify(sheet.params ?? {})}
            role="dialog"
            aria-modal="true"
            aria-label={entry.name}
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.6, transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } }}
            transition={{ type: 'spring', stiffness: 260, damping: 32, mass: 0.9 }}
            className={cn(
              'glass-dark absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[1280px] flex-col overflow-hidden',
              // Phones: full height (the dock hides). Larger screens: a floating panel that stops above the dock.
              'top-[max(env(safe-area-inset-top),12px)] rounded-t-[28px] sm:top-6 sm:bottom-[96px] sm:w-[calc(100%-48px)] sm:rounded-[28px]',
            )}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              title="Close (Esc)"
              className="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white active:scale-95"
            >
              <X size={18} />
            </button>
            <Suspense fallback={<SheetSpinner />}>
              <Component params={sheet.params ?? {}} />
            </Suspense>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SheetSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="size-7 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  )
}

/**
 * Standard layout for a sheet: large title, optional toolbar on the right,
 * and a scrolling body. Apps with their own layout (sidebar etc.) can skip it.
 */
export function SheetPage({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-6 pt-7 pb-5 pr-16 sm:px-10 sm:pt-9">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-tight font-bold tracking-tight sm:text-[34px]">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-white/55">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className={cn('scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 pb-10 sm:px-10', className)}>{children}</div>
    </div>
  )
}
