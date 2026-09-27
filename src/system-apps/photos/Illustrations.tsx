import { motion } from 'motion/react'

const TILE_COLORS = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#ef4444', '#84cc16']

/** A phone with its camera roll, streaming photos up to the server. */
export function PhoneArt({ active }: { active: boolean }) {
  return (
    <svg width="148" height="150" viewBox="0 0 148 150" aria-hidden>
      <defs>
        <linearGradient id="pa-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3b46" />
          <stop offset="1" stopColor="#1d1e26" />
        </linearGradient>
      </defs>
      <rect x="34" y="14" width="80" height="132" rx="16" fill="url(#pa-body)" stroke="rgb(255 255 255 / 0.18)" />
      <rect x="40" y="20" width="68" height="120" rx="11" fill="#0d0e13" />
      <rect x="63" y="25" width="22" height="4" rx="2" fill="#23242d" />
      {Array.from({ length: 12 }, (_, i) => {
        const x = 44 + (i % 3) * 21
        const y = 36 + Math.floor(i / 3) * 21
        return (
          <motion.rect
            key={i}
            x={x}
            y={y}
            width={18}
            height={18}
            rx={3}
            fill={TILE_COLORS[i % TILE_COLORS.length]}
            initial={false}
            animate={active ? { opacity: [0.45, 1, 0.45] } : { opacity: 0.9 }}
            transition={active ? { duration: 1.6, repeat: Infinity, delay: i * 0.12 } : { duration: 0.3 }}
          />
        )
      })}
      <circle cx="118" cy="22" r="17" fill="var(--plumos-accent)" stroke="#16161d" strokeWidth="4" />
      <motion.path
        d="M118 30V15M111.5 20.5 118 14l6.5 6.5"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animate={active ? { y: [2, -2, 2] } : { y: 0 }}
        transition={active ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
    </svg>
  )
}

/** A chunky external hard drive with an activity light. */
export function DriveArt({ busy }: { busy: boolean }) {
  return (
    <svg width="132" height="104" viewBox="0 0 132 104" aria-hidden>
      <defs>
        <linearGradient id="da-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b4e5c" />
          <stop offset="1" stopColor="#262833" />
        </linearGradient>
        <linearGradient id="da-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6c7082" />
          <stop offset="1" stopColor="#3b3e4b" />
        </linearGradient>
      </defs>
      <path d="M18 34 66 14l48 20v38l-48 22-48-22z" fill="url(#da-body)" />
      <path d="M18 34 66 14l48 20-48 20z" fill="url(#da-top)" />
      <path d="M66 54v40" stroke="rgb(255 255 255 / 0.12)" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${34 + i * 6} ${45 + i * 3}v14`} stroke="rgb(0 0 0 / 0.35)" strokeWidth="2.4" strokeLinecap="round" />
      ))}
      <motion.circle
        cx="100"
        cy="66"
        r="3"
        fill={busy ? '#34d399' : '#93c5fd'}
        animate={busy ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
        transition={busy ? { duration: 0.5, repeat: Infinity } : undefined}
      />
      <path d="M66 94c0 6 6 8 14 8" stroke="#8b8fa3" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}
