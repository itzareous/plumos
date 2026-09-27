import { Bar, H, Label, TOP, W, type MockProps } from './Frame'

export function BudgetMock({ c, r }: MockProps) {
  const rows = Array.from({ length: 6 }, (_, i) => ({ fill: 0.2 + r() * 0.75, over: i === 3 }))
  const segments = [0.34, 0.26, 0.22, 0.18]
  const colors = [c.accent, c.from, c.to, 'rgb(255 255 255 / 0.25)']
  const R = 44
  const C = 2 * Math.PI * R
  let offset = 0
  return (
    <g>
      <Bar x={14} y={38} w={60} o={0.35} />
      <Label x={14} y={66} size={18} weight={700}>
        {`$${Math.round(1800 + r() * 2400).toLocaleString('en-US')}`}
      </Label>
      <Bar x={14} y={74} w={80} o={0.22} />
      {rows.map((row, i) => {
        const y = 92 + i * 25
        return (
          <g key={i}>
            <Bar x={14} y={y} w={40 + r() * 40} o={0.55} />
            <Label x={236} y={y + 5} size={7} anchor="end" o={0.5}>
              {`$${Math.round(40 + r() * 600)}`}
            </Label>
            <rect x={14} y={y + 10} width={222} height={5} rx={2.5} fill="white" fillOpacity="0.1" />
            <rect
              x={14}
              y={y + 10}
              width={222 * (row.over ? 1 : row.fill)}
              height={5}
              rx={2.5}
              fill={row.over ? '#f87171' : c.accent}
            />
          </g>
        )
      })}
      <rect x={256} y={38} width={132} height={200} rx={12} fill="white" fillOpacity="0.045" />
      <g transform="rotate(-90 322 118)">
        {segments.map((s, i) => {
          const el = (
            <circle
              key={i}
              cx={322}
              cy={118}
              r={R}
              fill="none"
              stroke={colors[i]}
              strokeWidth={14}
              strokeDasharray={`${s * C - 3} ${C}`}
              strokeDashoffset={-offset * C}
            />
          )
          offset += s
          return el
        })}
      </g>
      <Label x={322} y={122} size={11} weight={700} anchor="middle">
        {`${Math.round(55 + r() * 30)}%`}
      </Label>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={272} cy={184 + i * 15} r={3.5} fill={colors[i]} />
          <Bar x={282} y={182 + i * 15} w={50 + r() * 30} o={0.35} />
        </g>
      ))}
    </g>
  )
}

export function WorldMock({ c, r, id }: MockProps) {
  const cols = 25
  const cw = W / cols
  const back = Array.from({ length: cols }, (_, i) => 120 + Math.sin(i / 3) * 18 + r() * 14)
  const front = Array.from({ length: cols }, (_, i) => 170 + Math.cos(i / 2.5) * 16 + r() * 10)
  const step = (hs: number[]) =>
    `M0 ${H} ` + hs.map((h, i) => `L${i * cw} ${Math.round(h / 8) * 8} L${(i + 1) * cw} ${Math.round(h / 8) * 8}`).join(' ') + ` L${W} ${H} Z`
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.from} stopOpacity="0.55" />
          <stop offset="1" stopColor="#0f1016" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect x={0} y={TOP + 1} width={W} height={H} fill={`url(#${id}-sky)`} />
      <rect x={316} y={50} width={28} height={28} fill="#fde68a" fillOpacity="0.85" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={60 + i * 110 + r() * 30} y={52 + r() * 30} width={40} height={10} fill="white" fillOpacity="0.25" />
      ))}
      <path d={step(back)} fill={c.to} fillOpacity="0.8" />
      <path d={step(front)} fill="#12141b" />
      {front.map((h, i) =>
        i % 4 === 1 ? (
          <g key={i}>
            <rect x={i * cw + 5} y={Math.round(h / 8) * 8 - 18} width={6} height={18} fill="#5b3a1e" />
            <rect x={i * cw - 2} y={Math.round(h / 8) * 8 - 34} width={20} height={18} fill={c.accent} fillOpacity="0.85" />
          </g>
        ) : null,
      )}
      {front.map((h, i) => (
        <rect key={i} x={i * cw} y={Math.round(h / 8) * 8} width={cw} height={4} fill={c.accent} fillOpacity="0.9" />
      ))}
      <rect x={14} y={38} width={128} height={78} rx={10} fill="black" fillOpacity="0.5" />
      <circle cx={26} cy={51} r={3} fill="#4ade80" />
      <Bar x={34} y={49} w={60} o={0.7} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={24} y={64 + i * 16} width={10} height={10} rx={2} fill={i === 0 ? c.accent : c.from} />
          <Bar x={40} y={67 + i * 16} w={40 + r() * 40} o={0.45} />
        </g>
      ))}
    </g>
  )
}

export function DesktopMock({ c, app, id }: MockProps) {
  const windows = app.vm?.os === 'windows'
  return (
    <g>
      <rect x={0} y={TOP + 1} width={W} height={H} fill={`url(#${id}-g)`} fillOpacity="0.55" />
      <circle cx={320} cy={70} r={90} fill="white" fillOpacity="0.06" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={16} y={40 + i * 34} width={18} height={16} rx={4} fill="white" fillOpacity="0.8" />
          <Bar x={14} y={60 + i * 34} w={22} h={3} o={0.6} />
        </g>
      ))}
      <rect x={52} y={44} width={200} height={124} rx={8} fill="#171922" />
      <rect x={52} y={44} width={200} height={14} rx={8} fill="white" fillOpacity="0.07" />
      <Bar x={62} y={49} w={60} o={0.5} />
      <rect x={58} y={64} width={46} height={98} rx={4} fill="white" fillOpacity="0.04" />
      {[0, 1, 2, 3].map((i) => (
        <Bar key={i} x={64} y={72 + i * 12} w={30} o={i === 0 ? 0.7 : 0.25} fill={i === 0 ? c.accent : 'white'} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <Bar key={i} x={112} y={70 + i * 11} w={i === 4 ? 70 : 128} o={0.3} />
      ))}
      <rect x={176} y={96} width={184} height={112} rx={8} fill="#f4f4f6" />
      <rect x={176} y={96} width={184} height={14} rx={8} fill="#e2e3e8" />
      <Bar x={186} y={101} w={50} o={0.5} fill="#333" />
      <rect x={186} y={118} width={70} height={46} rx={5} fill={c.accent} fillOpacity="0.85" />
      <Bar x={264} y={120} w={84} h={5} o={0.55} fill="#222" />
      {[0, 1, 2].map((i) => (
        <Bar key={i} x={264} y={132 + i * 9} w={60 + i * 7} o={0.25} fill="#222" />
      ))}
      <Bar x={186} y={176} w={150} o={0.2} fill="#222" />
      <Bar x={186} y={186} w={110} o={0.2} fill="#222" />
      {windows ? (
        <rect x={0} y={232} width={W} height={18} fill="#0b0c12" fillOpacity="0.75" />
      ) : (
        <rect x={130} y={226} width={140} height={18} rx={9} fill="white" fillOpacity="0.18" />
      )}
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={windows ? 150 + i * 17 : 142 + i * 20} y={windows ? 236 : 230} width={10} height={10} rx={3} fill="white" fillOpacity={i === 1 ? 0.9 : 0.5} />
      ))}
      <path d="M300 170 l0 16 l4.5 -4 l3 6.5 l3 -1.4 l-3 -6.3 l6 -0.3z" fill="white" stroke="#111" strokeWidth="1" />
    </g>
  )
}

export function TerminalMock({ c, app }: MockProps) {
  const spec = app.vm
    ? `${app.vm.cpus} vCPU · ${app.vm.memoryGb} GB RAM · ${app.vm.diskGb} GB disk`
    : `listening on :${app.port ?? 8080}`
  const lines: [string, string, number][] = [
    ['$', `plumos status ${app.id}`, 0.9],
    ['', `● ${app.name} is running`, 0.75],
    ['', spec, 0.5],
    ['', `version ${app.version} · uptime 12d 4h`, 0.5],
    ['$', 'tail -f activity.log', 0.9],
    ['', '[ok] health check passed', 0.45],
    ['', '[ok] backup snapshot written', 0.45],
    ['', '[ok] 3 clients connected', 0.45],
  ]
  return (
    <g>
      <rect x={0} y={TOP + 1} width={W} height={H} fill="black" fillOpacity="0.35" />
      {lines.map(([prompt, text, o], i) => (
        <g key={i}>
          {prompt && (
            <Label x={16} y={48 + i * 18} size={8.5} mono fill={c.accent} o={1}>
              {prompt}
            </Label>
          )}
          <Label x={prompt ? 28 : 16} y={48 + i * 18} size={8.5} mono weight={500} o={o} fill={i === 1 ? '#86efac' : 'white'}>
            {text}
          </Label>
        </g>
      ))}
      <Label x={16} y={48 + lines.length * 18} size={8.5} mono fill={c.accent} o={1}>
        $
      </Label>
      <rect x={28} y={41 + lines.length * 18} width={6} height={10} fill="white" fillOpacity="0.8" />
    </g>
  )
}

export function DocumentMock({ c, r }: MockProps) {
  return (
    <g>
      <rect x={0} y={27} width={100} height={H} fill="white" fillOpacity="0.025" />
      {[c.accent, c.from, c.to, '#fcd34d', '#93c5fd'].map((col, i) => (
        <g key={i}>
          {i === 0 && <rect x={6} y={36} width={88} height={16} rx={6} fill="white" fillOpacity="0.08" />}
          <circle cx={16} cy={44 + i * 20} r={3.5} fill={col} />
          <Bar x={25} y={42 + i * 20} w={36 + r() * 26} o={i === 0 ? 0.75 : 0.3} />
        </g>
      ))}
      <Label x={120} y={52} size={14} weight={700}>
        {['Weekend plans', 'Tax documents', 'Recipes to try', 'Garden notes'][Math.floor(r() * 4)]}
      </Label>
      <Bar x={120} y={60} w={80} o={0.22} />
      {[0, 1, 2].map((i) => (
        <Bar key={i} x={120} y={76 + i * 10} w={i === 2 ? 140 : 250} o={0.4} />
      ))}
      <rect x={118} y={104} width={120} height={9} rx={2} fill={c.accent} fillOpacity="0.28" />
      <Bar x={120} y={106.5} w={112} o={0.5} />
      {[0, 1, 2, 3].map((i) => {
        const done = i < 2
        const y = 126 + i * 18
        return (
          <g key={i}>
            <rect
              x={120}
              y={y}
              width={10}
              height={10}
              rx={3}
              fill={done ? c.accent : 'none'}
              stroke={done ? 'none' : 'white'}
              strokeOpacity="0.4"
            />
            {done && <path d={`M${122.5} ${y + 5} l2 2 l3.5 -4`} fill="none" stroke="#0f1016" strokeWidth="1.6" />}
            <Bar x={138} y={y + 3} w={80 + r() * 90} o={done ? 0.25 : 0.5} />
          </g>
        )
      })}
      {[0, 1].map((i) => (
        <Bar key={i} x={120} y={206 + i * 10} w={i ? 160 : 240} o={0.4} />
      ))}
    </g>
  )
}
