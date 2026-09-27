import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Linkify, tone } from './ui'

type Rule = (line: string) => ReactNode

const comment = (line: string) => /^\s*#/.test(line) && <span className={tone.dim}>{line}</span>

const rules: [RegExp, Rule][] = [
  [
    /\.log$/,
    (line) => {
      const m = /^(\S+)\s+(INFO|WARN|ERROR)\s+([\w-]+\[\d+\]:)(.*)$/.exec(line)
      if (!m) return <Linkify text={line} />
      const level = m[2] === 'WARN' ? tone.yellow : m[2] === 'ERROR' ? tone.red : tone.cyan
      return (
        <>
          <span className={tone.dim}>{m[1]}</span> <span className={level}>{m[2].padEnd(4)}</span>{' '}
          <span className={tone.plum}>{m[3]}</span>
          <Linkify text={m[4]} />
        </>
      )
    },
  ],
  [
    /(\.conf|rc|release|\.ya?ml)$/,
    (line) => {
      if (comment(line)) return comment(line)
      if (/^\[.+\]$/.test(line)) return <span className={cn(tone.plum, 'font-semibold')}>{line}</span>
      const m = /^(\s*-?\s*)([\w.-]+)(\s*[=:]\s*)(.*)$/.exec(line)
      if (!m) return <Linkify text={line} />
      const value = /^["'].*["']$/.test(m[4]) ? tone.green : /^\d+$/.test(m[4]) ? tone.yellow : tone.fg
      return (
        <>
          {m[1]}
          <span className={tone.cyan}>{m[2]}</span>
          <span className={tone.dim}>{m[3]}</span>
          <span className={value}>
            <Linkify text={m[4]} />
          </span>
        </>
      )
    },
  ],
  [
    /\.md$/,
    (line) => {
      if (/^#+\s/.test(line)) return <span className={cn(tone.plum, 'font-semibold')}>{line}</span>
      const m = /^(\s*[-*]\s)(.*)$/.exec(line)
      if (m) {
        return (
          <>
            <span className={tone.dim}>{m[1]}</span>
            <Linkify text={m[2]} />
          </>
        )
      }
      return <Linkify text={line} />
    },
  ],
  [
    /\.json$/,
    (line) => {
      const m = /^(\s*)("[^"]+")(:\s*)(.*?)(,?)$/.exec(line)
      if (!m) return line
      const value = m[4].startsWith('"') ? tone.green : m[4] === 'null' ? tone.dim : tone.yellow
      return (
        <>
          {m[1]}
          <span className={tone.cyan}>{m[2]}</span>
          {m[3]}
          <span className={value}>{m[4]}</span>
          {m[5]}
        </>
      )
    },
  ],
  [
    /todo\.txt$/,
    (line) =>
      line.startsWith('[x]') ? (
        <>
          <span className={tone.green}>[x]</span>
          <span className={tone.dim}>{line.slice(3)}</span>
        </>
      ) : (
        <>
          <span className={tone.yellow}>{line.slice(0, 3)}</span>
          {line.slice(3)}
        </>
      ),
  ],
]

/** File contents with light syntax colouring chosen by file name. */
export function Highlighted({ name, content }: { name: string; content: string }) {
  const rule = rules.find(([re]) => re.test(name))?.[1] ?? ((line: string) => <Linkify text={line} />)
  return (
    <div className="break-words whitespace-pre-wrap">
      {content.split('\n').map((line, i) => (
        <div key={i} className="min-h-[1.5em]">
          {rule(line)}
        </div>
      ))}
    </div>
  )
}
