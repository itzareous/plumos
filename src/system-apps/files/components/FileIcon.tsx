import { useId, type ReactNode } from 'react'
import { extensionOf, KIND_COLORS, type FileKind } from '../lib/kinds'

/**
 * A sheet of paper with a folded corner, a glyph for its type and, at larger
 * sizes, a little label with the file extension. Original artwork.
 */
export function FileIcon({ kind, name, size = 64, className }: { kind: FileKind; name: string; size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const [main, soft] = KIND_COLORS[kind]
  const ext = extensionOf(name).slice(0, 4).toUpperCase()
  const showLabel = size >= 44 && ext.length > 0
  const height = size
  const width = (size * 48) / 60
  return (
    <svg width={width} height={height} viewBox="0 0 48 60" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6e9f0" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={soft} />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <filter id={`${id}s`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="#000" floodOpacity="0.28" />
        </filter>
      </defs>
      <g filter={`url(#${id}s)`}>
        <path d="M8 2h22.5L45 16.5V53a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" fill={`url(#${id}p)`} />
      </g>
      <path d="M30.5 2v10a4.5 4.5 0 0 0 4.5 4.5h10z" fill={`url(#${id}f)`} />
      <path d="M30.5 2v10a4.5 4.5 0 0 0 4.5 4.5h10" fill="none" stroke={main} strokeOpacity="0.25" strokeWidth="0.8" />
      <g transform={showLabel ? 'translate(0 -3)' : 'translate(0 2)'}>{GLYPHS[kind](main, soft)}</g>
      {showLabel && (
        <>
          <rect x={24 - ext.length * 2.6 - 4} y="43" width={ext.length * 5.2 + 8} height="10" rx="3" fill={main} />
          <text
            x="24"
            y="50.4"
            textAnchor="middle"
            fontSize="6.6"
            fontWeight="700"
            letterSpacing="0.3"
            fill="#fff"
            fontFamily="Inter Variable, ui-sans-serif, system-ui, sans-serif"
          >
            {ext}
          </text>
        </>
      )}
    </svg>
  )
}

const GLYPHS: Record<FileKind, (main: string, soft: string) => ReactNode> = {
  folder: (main) => <rect x="14" y="22" width="20" height="14" rx="2.5" fill={main} />,
  image: (main, soft) => (
    <g>
      <rect x="12" y="17" width="24" height="19" rx="3" fill={soft} />
      <circle cx="29" cy="22.5" r="2.4" fill="#fff" />
      <path d="M12 32.5l6.5-7 5 5 3.5-3 9 7.5V33a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3z" fill={main} />
    </g>
  ),
  video: (main, soft) => (
    <g>
      <rect x="11" y="18" width="26" height="18" rx="3.5" fill={soft} />
      <rect x="11" y="18" width="26" height="3" rx="1.5" fill={main} opacity="0.35" />
      <path d="M21.5 23.2v8.6a.8.8 0 0 0 1.2.7l7-4.3a.8.8 0 0 0 0-1.4l-7-4.3a.8.8 0 0 0-1.2.7z" fill={main} />
    </g>
  ),
  audio: (main) => (
    <g fill={main}>
      <path d="M20 19.5l12-3v14.2" stroke={main} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M20 19.5v14" stroke={main} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <ellipse cx="17.6" cy="34" rx="3.6" ry="2.9" />
      <ellipse cx="29.6" cy="31.2" rx="3.6" ry="2.9" />
    </g>
  ),
  document: (main, soft) => (
    <g>
      <rect x="12" y="16" width="24" height="4" rx="2" fill={main} />
      {[23, 27.5, 32].map((y, i) => (
        <rect key={y} x="12" y={y} width={i === 2 ? 15 : 24} height="2.4" rx="1.2" fill={soft} />
      ))}
      <rect x="12" y="36.5" width="19" height="2.4" rx="1.2" fill={soft} />
    </g>
  ),
  pdf: (main, soft) => (
    <g>
      <rect x="12" y="16" width="11" height="10" rx="2" fill={soft} />
      <path d="M13.5 24.5l3-3.5 2 2 1.5-1.5 2.5 3z" fill={main} opacity="0.8" />
      <rect x="25" y="16.5" width="11" height="2.4" rx="1.2" fill={main} />
      <rect x="25" y="21" width="9" height="2.4" rx="1.2" fill={soft} />
      {[29, 33.5].map((y) => (
        <rect key={y} x="12" y={y} width="24" height="2.4" rx="1.2" fill={soft} />
      ))}
      <rect x="12" y="38" width="16" height="2.4" rx="1.2" fill={soft} />
    </g>
  ),
  spreadsheet: (main, soft) => (
    <g>
      <rect x="11.5" y="16.5" width="25" height="21" rx="2.5" fill={soft} />
      <rect x="11.5" y="16.5" width="25" height="5" rx="2.5" fill={main} />
      <rect x="11.5" y="19.5" width="25" height="2" fill={main} />
      {[26.5, 31.5].map((y) => (
        <rect key={y} x="11.5" y={y} width="25" height="0.9" fill={main} opacity="0.55" />
      ))}
      {[19.8, 28.1].map((x) => (
        <rect key={x} x={x} y="21.5" width="0.9" height="16" fill={main} opacity="0.55" />
      ))}
    </g>
  ),
  archive: (main, soft) => (
    <g>
      <rect x="21" y="2" width="6" height="30" fill={soft} opacity="0.7" />
      {[4, 8, 12, 16, 20, 24].map((y, i) => (
        <rect key={y} x={i % 2 ? 24 : 21} y={y} width="3" height="3" rx="0.6" fill={main} />
      ))}
      <rect x="19.5" y="28" width="9" height="11" rx="2.2" fill={main} />
      <rect x="21.8" y="31" width="4.4" height="4" rx="1" fill="#fff" opacity="0.85" />
    </g>
  ),
  code: (main) => (
    <g fill="none" stroke={main} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.5 21.5L12.5 27l6 5.5" />
      <path d="M29.5 21.5l6 5.5-6 5.5" />
      <path d="M26 18.5l-4 17" opacity="0.6" />
    </g>
  ),
  text: (_main, soft) => (
    <g>
      {[16, 20.5, 25, 29.5, 34].map((y, i) => (
        <rect key={y} x="12" y={y} width={[24, 20, 24, 14, 22][i]} height="2.2" rx="1.1" fill={i === 0 ? '#9aa3b2' : soft} />
      ))}
    </g>
  ),
  other: (main, soft) => (
    <g>
      <circle cx="24" cy="27" r="9" fill={soft} />
      <circle cx="24" cy="27" r="3.4" fill={main} />
    </g>
  ),
}
