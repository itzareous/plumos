import { useEffect, useState } from 'react'
import { Logo } from '@/components/icons/Logo'
import { greeting } from '@/lib/greeting'
import { useSettings } from '@/stores/settings'

export function Greeting() {
  const userName = useSettings((s) => s.userName)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-on-wallpaper flex flex-col items-center text-center">
      <Logo size={60} className="text-white drop-shadow-[0_2px_8px_rgb(0_0_0/0.3)]" />
      <h1 className="mt-3 text-[clamp(30px,4.4vw,54px)] leading-[1.1] font-bold tracking-[-0.03em] text-white/95">
        {greeting(now)}
        {userName ? `, ${userName}.` : '.'}
      </h1>
    </div>
  )
}
