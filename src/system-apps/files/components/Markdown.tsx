import type { ReactNode } from 'react'

/**
 * Just enough Markdown for notes and recipes: headings, bullet lists and
 * paragraphs. Everything else shows as plain text.
 */
export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  let list: string[] = []
  let para: string[] = []

  const flush = () => {
    if (para.length) {
      blocks.push(
        <p key={blocks.length} className="text-white/80">
          {para.join(' ')}
        </p>,
      )
      para = []
    }
    if (list.length) {
      blocks.push(
        <ul key={blocks.length} className="flex flex-col gap-1.5">
          {list.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-white/80">
              <span className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-accent" />
              <span>{item}</span>
            </li>
          ))}
        </ul>,
      )
      list = []
    }
  }

  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (heading) {
      flush()
      const level = heading[1].length
      blocks.push(
        <p
          key={blocks.length}
          className={level === 1 ? 'text-[22px] leading-tight font-bold tracking-tight' : 'text-[16px] font-semibold text-white/90'}
        >
          {heading[2]}
        </p>,
      )
    } else if (bullet) {
      if (para.length) flush()
      list.push(bullet[1])
    } else if (!line.trim()) {
      flush()
    } else {
      if (list.length) flush()
      para.push(line.trim())
    }
  }
  flush()

  return <div className="flex flex-col gap-4">{blocks}</div>
}
