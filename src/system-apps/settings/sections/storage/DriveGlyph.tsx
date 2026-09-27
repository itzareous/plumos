import type { Drive } from '@/stores/storage'

/** Small original drawings of each kind of drive. */
export function DriveGlyph({ kind, size = 40 }: { kind: Drive['kind']; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      {kind === 'nvme' && (
        <g>
          <rect x="4" y="14" width="32" height="12" rx="1.6" fill="#1f5a45" />
          <rect x="4" y="14" width="32" height="12" rx="1.6" fill="url(#pcb-sheen)" />
          <rect x="11" y="16.5" width="8" height="7" rx="1" fill="#15171c" />
          <rect x="21" y="16.5" width="8" height="7" rx="1" fill="#15171c" />
          <rect x="12.2" y="18" width="5.6" height="1" rx="0.5" fill="#fff" opacity="0.25" />
          <rect x="22.2" y="18" width="5.6" height="1" rx="0.5" fill="#fff" opacity="0.25" />
          <rect x="31" y="18" width="3" height="4" rx="0.6" fill="#15171c" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="4.8" y={15.6 + i * 1.9} width="3" height="1.1" rx="0.4" fill="#e7c36a" />
          ))}
          <circle cx="35" cy="20" r="1.4" fill="#0e0f13" />
          <defs>
            <linearGradient id="pcb-sheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
        </g>
      )}
      {(kind === 'hdd' || kind === 'ssd') && (
        <g>
          <rect x="8" y="5" width="24" height="30" rx="3" fill="url(#hdd-body)" />
          <rect x="8.5" y="5.5" width="23" height="29" rx="2.6" fill="none" stroke="#fff" strokeOpacity="0.25" />
          {kind === 'hdd' ? (
            <>
              <circle cx="20" cy="17" r="8.5" fill="url(#hdd-platter)" />
              <circle cx="20" cy="17" r="2" fill="#8d96a0" />
              <path d="M28 30 L22.5 19.5" stroke="#4a515b" strokeWidth="2" strokeLinecap="round" />
              <circle cx="28" cy="30" r="2" fill="#4a515b" />
            </>
          ) : (
            <>
              <rect x="11" y="10" width="18" height="12" rx="1.5" fill="#262a33" />
              <rect x="13" y="13" width="9" height="1.4" rx="0.7" fill="#fff" opacity="0.5" />
              <rect x="13" y="16" width="6" height="1.4" rx="0.7" fill="#fff" opacity="0.3" />
            </>
          )}
          <defs>
            <linearGradient id="hdd-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b9c1ca" />
              <stop offset="1" stopColor="#7d8793" />
            </linearGradient>
            <radialGradient id="hdd-platter" cx="0.4" cy="0.35" r="0.7">
              <stop offset="0" stopColor="#f4f7fa" />
              <stop offset="0.7" stopColor="#c9d0d8" />
              <stop offset="1" stopColor="#a8b1bb" />
            </radialGradient>
          </defs>
        </g>
      )}
      {kind === 'usb' && (
        <g>
          <path d="M20 31 C20 35 24 36 28 36" stroke="#6b7280" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="10" y="5" width="20" height="26" rx="5" fill="url(#usb-body)" />
          <rect x="10.5" y="5.5" width="19" height="25" rx="4.6" fill="none" stroke="#fff" strokeOpacity="0.18" />
          <circle cx="20" cy="25" r="1.3" fill="#34d399" />
          <defs>
            <linearGradient id="usb-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4b5160" />
              <stop offset="1" stopColor="#2a2e37" />
            </linearGradient>
          </defs>
        </g>
      )}
    </svg>
  )
}
