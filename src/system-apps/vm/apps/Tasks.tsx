import { useEffect, useState } from 'react'
import { AppGlyph, GLYPHS } from './glyphs'
import type { WindowManager } from '../wm/useWindowManager'

const BACKGROUND = [
  { name: 'Desktop shell', mem: 142 },
  { name: 'Guest agent', mem: 38 },
  { name: 'Print spooler', mem: 12 },
]

/** A small task list: open windows with made-up CPU and memory, plus End task. */
export function Tasks({ wm }: { wm: WindowManager }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1200)
    return () => clearInterval(t)
  }, [])
  const cpu = (seed: number) => ((Math.sin(seed * 12.9 + tick * 0.9) + 1) * 3.2 + (seed % 3)).toFixed(1)
  const apps = wm.wins.filter((w) => w.app !== 'tasks')

  return (
    <div className="flex h-full flex-col bg-[#1f2026] text-[12px] text-white/85">
      <div className="grid grid-cols-[1fr_64px_80px_84px] border-b border-white/[0.06] px-4 py-2 text-[11px] text-white/45">
        <span>Name</span>
        <span className="text-right">CPU</span>
        <span className="text-right">Memory</span>
        <span />
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {apps.map((w, i) => (
          <div key={w.id} className="grid grid-cols-[1fr_64px_80px_84px] items-center px-4 py-1.5 tabular-nums hover:bg-white/[0.04]">
            <span className="flex items-center gap-2">
              <AppGlyph app={w.app} size={18} />
              {GLYPHS[w.app].label}
            </span>
            <span className="text-right">{cpu(i + 1)}%</span>
            <span className="text-right">{80 + ((i * 53) % 140)} MB</span>
            <span className="text-right">
              <button type="button" onClick={() => wm.close(w.id)} className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] hover:bg-white/20">
                End task
              </button>
            </span>
          </div>
        ))}
        <p className="px-4 pt-3 pb-1 text-[11px] text-white/40">Background</p>
        {BACKGROUND.map((p, i) => (
          <div key={p.name} className="grid grid-cols-[1fr_64px_80px_84px] px-4 py-1.5 text-white/60 tabular-nums">
            <span>{p.name}</span>
            <span className="text-right">{(Number(cpu(i + 7)) / 4).toFixed(1)}%</span>
            <span className="text-right">{p.mem} MB</span>
            <span />
          </div>
        ))}
      </div>
    </div>
  )
}
