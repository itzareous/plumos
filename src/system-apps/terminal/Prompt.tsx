import { tone } from './ui'
import { cn } from '@/lib/cn'

/** `/home/milo/Documents` → `~/Documents`. */
export function displayPath(path: string, home: string) {
  if (path === home) return '~'
  if (path.startsWith(home + '/')) return '~' + path.slice(home.length)
  return path
}

/** `milo@plumos:~/Documents$ ` */
export function Prompt({ user, host, cwd, home }: { user: string; host: string; cwd: string; home: string }) {
  return (
    <span className="select-none">
      <span className={cn(tone.green, 'font-semibold')}>
        {user}@{host}
      </span>
      <span className={tone.dim}>:</span>
      <span className={cn(tone.blue, 'font-semibold')}>{displayPath(cwd, home)}</span>
      <span className={tone.muted}>$ </span>
    </span>
  )
}
