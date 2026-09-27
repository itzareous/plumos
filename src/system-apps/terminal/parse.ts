/** A command and how it chains to the previous one. */
export interface Step {
  words: string[]
  /** `&&` only runs this step if the previous one succeeded. */
  when: 'always' | 'ok'
}

/**
 * Splits a line into steps (`;` and `&&`) and words, honouring quotes and
 * backslashes, expanding a leading `~` and `$VARS`.
 */
export function parseLine(line: string, env: Record<string, string>): Step[] {
  const steps: Step[] = []
  let words: string[] = []
  let word = ''
  let hasWord = false
  let quote: '"' | "'" | null = null
  let when: Step['when'] = 'always'

  const pushWord = () => {
    if (hasWord) words.push(word)
    word = ''
    hasWord = false
  }
  const pushStep = (next: Step['when']) => {
    pushWord()
    if (words.length) steps.push({ words, when })
    words = []
    when = next
  }

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quote) {
      if (ch === quote) quote = null
      else if (ch === '\\' && quote === '"' && i + 1 < line.length) word += line[++i]
      else if (ch === '$' && quote === '"') i = expandVar(line, i, env, (v) => (word += v))
      else word += ch
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      hasWord = true
    } else if (ch === '\\' && i + 1 < line.length) {
      word += line[++i]
      hasWord = true
    } else if (ch === ' ' || ch === '\t') pushWord()
    else if (ch === ';') pushStep('always')
    else if (ch === '&' && line[i + 1] === '&') {
      i++
      pushStep('ok')
    } else if (ch === '~' && !hasWord && (i + 1 === line.length || /[\s/;]/.test(line[i + 1]))) {
      word += env.HOME
      hasWord = true
    } else if (ch === '$') {
      i = expandVar(line, i, env, (v) => (word += v))
      hasWord = true
    } else {
      word += ch
      hasWord = true
    }
  }
  pushStep('always')
  return steps
}

function expandVar(line: string, i: number, env: Record<string, string>, emit: (v: string) => void): number {
  const match = /^\$(\w+|\{\w+\})/.exec(line.slice(i))
  if (!match) {
    emit('$')
    return i
  }
  const name = match[1].replace(/[{}]/g, '')
  emit(env[name] ?? '')
  return i + match[0].length - 1
}

/** Edit distance, for "did you mean…" suggestions. */
export function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return row[b.length]
}

/** The closest candidate within a sensible distance, if any. */
export function closest(word: string, candidates: string[]): string | null {
  let best: string | null = null
  let bestScore = Infinity
  for (const c of candidates) {
    const d = distance(word.toLowerCase(), c)
    const score = c.startsWith(word) ? d - 0.5 : d
    if (score < bestScore) {
      best = c
      bestScore = score
    }
  }
  const limit = word.length <= 3 ? 1 : word.length <= 6 ? 2 : 3
  return best && bestScore <= limit ? best : null
}

/** Longest shared prefix of a list of strings. */
export function commonPrefix(items: string[]): string {
  if (!items.length) return ''
  let prefix = items[0]
  for (const item of items) while (!item.startsWith(prefix)) prefix = prefix.slice(0, -1)
  return prefix
}
