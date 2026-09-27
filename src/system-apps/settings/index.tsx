import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import type { SheetProps } from '../registry'
import { NavContext, isSectionId, type SectionId } from './lib/nav'
import { useMediaQuery } from './lib/useMediaQuery'
import { PhoneList } from './nav/PhoneList'
import { Sidebar } from './nav/Sidebar'
import { SECTIONS } from './sections'

export default function Settings({ params }: SheetProps) {
  const requested = isSectionId(params.section) ? params.section : null
  const [section, setSection] = useState<SectionId>(requested ?? 'account')
  // Phones show the list first unless a section was asked for.
  const [detail, setDetail] = useState(requested !== null)
  const wide = useMediaQuery('(min-width: 768px)')

  useEffect(() => {
    if (!requested) return
    setSection(requested)
    setDetail(true)
  }, [requested])

  const goTo = (id: SectionId) => {
    setSection(id)
    setDetail(true)
  }

  const Content = SECTIONS[section].component

  return (
    <NavContext.Provider value={goTo}>
      {wide ? (
        <div className="flex min-h-0 flex-1">
          <Sidebar active={section} onSelect={goTo} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              data-settings-content
              key={section}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-8 pt-9 pb-14 lg:px-12"
            >
              <Content />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        <PhoneLayout section={section} detail={detail} onSelect={goTo} onBack={() => setDetail(false)}>
          <Content />
        </PhoneLayout>
      )}
    </NavContext.Provider>
  )
}

const push = {
  enter: (back: boolean) => (back ? { x: '-28%', opacity: 0 } : { x: '100%', opacity: 1 }),
  center: { x: 0, opacity: 1 },
  exit: (back: boolean) => (back ? { x: '100%', opacity: 1 } : { x: '-28%', opacity: 0 }),
}

function PhoneLayout({
  section,
  detail,
  onSelect,
  onBack,
  children,
}: {
  section: SectionId
  detail: boolean
  onSelect: (id: SectionId) => void
  onBack: () => void
  children: ReactNode
}) {
  const back = !detail
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <AnimatePresence initial={false} custom={back}>
        <motion.div
          key={detail ? `detail-${section}` : 'list'}
          custom={back}
          variants={push}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 380, damping: 40, mass: 0.9 }}
          className="absolute inset-0 flex flex-col"
          style={{ zIndex: detail ? 2 : 1 }}
        >
          {detail ? (
            <>
              <div className="flex h-14 shrink-0 items-center px-2 pr-16">
                <button
                  type="button"
                  aria-label="Back to Settings"
                  onClick={onBack}
                  className="flex h-9 items-center gap-0.5 rounded-full pr-3 pl-1 text-[16px] font-medium text-accent transition outline-none hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <ChevronLeft size={24} strokeWidth={2.2} />
                  Settings
                </button>
              </div>
              <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 pt-1 pb-[max(env(safe-area-inset-bottom),40px)]">{children}</div>
            </>
          ) : (
            <PhoneList onSelect={onSelect} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
