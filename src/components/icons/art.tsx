// Original, hand-drawn icon artwork. Every icon is drawn in a 100×100 box and
// includes its own background; <AppIcon> clips it to a squircle.
import type { ReactNode } from 'react'

const retroMonitor = (screen: ReactNode, screenFill: string) => (
  <>
    <rect width="100" height="100" fill="url(#cream)" />
    <rect x="13" y="16" width="74" height="58" rx="11" fill="#fdfbf5" stroke="#d8cfbd" strokeWidth="1.5" />
    <rect x="20" y="23" width="60" height="42" rx="6" fill={screenFill} />
    <rect x="20" y="23" width="60" height="42" rx="6" fill="url(#screenGlare)" />
    {screen}
    <rect x="40" y="74" width="20" height="7" fill="#e7dfcd" />
    <rect x="30" y="80" width="40" height="6" rx="3" fill="#f3eee3" stroke="#d8cfbd" strokeWidth="1.2" />
  </>
)

const sharedDefs = (
  <defs>
    <linearGradient id="cream" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#f7f3ea" />
      <stop offset="1" stopColor="#e2dac9" />
    </linearGradient>
    <linearGradient id="screenGlare" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
      <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
    </linearGradient>
  </defs>
)

export const iconArt: Record<string, ReactNode> = {
  // A friendly robot on a retro monitor — the Android virtual machine.
  android: (
    <>
      {sharedDefs}
      {retroMonitor(
        <g>
          <line x1="44" y1="33" x2="41" y2="29" stroke="#86e39c" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="56" y1="33" x2="59" y2="29" stroke="#86e39c" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M35 52a15 15 0 0 1 30 0z" fill="#86e39c" />
          <circle cx="44" cy="45" r="2" fill="#16301c" />
          <circle cx="56" cy="45" r="2" fill="#16301c" />
          <rect x="35" y="54" width="30" height="7" rx="2.5" fill="#86e39c" opacity="0.85" />
        </g>,
        '#17291b',
      )}
    </>
  ),

  // A classic desktop window on a retro monitor — the Windows virtual machine.
  windows: (
    <>
      {sharedDefs}
      {retroMonitor(
        <g>
          <rect x="33" y="31" width="34" height="26" rx="3" fill="#dff1ff" />
          <rect x="33" y="31" width="34" height="6" rx="3" fill="#8fd0ff" />
          <rect x="33" y="34" width="34" height="3" fill="#8fd0ff" />
          <circle cx="37" cy="34" r="1.2" fill="#2a78c7" />
          <circle cx="41" cy="34" r="1.2" fill="#2a78c7" />
          <rect x="37" y="41" width="12" height="12" rx="1.5" fill="#5cb4ff" />
          <rect x="52" y="41" width="11" height="4" rx="1" fill="#a9d6ff" />
          <rect x="52" y="47.5" width="8" height="4" rx="1" fill="#a9d6ff" />
        </g>,
        '#1d5fae',
      )}
    </>
  ),

  // A generic Linux desktop — penguin-free on purpose.
  linux: (
    <>
      {sharedDefs}
      {retroMonitor(
        <g fontFamily="ui-monospace, monospace" fontWeight="700">
          <text x="27" y="42" fontSize="11" fill="#ffd166">$</text>
          <rect x="36" y="34" width="26" height="4" rx="2" fill="#ffd166" opacity="0.8" />
          <rect x="27" y="46" width="36" height="4" rx="2" fill="#ffd166" opacity="0.45" />
          <rect x="27" y="54" width="10" height="5" rx="1" fill="#ffd166" />
        </g>,
        '#2b2238',
      )}
    </>
  ),

  // House with a single smart node.
  'home-assistant': (
    <>
      <defs>
        <linearGradient id="ha-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fd2f7" />
          <stop offset="1" stopColor="#17a0dc" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#ha-bg)" />
      <path
        d="M50 21 79 46.5V77a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3V46.5z"
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d="M50 80V56m0 6-9-8m9 0 9-8" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="52" r="5" fill="#fff" />
      <circle cx="41" cy="54" r="3.5" fill="#fff" />
      <circle cx="59" cy="46" r="3.5" fill="#fff" />
    </>
  ),

  // Winged messenger helmet.
  'hermes-agent': (
    <>
      <rect width="100" height="100" fill="#f7f6f2" />
      <path d="M26 64c0-17 11-29 25-29s24 12 24 29z" fill="#141414" />
      <path d="M22 64h58a3 3 0 0 1 0 6H22a3 3 0 0 1 0-6z" fill="#141414" />
      <path
        d="M47 44c-8-8-19-12-30-11 6 2 10 5 13 8-5 0-9 1-13 3 6 1 11 3 15 6-3 1-6 2-8 4 9 0 16-2 23-5z"
        fill="#f7f6f2"
        stroke="#141414"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="62" cy="52" r="3" fill="#f7f6f2" />
    </>
  ),

  // A five-petal pinwheel for photos.
  immich: (
    <>
      <rect width="100" height="100" fill="#fbfbfb" />
      {['#ff4d4d', '#ffb81f', '#2ecc71', '#2f8cff', '#f06bc2'].map((c, i) => (
        <ellipse
          key={c}
          cx="50"
          cy="33"
          rx="10.5"
          ry="17"
          fill={c}
          opacity="0.92"
          transform={`rotate(${i * 72 + 18} 50 52)`}
        />
      ))}
      <circle cx="50" cy="52" r="6" fill="#fbfbfb" />
    </>
  ),

  // Gradient play mark for a media library.
  jellyfin: (
    <>
      <defs>
        <linearGradient id="jf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b26bff" />
          <stop offset="1" stopColor="#3bb6ff" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="#0f1224" />
      <path d="M50 22 80 74H20z" fill="none" stroke="url(#jf)" strokeWidth="8" strokeLinejoin="round" />
      <path d="M50 46 61 65H39z" fill="url(#jf)" />
    </>
  ),

  // Connected workflow nodes.
  n8n: (
    <>
      <defs>
        <linearGradient id="n8n-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff7a9c" />
          <stop offset="1" stopColor="#ea4f7a" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#n8n-bg)" />
      <path d="M26 50h16l8-10h10m-18 10 8 10h10" stroke="#fff" strokeWidth="5" fill="none" strokeLinejoin="round" />
      <circle cx="22" cy="50" r="7" fill="none" stroke="#fff" strokeWidth="5" />
      <circle cx="67" cy="40" r="7" fill="none" stroke="#fff" strokeWidth="5" />
      <circle cx="67" cy="60" r="7" fill="none" stroke="#fff" strokeWidth="5" />
      <path d="M74 40h6" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    </>
  ),

  // Three linked rings — your own cloud.
  nextcloud: (
    <>
      <defs>
        <linearGradient id="nc-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#35b1ff" />
          <stop offset="1" stopColor="#1478d4" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#nc-bg)" />
      <path
        d="M31 67h39a14 14 0 0 0 1-28 20 20 0 0 0-38-3 15 15 0 0 0-2 31z"
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="53" r="4.5" fill="#fff" />
    </>
  ),

  'bitcoin-node': (
    <>
      <defs>
        <linearGradient id="btc-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc93d" />
          <stop offset="1" stopColor="#f7931a" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#btc-bg)" />
      <text
        x="50"
        y="69"
        textAnchor="middle"
        fontSize="56"
        fontWeight="800"
        fill="#fff"
        fontFamily="Inter Variable, system-ui, sans-serif"
        transform="rotate(12 50 50)"
      >
        ₿
      </text>
    </>
  ),

  // A friendly llama face in line art.
  ollama: (
    <>
      <rect width="100" height="100" fill="#fbfbf9" />
      <g fill="none" stroke="#1a1a1a" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M36 40c-3-8-3-17 1-22 4 3 5 11 5 19" />
        <path d="M64 40c3-8 3-17-1-22-4 3-5 11-5 19" />
        <path d="M31 58c0-13 8-22 19-22s19 9 19 22c0 6-2 10-4 13 2 3 2 7 0 10H35c-2-3-2-7 0-10-2-3-4-7-4-13z" />
        <ellipse cx="50" cy="66" rx="9.5" ry="7" />
        <path d="M47.5 65h5" />
      </g>
      <circle cx="41" cy="54" r="2.6" fill="#1a1a1a" />
      <circle cx="59" cy="54" r="2.6" fill="#1a1a1a" />
    </>
  ),

  // A small red crab with raised claws.
  openclaw: (
    <>
      <defs>
        <radialGradient id="oc-body" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ff6a5c" />
          <stop offset="1" stopColor="#c81e1e" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="#17171c" />
      <path d="M29 37c-9-4-11-15-5-21 1 6 5 8 10 8-2-5 0-9 4-11 0 8-1 17-9 24z" fill="url(#oc-body)" />
      <path d="M71 37c9-4 11-15 5-21-1 6-5 8-10 8 2-5 0-9-4-11 0 8 1 17 9 24z" fill="url(#oc-body)" />
      <path d="M26 72l-7 7M31 76l-5 9M74 72l7 7M69 76l5 9" stroke="#c81e1e" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="50" cy="60" rx="25" ry="19" fill="url(#oc-body)" />
      <circle cx="42" cy="49" r="3.4" fill="#17171c" />
      <circle cx="58" cy="49" r="3.4" fill="#17171c" />
      <circle cx="43" cy="48" r="1.1" fill="#fff" />
      <circle cx="59" cy="48" r="1.1" fill="#fff" />
    </>
  ),

  // Bold rounded chevron for a media server.
  plex: (
    <>
      <defs>
        <linearGradient id="plex-fg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd84d" />
          <stop offset="1" stopColor="#f5a300" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="#1c1c1e" />
      <path d="M38 24h13l20 26-20 26H38l20-26z" fill="url(#plex-fg)" strokeLinejoin="round" />
    </>
  ),

  /* ---------- System apps (dock) ---------- */

  files: (
    <>
      <defs>
        <linearGradient id="files-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9fbf" />
          <stop offset="1" stopColor="#ff7aa0" />
        </linearGradient>
        <linearGradient id="files-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffcf73" />
          <stop offset="1" stopColor="#ff8c4a" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="#fff4ec" />
      <path d="M14 30a6 6 0 0 1 6-6h20l7 7h33a6 6 0 0 1 6 6v8H14z" fill="url(#files-back)" />
      <rect x="14" y="38" width="72" height="42" rx="7" fill="url(#files-front)" />
      <rect x="14" y="38" width="72" height="4" rx="2" fill="#fff" opacity="0.35" />
    </>
  ),

  photos: (
    <>
      <defs>
        <linearGradient id="ph-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3ecfb0" />
          <stop offset="1" stopColor="#12876f" />
        </linearGradient>
        <linearGradient id="ph-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb86b" />
          <stop offset="1" stopColor="#ff7b8a" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#ph-bg)" />
      <rect x="22" y="22" width="52" height="46" rx="6" fill="#fff" opacity="0.5" transform="rotate(-10 48 45)" />
      <rect x="26" y="30" width="54" height="48" rx="6" fill="#fff" />
      <rect x="30" y="34" width="46" height="34" rx="3" fill="url(#ph-sky)" />
      <circle cx="64" cy="43" r="4.5" fill="#fff4c9" />
      <path d="M30 68l14-16 10 10 7-6 15 12z" fill="#28405e" />
    </>
  ),

  'app-store': (
    <>
      <defs>
        <linearGradient id="as-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4fb2ff" />
          <stop offset="1" stopColor="#1463ea" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#as-bg)" />
      <path d="M40 38v-5a10 10 0 0 1 20 0v5" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M26 38h48l-4 38a5 5 0 0 1-5 4H35a5 5 0 0 1-5-4z" fill="#fff" />
      <path d="M40 55a10 10 0 0 0 20 0" fill="none" stroke="#1d6fef" strokeWidth="5" strokeLinecap="round" />
    </>
  ),

  terminal: (
    <>
      {sharedDefs}
      {retroMonitor(
        <g>
          <path d="M28 36l8 6-8 6" fill="none" stroke="#6cf08c" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="40" y="46" width="14" height="3.4" rx="1.7" fill="#6cf08c" />
        </g>,
        '#10281a',
      )}
    </>
  ),

  settings: (
    <>
      <defs>
        <linearGradient id="set-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef1f7" />
          <stop offset="1" stopColor="#b9c1d1" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#set-bg)" />
      {[
        [30, 60],
        [50, 34],
        [70, 54],
      ].map(([y, x]) => (
        <g key={y}>
          <rect x="20" y={y - 3} width="60" height="6" rx="3" fill="#5f6b82" />
          <circle cx={x} cy={y} r="8" fill="#fff" stroke="#5f6b82" strokeWidth="3" />
        </g>
      ))}
    </>
  ),

  'live-usage': (
    <>
      <defs>
        <linearGradient id="lu-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#123f30" />
          <stop offset="1" stopColor="#061b14" />
        </linearGradient>
        <linearGradient id="lu-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3ef08a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#3ef08a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#lu-bg)" />
      <path d="M14 70l14-12 10 8 12-24 10 14 10-10 16 12v20H14z" fill="url(#lu-fill)" />
      <path
        d="M14 70l14-12 10 8 12-24 10 14 10-10 16 12"
        fill="none"
        stroke="#4ff59a"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
}
