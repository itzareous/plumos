import { useCallback, useState } from 'react'
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
import { useWindowManager, type AppDef, type Win, type WorkArea } from '../wm/useWindowManager'
import { WindowFrame } from '../wm/WindowFrame'
import { AppGrid, DOCK_W, Dock, LinuxWallpaper, PANEL_H, TopPanel } from './Chrome'
import { Terminal } from './Terminal'

const AREA: WorkArea = { w: SCREEN.linux.w, h: SCREEN.linux.h, top: PANEL_H, bottom: 0, left: DOCK_W }
const DEFS: Partial<Record<GuestApp, AppDef>> = {
  terminal: { w: 640, h: 400 },
  editor: { w: 600, h: 440 },
  files: { w: 700, h: 450 },
  browser: { w: 860, h: 560 },
  calc: { w: 300, h: 440 },
  settings: { w: 440, h: 470 },
  tasks: { w: 500, h: 340 },
}

const fileName = (w: Win) => w.data?.file?.split('/').pop() ?? 'untitled.md'

function titleOf(w: Win) {
  if (w.app === 'editor') return `${fileName(w)} — Text Editor`
  if (w.app === 'terminal') return 'guest@plumos-vm: ~'
  return GLYPHS[w.app].label
}

/** The Linux-style guest: top panel, left dock, app grid and windows. */
export function LinuxDesktop({ app, spec, bridge, onShutdown }: DesktopProps) {
  const wm = useWindowManager(DEFS, AREA)
  const [grid, setGrid] = useState(false)
  const [bootAt] = useState(() => Date.now() - 60_000)

  const wmReset = wm.reset
  const reset = useCallback(() => {
    wmReset()
    setGrid(false)
  }, [wmReset])
  useBridge(bridge, reset)

  useCaptureKey(
    grid,
    useCallback((e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setGrid(false)
    }, []),
  )

  const open = (a: GuestApp) => {
    setGrid(false)
    wm.open(a)
  }
  const openFile = (path: string) => wm.open('editor', { file: path })

  const body = (w: Win) => {
    switch (w.app) {
      case 'terminal':
        return <Terminal spec={spec} bootAt={bootAt} onExit={() => wm.close(w.id)} />
      case 'editor': {
        const file = w.data?.file
        return (
          <TextDoc
            key={file ?? 'new'}
            mode="code"
            fileName={fileName(w)}
            initial={file ? (nodeAt(file)?.content ?? '') : ''}
            placeholder="Start typing…"
          />
        )
      }
      case 'files':
        return <Files variant="gnome" onOpenFile={openFile} />
      case 'browser':
        return <Browser variant="gnome" />
      case 'calc':
        return <Calculator layout="desk" />
      case 'settings':
        return <About spec={spec} name={app.name} />
      case 'tasks':
        return <Tasks wm={wm} />
      default:
        return null
    }
  }

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onPointerDown={() => setGrid(false)}
    >
      <LinuxWallpaper />
      <AnimatePresence>
        {wm.wins.map((w) => (
          <WindowFrame key={w.id} win={w} wm={wm} active={w.id === wm.active} area={AREA} title={titleOf(w)} variant="gnome">
            {body(w)}
          </WindowFrame>
        ))}
      </AnimatePresence>
      <AnimatePresence>{grid && <AppGrid onOpen={open} onClose={() => setGrid(false)} />}</AnimatePresence>
      <Dock wm={wm} onGrid={() => setGrid((g) => !g)} />
      <TopPanel onApps={() => setGrid((g) => !g)} onShutdown={onShutdown} onLogOut={reset} />
    </motion.div>
  )
}
