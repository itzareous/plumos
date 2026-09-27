import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { findApp } from '@/apps/catalog'
import { AppIcon } from '@/components/icons/AppIcon'

/** An app icon placed on the 520×300 art stage, bobbing gently. */
function FloatIcon({ id, x, y, size, delay = 0, tilt = 0 }: { id: string; x: number; y: number; size: number; delay?: number; tilt?: number }) {
  const app = findApp(id)
  if (!app) return null
  return (
    <motion.div
      className="absolute"
      style={{ left: x, top: y, rotate: tilt }}
      animate={{ y: [0, -7, 0] }}
      transition={{ duration: 5 + (delay % 3), repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <AppIcon icon={app.icon} size={size} className="shadow-[0_18px_40px_-12px_rgb(0_0_0/0.55)]" />
    </motion.div>
  )
}

function Stage({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 right-0 h-[300px] w-[520px] origin-top-right max-sm:right-1/2 max-sm:translate-x-1/2 max-sm:origin-top max-sm:scale-[0.74] lg:right-6"
    >
      {children}
    </div>
  )
}

function Sparkle({ x, y, s = 10, o = 0.85 }: { x: number; y: number; s?: number; o?: number }) {
  return (
    <path
      d={`M${x} ${y - s} C${x + s * 0.12} ${y - s * 0.12} ${x + s * 0.12} ${y - s * 0.12} ${x + s} ${y} C${x + s * 0.12} ${y + s * 0.12} ${x + s * 0.12} ${y + s * 0.12} ${x} ${y + s} C${x - s * 0.12} ${y + s * 0.12} ${x - s * 0.12} ${y + s * 0.12} ${x - s} ${y} C${x - s * 0.12} ${y - s * 0.12} ${x - s * 0.12} ${y - s * 0.12} ${x} ${y - s}Z`}
      fill="white"
      fillOpacity={o}
    />
  )
}

export function AiArt() {
  return (
    <Stage>
      <svg className="absolute inset-0" width="520" height="300" viewBox="0 0 520 300">
        <ellipse cx="300" cy="152" rx="112" ry="64" fill="none" stroke="white" strokeOpacity="0.2" />
        <ellipse cx="300" cy="152" rx="185" ry="106" fill="none" stroke="white" strokeOpacity="0.13" strokeDasharray="2 6" />
        <ellipse cx="300" cy="152" rx="262" ry="148" fill="none" stroke="white" strokeOpacity="0.07" />
        <Sparkle x={196} y={70} s={9} />
        <Sparkle x={452} y={150} s={7} o={0.7} />
        <Sparkle x={380} y={262} s={5} o={0.6} />
        <Sparkle x={140} y={250} s={6} o={0.5} />
      </svg>
      <div className="absolute top-[70px] left-[218px] size-[164px] rounded-full bg-[radial-gradient(circle,rgb(216_180_254/0.55),transparent_68%)] blur-md" />
      <FloatIcon id="ollama" x={252} y={104} size={96} delay={0} />
      <FloatIcon id="open-webui" x={146} y={48} size={60} delay={0.8} tilt={-6} />
      <FloatIcon id="hermes-agent" x={396} y={34} size={64} delay={1.6} tilt={5} />
      <FloatIcon id="comfyui" x={412} y={176} size={56} delay={2.2} tilt={4} />
      <FloatIcon id="whisper" x={104} y={172} size={48} delay={1.2} tilt={-4} />
      <FloatIcon id="librechat" x={300} y={232} size={44} delay={2.8} />
      <motion.div
        className="glass-dark absolute top-[88px] left-[372px] flex h-[30px] items-center gap-1 rounded-[15px] rounded-bl-[5px] px-3"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-[6px] rounded-full bg-white"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </motion.div>
    </Stage>
  )
}

function Poster({ x, y, rotate, from, to, children }: { x: number; y: number; rotate: number; from: string; to: string; children?: ReactNode }) {
  return (
    <div
      className="absolute h-[138px] w-[96px] overflow-hidden rounded-[12px] shadow-[0_20px_40px_-12px_rgb(0_0_0/0.55)] ring-1 ring-white/20"
      style={{ left: x, top: y, rotate: `${rotate}deg`, background: `linear-gradient(160deg, ${from}, ${to})` }}
    >
      <svg viewBox="0 0 96 138" className="absolute inset-0">
        {children}
        <rect x="10" y="112" width="52" height="5" rx="2.5" fill="white" fillOpacity="0.75" />
        <rect x="10" y="122" width="32" height="4" rx="2" fill="white" fillOpacity="0.4" />
      </svg>
    </div>
  )
}

export function MediaArt() {
  return (
    <Stage>
      <svg
        className="absolute inset-0 [mask-image:linear-gradient(90deg,transparent,black_28%,black_85%,transparent)]"
        width="520" height="300" viewBox="0 0 520 300">
        <g transform="rotate(-16 260 150)">
          <rect x="-40" y="118" width="620" height="64" fill="#1a0b14" fillOpacity="0.45" />
          {Array.from({ length: 30 }, (_, i) => (
            <g key={i}>
              <rect x={-36 + i * 21} y="123" width="9" height="7" rx="1.5" fill="white" fillOpacity="0.35" />
              <rect x={-36 + i * 21} y="170" width="9" height="7" rx="1.5" fill="white" fillOpacity="0.35" />
            </g>
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={-30 + i * 64} y="134" width="56" height="32" rx="3" fill="white" fillOpacity={0.06 + (i % 3) * 0.04} />
          ))}
        </g>
      </svg>
      <Poster x={206} y={58} rotate={-12} from="#7c3aed" to="#1e1b4b">
        <circle cx="62" cy="36" r="14" fill="#fde68a" fillOpacity="0.9" />
        <path d="M0 100 L30 62 L52 84 L70 66 L96 96 V138 H0Z" fill="#0b0b1a" fillOpacity="0.55" />
      </Poster>
      <Poster x={320} y={50} rotate={10} from="#22d3ee" to="#0c4a6e">
        <circle cx="48" cy="52" r="26" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="5" />
        <circle cx="48" cy="52" r="10" fill="white" fillOpacity="0.6" />
      </Poster>
      <Poster x={262} y={36} rotate={-1} from="#fb7185" to="#7c2d12">
        <path d="M18 92 Q48 20 78 92Z" fill="#fde68a" fillOpacity="0.85" />
        <circle cx="48" cy="46" r="8" fill="white" fillOpacity="0.9" />
      </Poster>
      <FloatIcon id="jellyfin" x={268} y={168} size={84} delay={0} />
      <FloatIcon id="plex" x={124} y={46} size={58} delay={1} tilt={-6} />
      <FloatIcon id="navidrome" x={446} y={54} size={52} delay={1.8} tilt={6} />
      <FloatIcon id="audiobookshelf" x={432} y={196} size={54} delay={2.4} tilt={-3} />
      <FloatIcon id="kavita" x={126} y={190} size={48} delay={1.4} tilt={5} />
      <div className="absolute top-[134px] left-[176px] flex h-[34px] items-end gap-[3px]">
        {[0.5, 0.9, 0.65, 1, 0.4].map((h, i) => (
          <motion.span
            key={i}
            className="w-[4px] origin-bottom rounded-full bg-white/85"
            style={{ height: 34 }}
            animate={{ scaleY: [h, h * 0.35 + 0.15, h] }}
            transition={{ duration: 0.9 + i * 0.13, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </Stage>
  )
}

function BrowserWindow({
  x,
  y,
  w,
  h,
  children,
  light,
}: {
  x: number
  y: number
  w: number
  h: number
  children: ReactNode
  light?: boolean
}) {
  return (
    <div
      className="absolute overflow-hidden rounded-[14px] shadow-[0_24px_60px_-16px_rgb(0_0_0/0.6)] ring-1 ring-white/20"
      style={{ left: x, top: y, width: w, height: h, background: light ? 'rgb(244 246 250 / 0.95)' : 'rgb(14 18 28 / 0.82)' }}
    >
      <div className={`flex h-[22px] items-center gap-1.5 px-2.5 ${light ? 'bg-black/[0.06]' : 'bg-white/[0.07]'}`}>
        <span className={`h-[12px] w-[64px] rounded-t-[6px] ${light ? 'bg-white' : 'bg-white/10'}`} />
        <span className={`h-[5px] w-[30px] rounded-full ${light ? 'bg-black/15' : 'bg-white/20'}`} />
      </div>
      <div className="relative flex h-[calc(100%-22px)] items-center justify-center">{children}</div>
    </div>
  )
}

function StageIcon({ id, size }: { id: string; size: number }) {
  const app = findApp(id)
  return app ? <AppIcon icon={app.icon} size={size} /> : null
}

export function VmArt() {
  return (
    <Stage>
      <BrowserWindow x={60} y={70} w={210} h={150}>
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#1d5fae,#0b2a57)]" />
        <div className="relative">
          <StageIcon id="windows" size={64} />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[16px] bg-black/40" />
      </BrowserWindow>
      <BrowserWindow x={200} y={26} w={220} h={156} light>
        <div className="absolute inset-y-0 left-0 w-[26px] bg-[#2b2238]" />
        <div className="relative ml-[26px]">
          <StageIcon id="ubuntu-desktop" size={70} />
        </div>
      </BrowserWindow>
      <div className="absolute top-[118px] left-[404px] h-[150px] w-[80px] overflow-hidden rounded-[18px] bg-[#0d1a12] p-[5px] shadow-[0_24px_50px_-14px_rgb(0_0_0/0.6)] ring-1 ring-white/25">
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(170deg,#1f7a3a,#0d2415)]">
          <StageIcon id="android" size={44} />
          <span className="h-[4px] w-[34px] rounded-full bg-white/40" />
        </div>
      </div>
      <FloatIcon id="debian" x={120} y={224} size={50} delay={1.4} tilt={-6} />
      <motion.div
        className="absolute top-0 left-0"
        animate={{ x: [150, 300, 440, 300, 150], y: [150, 110, 190, 110, 150] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="22" height="26" viewBox="0 0 22 26" className="drop-shadow-[0_3px_6px_rgb(0_0_0/0.5)]">
          <path d="M2 2 L2 21 L7 16.5 L10.5 24 L14 22.5 L10.5 15 L18 15 Z" fill="white" stroke="#111" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <span className="absolute top-[20px] left-[14px] rounded-full bg-[#8b5cf6] px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white shadow-lg">
          Agent
        </span>
      </motion.div>
    </Stage>
  )
}
