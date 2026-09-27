import { useEffect, useRef } from 'react'
import { findApp } from '@/apps/catalog'
import { AppIcon } from '@/components/icons/AppIcon'
import { useApps } from '@/stores/apps'
import { toast } from '@/stores/toasts'

/** While the store is open, announce each app that finishes installing. */
export function useInstallToasts() {
  const installed = useApps((s) => s.installed)
  const previous = useRef(installed)

  useEffect(() => {
    const added = installed.filter((id) => !previous.current.includes(id))
    previous.current = installed
    for (const id of added) {
      const app = findApp(id)
      if (!app) continue
      toast(`${app.name} is ready`, {
        description: 'Installed and added to your home screen',
        icon: <AppIcon icon={app.icon} size={38} />,
      })
    }
  }, [installed])
}
