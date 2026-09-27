import { useMemo } from 'react'
import { findApp } from '@/apps/catalog'
import type { AppInfo } from '@/apps/types'
import { useApps } from '@/stores/apps'
import type { Sample } from '@/stores/system'
import { appProfile, appUsageAt } from '../lib/demo'

/** Samples of history shown in each row's sparkline. */
const TREND = 32

export interface AppRow {
  app: AppInfo
  /** Percent of the machine's CPU. */
  cpu: number
  /** Bytes. */
  memory: number
  /** Recent CPU samples, oldest first. */
  trend: number[]
}

/** Per-app usage for the installed apps, derived from the system history. */
export function useAppRows(history: Sample[], totalMemory: number): AppRow[] {
  // Select the raw id list (stable) and derive the apps here, rather than a fresh array per render.
  const installed = useApps((s) => s.installed)
  const apps = useMemo(() => installed.map(findApp).filter((a): a is AppInfo => Boolean(a)), [installed])
  const profiles = useMemo(() => apps.map(appProfile), [apps])

  return useMemo(() => {
    const usage = history.slice(-TREND).map((s) => appUsageAt(profiles, s, totalMemory))
    const now = usage[usage.length - 1]
    return apps.map((app, i) => ({
      app,
      cpu: now?.[i].cpu ?? 0,
      memory: now?.[i].memory ?? 0,
      trend: usage.map((u) => u[i].cpu),
    }))
  }, [apps, profiles, history, totalMemory])
}
