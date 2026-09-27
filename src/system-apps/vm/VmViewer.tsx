import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue } from 'motion/react'
import type { AppInfo } from '@/apps/types'
import { toast } from '@/stores/toasts'
import { AgentCursor } from './agent/AgentCursor'
import { AgentDrawer, AgentSidePanel } from './agent/AgentPanel'
import { buildPlan, defaultPlan } from './agent/plans'
import { useAgentRunner } from './agent/runner'
import { useAgent } from './agent/store'
import { AndroidPhone } from './android/AndroidPhone'
import { useMediaQuery } from './hooks'
import { LinuxDesktop } from './linux/LinuxDesktop'
import { Boot, Shutdown } from './screen/Boot'
import { OffOverlay } from './screen/OffOverlay'
import { ScreenStage } from './screen/ScreenStage'
import { Toolbar } from './toolbar/Toolbar'
import { SCREEN, type DeskBridge, type DesktopProps, type VmSpec } from './types'
import { usePower } from './usePower'
import { WinDesktop } from './windows/WinDesktop'

const DESKTOPS = { windows: WinDesktop, android: AndroidPhone, linux: LinuxDesktop }

/** The VM viewer: toolbar, the guest's screen and (optionally) the agent driving it. */
export function VmViewer({ app, spec }: { app: AppInfo; spec: VmSpec }) {
  const os = spec.os
  const { power, bootId, start, shutdown, restart } = usePower(app.id, os)
  const [cad, setCad] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const bridge = useRef<DeskBridge | null>(null)
  const wide = useMediaQuery('(min-width: 1280px)')
  const agentOn = useAgent((s) => s.enabled)
  const x = useMotionValue(SCREEN[os].w * 0.6)
  const y = useMotionValue(SCREEN[os].h * 0.55)

  // The agent belongs to this viewer: start clean, and stop when it closes.
  useEffect(() => {
    useAgent.getState().reset()
    return () => useAgent.getState().reset()
  }, [])
  useEffect(() => {
    if (power !== 'running') useAgent.getState().rewind()
  }, [power])

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement) && document.fullscreenElement === stageRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useAgentRunner({ os, power, screenRef, bridge, x, y })

  const setAgent = useCallback(
    (on: boolean) => {
      const store = useAgent.getState()
      if (!on) return store.disable()
      const plan = buildPlan(os, store.planId ?? defaultPlan(os), store.param)
      store.enable(defaultPlan(os), plan.task, `Connected to ${app.name}. Watch my cursor, or click inside to take over.`)
      if (power === 'off') start()
    },
    [os, app.name, power, start],
  )

  const takeover = useCallback(() => {
    const s = useAgent.getState()
    if (s.enabled && s.status === 'running') s.pause('You clicked inside the VM, so I paused. Press play to hand it back.')
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else stageRef.current?.requestFullscreen?.().catch(() => toast('Fullscreen isn’t available', { description: 'Your browser blocked it.' }))
  }

  const Desktop = DESKTOPS[os]
  const desktopProps: DesktopProps = { app, spec, cad, bridge, onShutdown: shutdown }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Toolbar
        app={app}
        spec={spec}
        power={power}
        agent={agentOn}
        actions={{ start, shutdown, restart, fullscreen: toggleFullscreen, cad: () => setCad((n) => n + 1), setAgent }}
      />
      <div className="relative flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
          <ScreenStage
            os={os}
            fullscreen={fullscreen}
            stageRef={stageRef}
            screenRef={screenRef}
            onUserPointer={takeover}
            overlay={
              power === 'off' && (
                <OffOverlay
                  name={app.name}
                  detail={`${spec.cpus} vCPU · ${spec.memoryGb} GB memory`}
                  onStart={start}
                />
              )
            }
          >
            <AnimatePresence>
              {power === 'starting' && (
                <motion.div key={`boot-${bootId}`} className="absolute inset-0" exit={{ opacity: 0, transition: { duration: 0.35 } }}>
                  <Boot os={os} spec={spec} />
                </motion.div>
              )}
              {power === 'stopping' && (
                <motion.div key="stopping" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Shutdown os={os} />
                </motion.div>
              )}
            </AnimatePresence>
            {power === 'running' && <Desktop key={`desk-${bootId}`} {...desktopProps} />}
            <AgentCursor x={x} y={y} visible={agentOn && power === 'running'} />
          </ScreenStage>
          {agentOn && !wide && (
            <AgentDrawer os={os} power={power} open={drawerOpen} onToggle={() => setDrawerOpen((o) => !o)} />
          )}
        </div>
        <AnimatePresence>
          {agentOn && wide && (
            <AgentSidePanel os={os} power={power} collapsed={panelCollapsed} onToggle={() => setPanelCollapsed((c) => !c)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
