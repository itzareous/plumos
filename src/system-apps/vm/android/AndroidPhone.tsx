import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Calculator } from '../apps/Calculator'
import { AppGlyph, GLYPHS } from '../apps/glyphs'
import { useBridge } from '../hooks'
import type { DesktopProps } from '../types'
import { PhoneBrowser } from './apps/Browser'
import { MessagesApp } from './apps/Messages'
import { NotesApp, SEED_NOTES, type PhoneNote } from './apps/Notes'
import { CalendarApp, CameraApp, ClockApp, DialerApp, MusicApp, PhotosApp, SettingsApp, WeatherApp } from './apps/SmallApps'
import { NavBar, PhoneWallpaper, StatusBar } from './Chrome'
import { HomeScreen } from './HomeScreen'
import { NAV_H, PhoneContext, STATUS_H, type PhoneApi, type PhoneApp } from './phone'

const NOTE_COLORS = ['#3b3526', '#263243', '#2f2940', '#253a33', '#3a2830']

/** The phone guest: home screen, full-screen apps, recents and three-button navigation. */
export function AndroidPhone({ spec, bridge }: DesktopProps) {
  const [open, setOpen] = useState<{ app: PhoneApp; focus: boolean } | null>(null)
  const [recents, setRecents] = useState<PhoneApp[]>([])
  const [overview, setOverview] = useState(false)
  const [notes, setNotes] = useState<PhoneNote[]>(SEED_NOTES)
  const backHandler = useRef<(() => boolean) | null>(null)

  const launch = useCallback((app: PhoneApp, focus = false) => {
    setOpen({ app, focus })
    setOverview(false)
    setRecents((r) => [app, ...r.filter((x) => x !== app)].slice(0, 6))
  }, [])
  const home = useCallback(() => {
    setOpen(null)
    setOverview(false)
  }, [])
  const back = useCallback(() => {
    if (overview) return setOverview(false)
    if (!open) return
    if (backHandler.current?.()) return
    setOpen(null)
  }, [overview, open])

  const reset = useCallback(() => {
    setOpen(null)
    setOverview(false)
    setRecents([])
    setNotes(SEED_NOTES)
  }, [])
  useBridge(bridge, reset)

  const api = useMemo<PhoneApi>(() => ({ launch: (a) => launch(a), back, home, backHandler }), [launch, back, home])

  const saveNote = (title: string, body: string) =>
    setNotes((ns) => [{ id: Date.now(), title, body, color: NOTE_COLORS[ns.length % NOTE_COLORS.length], fresh: true }, ...ns])

  const body = (app: PhoneApp, focus: boolean) => {
    switch (app) {
      case 'notes':
        return <NotesApp notes={notes} onSave={saveNote} />
      case 'messages':
        return <MessagesApp />
      case 'browser':
        return <PhoneBrowser focus={focus} />
      case 'calc':
        return <Calculator layout="phone" />
      case 'clock':
        return <ClockApp />
      case 'calendar':
        return <CalendarApp />
      case 'photos':
        return <PhotosApp />
      case 'weather':
        return <WeatherApp />
      case 'music':
        return <MusicApp />
      case 'settings':
        return <SettingsApp spec={spec} />
      case 'phone':
        return <DialerApp />
      case 'camera':
        return <CameraApp />
    }
  }

  return (
    <PhoneContext.Provider value={api}>
      <motion.div
        className="absolute inset-0 overflow-hidden bg-black text-white"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      >
        <PhoneWallpaper />
        <motion.div
          className="absolute inset-0"
          animate={{ scale: open || overview ? 0.94 : 1, opacity: open ? 0 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        >
          <HomeScreen onLaunch={(a, focus) => launch(a, focus)} />
        </motion.div>

        <AnimatePresence>
          {open && !overview && (
            <motion.div
              key={open.app}
              className="absolute inset-x-0 top-0 z-20 overflow-hidden bg-[#111214]"
              style={{ bottom: NAV_H, paddingTop: STATUS_H, transformOrigin: '50% 70%' }}
              initial={{ opacity: 0, scale: 0.86, borderRadius: 40 }}
              animate={{ opacity: 1, scale: 1, borderRadius: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            >
              {body(open.app, open.focus)}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {overview && <Overview apps={recents} onPick={(a) => launch(a)} onClear={() => (setRecents([]), setOverview(false))} />}
        </AnimatePresence>

        <StatusBar />
        <NavBar onBack={back} onHome={home} onRecents={() => setOverview((o) => !o)} />
      </motion.div>
    </PhoneContext.Provider>
  )
}

function Overview({ apps, onPick, onClear }: { apps: PhoneApp[]; onPick: (a: PhoneApp) => void; onClear: () => void }) {
  return (
    <motion.div
      className="absolute inset-x-0 top-0 z-30 flex flex-col bg-black/60 backdrop-blur-md"
      style={{ bottom: NAV_H, paddingTop: STATUS_H }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {apps.length ? (
        <>
          <div className="scrollbar-none flex flex-1 snap-x items-center gap-4 overflow-x-auto px-12">
            {apps.map((a) => (
              <button key={a} type="button" onClick={() => onPick(a)} className="flex shrink-0 snap-center flex-col items-center gap-3">
                <span className="flex items-center gap-2 text-[14px]">
                  <AppGlyph app={a} size={24} shape="circle" /> {GLYPHS[a].label}
                </span>
                <span className="flex h-[440px] w-[220px] items-center justify-center rounded-3xl bg-[#1b1c20] ring-1 ring-white/10">
                  <AppGlyph app={a} size={72} shape="circle" />
                </span>
              </button>
            ))}
          </div>
          <button type="button" onClick={onClear} className="mx-auto mb-6 rounded-full bg-white/15 px-5 py-2 text-[14px]">
            Clear all
          </button>
        </>
      ) : (
        <p className="m-auto text-[15px] text-white/60">No recent apps</p>
      )}
    </motion.div>
  )
}
