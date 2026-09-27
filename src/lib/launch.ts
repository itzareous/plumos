import type { AppInfo } from '@/apps/types'
import { appUrl, useApps } from '@/stores/apps'
import { useWindows } from '@/stores/windows'

/** Opens an installed app: VMs in the built-in viewer, web apps in a new tab. */
export function launchApp(app: AppInfo) {
  const { open } = useWindows.getState()
  if (app.kind === 'vm') {
    open('vm', { appId: app.id })
    return
  }
  const url = appUrl(app, useApps.getState().links)
  if (url) window.open(url, '_blank', 'noopener,noreferrer')
  else open('app-details', { appId: app.id })
}
