import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { About } from '../apps/About'
import { Browser } from '../apps/Browser'
import { Calculator } from '../apps/Calculator'
import { Files } from '../apps/Files'
import { nodeAt } from '../apps/fsData'
import { GLYPHS, type GuestApp } from '../apps/glyphs'
import { Tasks } from '../apps/Tasks'
import { TextDoc } from '../apps/TextDoc'
import { useBridge, useCaptureKey } from '../hooks'
import { SCREEN, type DesktopProps } from '../types'
import { useWindowManager, type AppDef, type Win, type WindowManager, type WorkArea } from '../wm/useWindowManager'
import { WindowFrame } from '../wm/WindowFrame'
import { DesktopIcons } from './DesktopIcons'
import { Launcher } from './Launcher'
import { Security, type SecurityScreen } from './Security'
import { TASKBAR_H, Taskbar } from './Taskbar'
import { WinWallpaper } from './Wallpaper'

const AREA: WorkArea = { w: SCREEN.windows.w, h: SCREEN.windows.h, top: 0, bottom: TASKBAR_H, left: 0 }
const DEFS: Partial<Record<GuestApp, AppDef>> = {
  notes: { w: 540, h: 420 },
  browser: { w: 860, h: 560 },
  files: { w: 700, h: 450 },
  calc: { w: 300, h: 440 },
  settings: { w: 440, h: 470 },
  tasks: { w: 500, h: 340 },
}

/** The desktop guest: wallpaper, icons, windows, a centred taskbar and a launcher. */
export function WinDesktop({ app, spec, cad, bridge, onShutdown }: DesktopProps) {
  const wm = useWindowManager(DEFS, AREA)
  const [launcher, setLauncher] = useState<null | 'menu' | 'search'>(null)
  const [security, setSecurity] = useState<SecurityScreen | null>(null)

  useEffect(() => {
    if (cad) setSecurity('options')
  }, [cad])

  const wmReset = wm.reset
  const reset = useCallback(() => {
    wmReset()
    setLauncher(null)
    setSecurity(null)
  }, [wmReset])
  useBridge(bridge, reset)

  useCaptureKey(
    launcher !== null,
    useCallback((e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setLauncher(null)
    }, []),
  )

  const openApp = (a: GuestApp) => {
    setLauncher(null)
    wm.open(a)
  }
  const openFile = (path: string) => {
    setLauncher(null)
    wm.open('notes', { file: path })
  }

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      onPointerDown={() => setLauncher(null)}
    >
      <WinWallpaper />
      <DesktopIcons onOpenApp={openApp} onOpenFile={openFile} />
      <AnimatePresence>
        {wm.wins.map((w) => (
          <WindowFrame key={w.id} win={w} wm={wm} active={w.id === wm.active} area={AREA} title={titleOf(w)} variant="win">
            <WindowBody win={w} wm={wm} spec={spec} name={app.name} onOpenFile={openFile} />
          </WindowFrame>
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {launcher && (
          <Launcher
            focusSearch={launcher === 'search'}
            onOpenApp={openApp}
            onOpenFile={openFile}
            onClose={() => setLauncher(null)}
            onShutdown={onShutdown}
          />
        )}
      </AnimatePresence>
      <Taskbar
        wm={wm}
        launcherOpen={launcher !== null}
        onLauncher={() => setLauncher((l) => (l ? null : 'menu'))}
        onSearch={() => setLauncher((l) => (l === 'search' ? null : 'search'))}
      />
      <AnimatePresence>
        {security && (
          <Security
            screen={security}
            onChange={setSecurity}
            onTasks={() => {
              setSecurity(null)
              wm.open('tasks')
            }}
            onSignOut={() => {
              wm.reset()
              setSecurity('signin')
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function fileName(w: Win) {
  return w.data?.file?.split('/').pop() ?? 'Untitled'
}

function titleOf(w: Win) {
  if (w.app === 'notes') return `${fileName(w)} — Notes`
  return GLYPHS[w.app].label
}

function WindowBody({
  win,
  wm,
  spec,
  name,
  onOpenFile,
}: {
  win: Win
  wm: WindowManager
  spec: DesktopProps['spec']
  name: string
  onOpenFile: (path: string) => void
}) {
  switch (win.app) {
    case 'notes': {
      const file = win.data?.file
      return (
        <TextDoc
          key={file ?? 'new'}
          mode="notes"
          fileName={fileName(win)}
          initial={file ? (nodeAt(file)?.content ?? '') : ''}
          placeholder="Start typing…"
        />
      )
    }
    case 'browser':
      return <Browser variant="win" />
    case 'files':
      return <Files variant="win" onOpenFile={onOpenFile} />
    case 'calc':
      return <Calculator layout="desk" />
    case 'settings':
      return <About spec={spec} name={name} />
    case 'tasks':
      return <Tasks wm={wm} />
    default:
      return null
  }
}
