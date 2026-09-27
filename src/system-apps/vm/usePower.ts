import { useCallback, useEffect, useRef, useState } from 'react'
import { BOOT_MS, type Power, type VmOs } from './types'

const SHUTDOWN_MS = 1600

/**
 * Remembers which guests are running in this browser session, so closing and
 * reopening the viewer doesn't reboot a VM (and a VM you shut down stays off).
 */
const session = new Map<string, boolean>()

export function usePower(appId: string, os: VmOs) {
  const [power, setPower] = useState<Power>(() => {
    const on = session.get(appId)
    return on === undefined ? 'starting' : on ? 'running' : 'off'
  })
  /** Bumped on every boot so the guest desktop starts fresh. */
  const [bootId, setBootId] = useState(0)
  const restarting = useRef(false)
  const current = useRef(power)

  useEffect(() => {
    current.current = power
    if (power === 'running') session.set(appId, true)
    if (power === 'off') session.set(appId, false)
    let timer: ReturnType<typeof setTimeout> | undefined
    if (power === 'starting') timer = setTimeout(() => setPower('running'), BOOT_MS[os])
    if (power === 'stopping') {
      timer = setTimeout(() => {
        const again = restarting.current
        restarting.current = false
        if (again) setBootId((n) => n + 1)
        setPower(again ? 'starting' : 'off')
      }, SHUTDOWN_MS)
    }
    return () => clearTimeout(timer)
  }, [power, appId, os])

  const start = useCallback(() => {
    if (current.current !== 'off') return
    setBootId((n) => n + 1)
    setPower('starting')
  }, [])

  const shutdown = useCallback(() => {
    const p = current.current
    restarting.current = false
    if (p === 'running' || p === 'starting') setPower('stopping')
  }, [])

  const restart = useCallback(() => {
    const p = current.current
    if (p === 'off') return start()
    restarting.current = true
    if (p !== 'stopping') setPower('stopping')
  }, [start])

  return { power, bootId, start, shutdown, restart }
}
