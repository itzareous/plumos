import { Bar, H, Label, series, type MockProps } from './Frame'

export function DashboardMock({ c, r, id }: MockProps) {
  const values = [
    `${(97 + r() * 2.9).toFixed(1)}%`,
    Math.round(300 + r() * 4200).toLocaleString('en-US'),
    `${Math.round(8 + r() * 60)} ms`,
  ]
  const pts = series(r, 26, 0.4)
  const x0 = 24
  const x1 = 376
  const y0 = 122
  const y1 = 226
  const xs = pts.map((_, i) => x0 + ((x1 - x0) * i) / (pts.length - 1))
  const ys = pts.map((v) => y1 - v * (y1 - y0))
  const line = xs.map((x, i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
  return (
    <g>
      {values.map((v, i) => {
        const x = 12 + i * 128
        return (
          <g key={i}>
            <rect x={x} y={38} width={120} height={50} rx={10} fill="white" fillOpacity="0.05" />
            <Bar x={x + 11} y={48} w={34 + i * 8} o={0.28} />
            <Label x={x + 11} y={75} size={15} weight={700} o={0.92}>
              {v}
            </Label>
            <circle cx={x + 104} cy={51} r={4} fill={c.accent} fillOpacity={0.9 - i * 0.2} />
          </g>
        )
      })}
      <rect x={12} y={98} width={376} height={142} rx={10} fill="white" fillOpacity="0.04" />
      <Bar x={24} y={108} w={70} h={5} o={0.45} />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={x0} x2={x1} y1={y0 + i * 34.6} y2={y0 + i * 34.6} stroke="white" strokeOpacity="0.06" />
      ))}
      <path d={`${line} L${x1} ${y1} L${x0} ${y1} Z`} fill={`url(#${id}-area)`} />
      <path d={line} fill="none" stroke={c.accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={xs[18]} cy={ys[18]} r={4} fill="#0f1016" stroke={c.accent} strokeWidth="2" />
    </g>
  )
}

export function ListMock({ c, r, id }: MockProps) {
  return (
    <g>
      <rect x={0} y={27} width={96} height={H} fill="white" fillOpacity="0.025" />
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i}>
          {i === 1 && <rect x={6} y={38 + i * 22} width={84} height={17} rx={6} fill={c.accent} fillOpacity="0.22" />}
          <rect x={13} y={43 + i * 22} width={7} height={7} rx={2} fill="white" fillOpacity={i === 1 ? 0.8 : 0.3} />
          <Bar x={26} y={44.5 + i * 22} w={30 + ((i * 17) % 30)} o={i === 1 ? 0.75 : 0.28} />
        </g>
      ))}
      <Bar x={112} y={40} w={96} h={8} o={0.6} />
      <rect x={336} y={37} width={52} height={15} rx={7.5} fill={c.accent} fillOpacity="0.9" />
      {Array.from({ length: 6 }, (_, i) => {
        const y = 66 + i * 30
        return (
          <g key={i}>
            <rect x={112} y={y} width={20} height={20} rx={6} fill={`url(#${id}-${i % 2 ? 'g2' : 'g'})`} fillOpacity={0.9} />
            <Bar x={140} y={y + 4} w={70 + r() * 90} h={5} o={0.6} />
            <Bar x={140} y={y + 13} w={40 + r() * 70} o={0.22} />
            <Bar x={352} y={y + 8} w={28 + r() * 8} o={0.2} />
            <line x1={112} x2={388} y1={y + 25} y2={y + 25} stroke="white" strokeOpacity="0.05" />
          </g>
        )
      })}
    </g>
  )
}

export function GridMock({ c, r, id }: MockProps) {
  const cols = 6
  const w = 56
  return (
    <g>
      <Bar x={14} y={38} w={90} h={8} o={0.6} />
      {['All', 'Recent', 'Favourites', 'Shared'].map((_, i) => (
        <rect
          key={i}
          x={14 + i * 46}
          y={52}
          width={40}
          height={12}
          rx={6}
          fill={i === 0 ? c.accent : 'white'}
          fillOpacity={i === 0 ? 0.85 : 0.07}
        />
      ))}
      {Array.from({ length: cols * 2 }, (_, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = 14 + col * (w + 7.2)
        const y = 74 + row * 100
        const cx = x + 10 + r() * 36
        const cy = y + 14 + r() * 50
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={80} rx={7} fill={`url(#${id}-${(i + row) % 2 ? 'g2' : 'g'})`} />
            <circle cx={cx} cy={cy} r={8 + r() * 14} fill="white" fillOpacity={0.12 + r() * 0.12} />
            <rect x={x} y={y + 52} width={w} height={28} rx={7} fill="#000" fillOpacity="0.22" />
            {row === 0 && <Bar x={x} y={y + 86} w={w - 12 - r() * 16} o={0.35} />}
          </g>
        )
      })}
    </g>
  )
}

export function PlayerMock({ c, r, id }: MockProps) {
  return (
    <g>
      <rect x={14} y={38} width={120} height={120} rx={12} fill={`url(#${id}-g)`} />
      <circle cx={74} cy={98} r={36} fill="white" fillOpacity="0.14" />
      <circle cx={74} cy={98} r={11} fill="#0f1016" fillOpacity="0.55" />
      <Bar x={14} y={170} w={96} h={6} o={0.7} />
      <Bar x={14} y={182} w={62} o={0.3} />
      <rect x={14} y={198} width={120} height={3} rx={1.5} fill="white" fillOpacity="0.15" />
      <rect x={14} y={198} width={72} height={3} rx={1.5} fill={c.accent} />
      <path d="M40 219 l-8 5 l8 5z M48 219 l-8 5 l8 5z" fill="white" fillOpacity="0.5" />
      <circle cx={74} cy={224} r={12} fill={c.accent} />
      <path d="M70 218.5 l10 5.5 l-10 5.5z" fill="#0f1016" />
      <path d="M100 219 l8 5 l-8 5z M108 219 l8 5 l-8 5z" fill="white" fillOpacity="0.5" />
      <Bar x={152} y={40} w={80} h={8} o={0.6} />
      {Array.from({ length: 7 }, (_, i) => {
        const y = 60 + i * 26
        const active = i === 2
        return (
          <g key={i}>
            {active && <rect x={148} y={y - 4} width={240} height={22} rx={7} fill={c.accent} fillOpacity="0.14" />}
            {active ? (
              [0, 1, 2].map((b) => (
                <rect key={b} x={155 + b * 3.5} y={y + 2 + b} width={2} height={9 - b * 2} rx={1} fill={c.accent} />
              ))
            ) : (
              <Label x={160} y={y + 9} size={7} o={0.35} anchor="middle">
                {i + 1}
              </Label>
            )}
            <Bar x={176} y={y + 1} w={80 + r() * 70} h={5} o={active ? 0.85 : 0.55} />
            <Bar x={176} y={y + 10} w={40 + r() * 40} o={0.2} />
            <Label x={384} y={y + 9} size={7} o={0.35} anchor="end">
              {`${2 + Math.floor(r() * 4)}:${String(Math.floor(r() * 60)).padStart(2, '0')}`}
            </Label>
          </g>
        )
      })}
    </g>
  )
}

export function ChatMock({ c, r, id }: MockProps) {
  const lines = (x: number, y: number, n: number, max: number) =>
    Array.from({ length: n }, (_, i) => (
      <Bar key={i} x={x} y={y + i * 9} w={i === n - 1 ? max * (0.4 + r() * 0.3) : max * (0.85 + r() * 0.15)} o={0.45} />
    ))
  return (
    <g>
      <rect x={0} y={27} width={100} height={H} fill="white" fillOpacity="0.025" />
      <rect x={8} y={36} width={84} height={17} rx={8.5} fill={c.accent} fillOpacity="0.22" />
      <Bar x={30} y={42.5} w={40} o={0.7} />
      {Array.from({ length: 8 }, (_, i) => (
        <Bar key={i} x={12} y={66 + i * 20} w={46 + r() * 30} o={i === 0 ? 0.6 : 0.22} />
      ))}
      <rect x={250} y={38} width={138} height={24} rx={12} fill={c.accent} fillOpacity="0.9" />
      <Bar x={262} y={48} w={100} o={0.8} fill="#0b0b10" />
      <circle cx={122} cy={82} r={8} fill={`url(#${id}-g)`} />
      <rect x={136} y={74} width={216} height={60} rx={12} fill="white" fillOpacity="0.06" />
      {lines(148, 86, 4, 190)}
      <rect x={278} y={146} width={110} height={24} rx={12} fill={c.accent} fillOpacity="0.9" />
      <Bar x={290} y={156} w={80} o={0.8} fill="#0b0b10" />
      <circle cx={122} cy={190} r={8} fill={`url(#${id}-g)`} />
      <rect x={136} y={182} width={180} height={26} rx={12} fill="white" fillOpacity="0.06" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={152 + i * 9} cy={195} r={2.6} fill="white" fillOpacity={0.7 - i * 0.2} />
      ))}
      <rect x={112} y={220} width={276} height={22} rx={11} fill="white" fillOpacity="0.07" />
      <Bar x={124} y={229} w={90} o={0.25} />
      <circle cx={377} cy={231} r={7} fill={c.accent} />
    </g>
  )
}
