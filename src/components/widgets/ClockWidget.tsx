import { useEffect, useState } from 'react'
import { WidgetFrame } from './WidgetFrame'

export function ClockWidget() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <WidgetFrame label="Clock">
      <div className="flex h-full flex-col justify-between">
        <div className="text-[13px] font-medium text-white/60">
          {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div className="text-[46px] leading-none font-bold tracking-tight tabular-nums">
          {now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
    </WidgetFrame>
  )
}
