/** An abstract wallpaper of luminous ribbons, drawn for the desktop guest. */
export function WinWallpaper() {
  return (
    <svg viewBox="0 0 1152 720" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="vmw-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#081026" />
          <stop offset="0.55" stopColor="#141a4d" />
          <stop offset="1" stopColor="#090b1e" />
        </linearGradient>
        <radialGradient id="vmw-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#7c9cff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#7c9cff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vmw-r1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0" />
          <stop offset="0.35" stopColor="#38bdf8" />
          <stop offset="0.7" stopColor="#6366f1" />
          <stop offset="1" stopColor="#c084fc" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="vmw-r2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#f0abfc" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="vmw-r3" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5eead4" stopOpacity="0.15" />
          <stop offset="0.6" stopColor="#2dd4bf" stopOpacity="0.8" />
          <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <filter id="vmw-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="vmw-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <rect width="1152" height="720" fill="url(#vmw-bg)" />
      <ellipse cx="690" cy="330" rx="420" ry="260" fill="url(#vmw-glow)" />
      <g filter="url(#vmw-blur)" opacity="0.8">
        <path d="M-60 560C180 420 380 640 640 470S1010 220 1220 300V380C1010 330 860 520 640 560S200 560-60 650z" fill="url(#vmw-r1)" />
      </g>
      <g filter="url(#vmw-soft)">
        <path d="M-40 520C200 380 400 600 650 430S1030 190 1210 260L1210 290C1030 230 860 470 650 480S230 460-40 560z" fill="url(#vmw-r1)" opacity="0.9" />
        <path d="M-40 600C240 470 470 640 720 500S1060 330 1220 380L1220 420C1070 380 880 560 720 560S250 560-40 660z" fill="url(#vmw-r2)" opacity="0.75" />
        <path d="M120 140C360 260 560 120 760 220S1040 420 1200 360L1200 380C1030 460 880 280 760 262S360 320 120 170z" fill="url(#vmw-r3)" opacity="0.55" />
      </g>
      <path d="M-40 520C200 380 400 600 650 430S1030 190 1210 260" fill="none" stroke="#e0f2fe" strokeOpacity="0.5" strokeWidth="1.2" />
      <path d="M-40 600C240 470 470 640 720 500S1060 330 1220 380" fill="none" stroke="#f5d0fe" strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  )
}
