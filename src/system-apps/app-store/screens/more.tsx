import { Bar, H, Label, W, type MockProps } from './Frame'

export function NodesMock({ c, r, id }: MockProps) {
  const nodes = [
    { x: 22, y: 50 },
    { x: 22, y: 158 },
    { x: 152, y: 100 },
    { x: 282, y: 48 },
    { x: 282, y: 164 },
  ]
  const edges: [number, number][] = [
    [0, 2],
    [1, 2],
    [2, 3],
    [2, 4],
  ]
  const nw = 96
  const nh = 48
  return (
    <g>
      <defs>
        <pattern id={`${id}-dots`} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="white" fillOpacity="0.09" />
        </pattern>
      </defs>
      <rect x={0} y={27} width={W} height={H} fill={`url(#${id}-dots)`} />
      {edges.map(([a, b], i) => {
        const s = nodes[a]
        const t = nodes[b]
        const x1 = s.x + nw
        const y1 = s.y + nh / 2
        const x2 = t.x
        const y2 = t.y + nh / 2
        const mx = (x1 + x2) / 2
        return (
          <g key={i}>
            <path
              d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
              fill="none"
              stroke={c.accent}
              strokeOpacity="0.75"
              strokeWidth="2"
            />
            <circle cx={x1} cy={y1} r={3.5} fill="#0f1016" stroke={c.accent} strokeWidth="1.5" />
            <circle cx={x2} cy={y2} r={3.5} fill="#0f1016" stroke={c.accent} strokeWidth="1.5" />
          </g>
        )
      })}
      {nodes.map((n, i) => (
        <g key={i}>
          <rect x={n.x} y={n.y} width={nw} height={nh} rx={8} fill="#1a1c25" stroke="white" strokeOpacity="0.1" />
          <path
            d={`M${n.x} ${n.y + 8} a8 8 0 0 1 8 -8 h${nw - 16} a8 8 0 0 1 8 8 v6 h-${nw} z`}
            fill={i === 2 ? c.accent : `url(#${id}-${i % 2 ? 'g2' : 'g'})`}
            fillOpacity="0.9"
          />
          <Bar x={n.x + 8} y={n.y + 22} w={50 + r() * 30} o={0.5} />
          <Bar x={n.x + 8} y={n.y + 32} w={30 + r() * 30} o={0.2} />
        </g>
      ))}
      <rect x={306} y={226} width={82} height={16} rx={8} fill={c.accent} fillOpacity="0.9" />
      <Bar x={322} y={232} w={50} o={0.8} fill="#0b0b10" />
    </g>
  )
}

export function BlocksMock({ c, r, id }: MockProps) {
  const height = 915_000 + Math.floor(r() * 9000)
  const bars = Array.from({ length: 34 }, () => 0.15 + r() * 0.8)
  return (
    <g>
      <Bar x={14} y={38} w={70} h={7} o={0.6} />
      {Array.from({ length: 6 }, (_, i) => {
        const x = 14 + i * 63 + (i >= 2 ? 10 : 0)
        const pending = i < 2
        return (
          <g key={i}>
            <path d={`M${x + 5} 56 h50 l-5 6 h-50z`} fill="white" fillOpacity={pending ? 0.08 : 0.18} />
            <rect
              x={x}
              y={62}
              width={50}
              height={50}
              rx={3}
              fill={pending ? 'white' : `url(#${id}-g)`}
              fillOpacity={pending ? 0.06 : 0.95}
              stroke={pending ? 'white' : 'none'}
              strokeOpacity="0.2"
              strokeDasharray="3 3"
            />
            <path d={`M${x + 50} 62 l5 -6 v50 l-5 6z`} fill="black" fillOpacity={pending ? 0.1 : 0.3} />
            <Label x={x + 25} y={80} size={6.5} anchor="middle" o={0.9}>
              {pending ? 'Next' : (height - i + 2).toLocaleString('en-US')}
            </Label>
            <Label x={x + 25} y={96} size={10} weight={700} anchor="middle">
              {`${Math.round(2 + r() * 14)} sat`}
            </Label>
            <Bar x={x + 12} y={102} w={26} h={3} o={0.4} />
          </g>
        )
      })}
      <line x1={140} x2={140} y1={52} y2={118} stroke="white" strokeOpacity="0.3" strokeDasharray="3 3" />
      <rect x={14} y={128} width={372} height={112} rx={10} fill="white" fillOpacity="0.04" />
      <Bar x={26} y={138} w={80} h={5} o={0.45} />
      {bars.map((v, i) => {
        const bh = v * 72
        return (
          <rect
            key={i}
            x={26 + i * 10.4}
            y={228 - bh}
            width={7}
            height={bh}
            rx={2}
            fill={c.accent}
            fillOpacity={0.35 + v * 0.6}
          />
        )
      })}
    </g>
  )
}

export function DevicesMock({ c, r }: MockProps) {
  const on = [true, false, true, true, false, true]
  return (
    <g>
      <Bar x={14} y={38} w={84} h={8} o={0.6} />
      {['Living room', 'Kitchen', 'Bedroom', 'Garden'].map((_, i) => (
        <rect
          key={i}
          x={14 + i * 58}
          y={52}
          width={52}
          height={12}
          rx={6}
          fill={i === 0 ? 'white' : 'white'}
          fillOpacity={i === 0 ? 0.85 : 0.07}
        />
      ))}
      {on.map((isOn, i) => {
        const col = i % 4
        const row = Math.floor(i / 4)
        const x = 14 + col * 94
        const y = 74 + row * 82
        return (
          <g key={i}>
            <rect x={x} y={y} width={86} height={74} rx={12} fill="white" fillOpacity={isOn ? 0.92 : 0.06} />
            <circle cx={x + 18} cy={y + 18} r={10} fill={isOn ? c.accent : 'white'} fillOpacity={isOn ? 1 : 0.15} />
            <Bar x={x + 10} y={y + 44} w={44 + r() * 20} h={5} o={isOn ? 0.75 : 0.5} fill={isOn ? '#111' : 'white'} />
            <Bar x={x + 10} y={y + 55} w={24 + r() * 16} o={isOn ? 0.4 : 0.2} fill={isOn ? '#111' : 'white'} />
          </g>
        )
      })}
      <rect x={202} y={156} width={180} height={74} rx={12} fill="white" fillOpacity="0.06" />
      <path d="M232 214 a32 32 0 1 1 52 0" fill="none" stroke="white" strokeOpacity="0.12" strokeWidth="7" strokeLinecap="round" />
      <path d="M232 214 a32 32 0 0 1 36 -48" fill="none" stroke={c.accent} strokeWidth="7" strokeLinecap="round" />
      <Label x={258} y={200} size={13} weight={700} anchor="middle">
        {`${(19 + r() * 4).toFixed(1)}°`}
      </Label>
      <Bar x={306} y={176} w={56} h={5} o={0.55} />
      <Bar x={306} y={188} w={38} o={0.22} />
      <rect x={306} y={204} width={24} height={14} rx={7} fill="white" fillOpacity="0.1" />
      <rect x={336} y={204} width={24} height={14} rx={7} fill={c.accent} fillOpacity="0.9" />
    </g>
  )
}

const tokenColors = (accent: string, from: string) => [accent, from, '#fcd34d', '#93c5fd', 'white']

export function EditorMock({ c, r }: MockProps) {
  const colors = tokenColors(c.accent, c.from)
  return (
    <g>
      <rect x={0} y={27} width={92} height={H} fill="white" fillOpacity="0.025" />
      {Array.from({ length: 10 }, (_, i) => {
        const indent = i === 0 || i === 5 ? 0 : 10
        const folder = i === 0 || i === 5
        return (
          <g key={i}>
            {i === 3 && <rect x={4} y={36 + i * 17} width={84} height={14} rx={5} fill={c.accent} fillOpacity="0.2" />}
            <rect
              x={10 + indent}
              y={40 + i * 17}
              width={7}
              height={6}
              rx={1.5}
              fill={folder ? c.accent : 'white'}
              fillOpacity={folder ? 0.8 : 0.3}
            />
            <Bar x={21 + indent} y={41 + i * 17} w={28 + r() * 24} o={i === 3 ? 0.8 : 0.3} />
          </g>
        )
      })}
      <rect x={92} y={27} width={86} height={16} fill="white" fillOpacity="0.05" />
      <Bar x={102} y={33} w={56} o={0.6} />
      <Bar x={190} y={33} w={50} o={0.22} />
      {Array.from({ length: 13 }, (_, i) => {
        const y = 54 + i * 11
        const indent = [0, 0, 1, 2, 2, 3, 2, 1, 0, 0, 1, 1, 0][i] * 12
        let x = 124 + indent
        const tokens = i === 8 ? 0 : 1 + Math.floor(r() * 4)
        return (
          <g key={i}>
            <Label x={112} y={y + 4} size={6} o={0.25} anchor="end" mono>
              {i + 1}
            </Label>
            {Array.from({ length: tokens }, (_, t) => {
              const w = 14 + r() * 44
              const el = (
                <Bar key={t} x={x} y={y} w={w} o={0.75} fill={colors[Math.floor(r() * colors.length)]} />
              )
              x += w + 5
              return x < 388 ? el : null
            })}
          </g>
        )
      })}
      <rect x={92} y={200} width={308} height={50} fill="black" fillOpacity="0.35" />
      <line x1={92} x2={400} y1={200} y2={200} stroke="white" strokeOpacity="0.08" />
      <Label x={102} y={216} size={7} mono o={0.9} fill={c.accent}>
        $
      </Label>
      <Bar x={112} y={212} w={96} o={0.5} />
      <Bar x={102} y={224} w={150} o={0.22} />
      <Bar x={102} y={236} w={110} o={0.22} fill="#86efac" />
    </g>
  )
}

export function FeedMock({ c, r, id }: MockProps) {
  return (
    <g>
      <rect x={0} y={27} width={62} height={H} fill="white" fillOpacity="0.025" />
      {Array.from({ length: 5 }, (_, i) => (
        <circle key={i} cx={31} cy={46 + i * 26} r={7} fill={i === 0 ? c.accent : 'white'} fillOpacity={i === 0 ? 0.9 : 0.16} />
      ))}
      <rect x={74} y={36} width={220} height={124} rx={12} fill="white" fillOpacity="0.045" />
      <circle cx={92} cy={54} r={9} fill={`url(#${id}-g)`} />
      <Bar x={108} y={48} w={60} h={5} o={0.7} />
      <Bar x={108} y={57} w={40} o={0.25} />
      <Bar x={84} y={72} w={196} o={0.45} />
      <Bar x={84} y={81} w={150} o={0.45} />
      <rect x={84} y={92} width={200} height={52} rx={8} fill={`url(#${id}-g2)`} />
      <circle cx={120 + r() * 120} cy={118} r={16} fill="white" fillOpacity="0.16" />
      <path d="M84 136 l40 -22 l30 16 l30 -12 l40 18 v8 h-140z" fill="black" fillOpacity="0.25" />
      {[0, 1, 2].map((i) => (
        <Bar key={i} x={86 + i * 40} y={150} w={22} h={3} o={0.3} />
      ))}
      <rect x={74} y={168} width={220} height={82} rx={12} fill="white" fillOpacity="0.045" />
      <circle cx={92} cy={186} r={9} fill={c.accent} />
      <Bar x={108} y={180} w={72} h={5} o={0.7} />
      <Bar x={108} y={189} w={46} o={0.25} />
      {[0, 1, 2].map((i) => (
        <Bar key={i} x={84} y={204 + i * 9} w={i === 2 ? 110 : 196} o={0.45} />
      ))}
      <rect x={306} y={36} width={82} height={130} rx={12} fill="white" fillOpacity="0.045" />
      <Bar x={316} y={48} w={46} h={5} o={0.6} />
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i}>
          <Bar x={316} y={64 + i * 20} w={30 + r() * 30} o={0.5} fill={i === 0 ? c.accent : 'white'} />
          <Bar x={316} y={71 + i * 20} w={24} h={3} o={0.2} />
        </g>
      ))}
    </g>
  )
}
