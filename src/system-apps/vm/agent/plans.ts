import type { VmOs } from '../types'

/** One thing the agent does. `say` starts a new line in the step log. */
export type Step =
  | { do: 'click'; target: string; say?: string; dbl?: boolean }
  | { do: 'type'; target: string; text: string; say?: string; enter?: boolean; clear?: boolean }
  | { do: 'scroll'; target: string; by: number; say?: string }
  | { do: 'hover'; target: string; say?: string }
  | { do: 'wait'; ms: number; say?: string }

export interface Plan {
  id: string
  task: string
  done: string
  steps: Step[]
}

interface PlanDef {
  id: string
  os: VmOs[]
  /** Example task shown as a suggestion chip. */
  example: string
  match: RegExp
  build: (os: VmOs, param: string | null) => Plan
  /** Pulls a parameter out of the user's words. */
  param?: (text: string) => string | null
}

const GROCERIES = ['oat milk', '6 eggs', 'spinach', 'red lentils', 'lemons', 'sourdough loaf', 'coffee beans']
const DEFAULT_QUERY = 'easy lentil soup recipe'
const DEFAULT_MESSAGE = "On my way! Be there in 10 minutes."
const DEFAULT_SUM = '126/4'

const clean = (s: string) => s.replace(/[.?!]+$/, '').replace(/^["“']|["”']$/g, '').trim()
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function listText(param: string | null) {
  const items = param ? param.split('|') : GROCERIES
  const title = param ? 'Shopping list' : 'Groceries'
  return { title, body: items.map((i) => `- ${i}`).join('\n'), full: `${title}\n${items.map((i) => `- ${i}`).join('\n')}` }
}

const calcKeys = (sum: string) => {
  const [a, op, b] = sum.match(/^([\d.]+)([+\-*/])([\d.]+)$/)?.slice(1) ?? ['126', '/', '4']
  const opKey = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div' }[op] ?? 'div'
  const sym = { '+': '+', '-': '−', '*': '×', '/': '÷' }[op] ?? '÷'
  const digits = (n: string) => [...n].map((c) => (c === '.' ? 'dot' : c))
  return { keys: [...digits(a), opKey, ...digits(b)], label: `${a} ${sym} ${b}`, result: String(parseFloat(eval2(a, op, b).toPrecision(10))) }
}
function eval2(a: string, op: string, b: string) {
  const x = parseFloat(a)
  const y = parseFloat(b)
  return op === '+' ? x + y : op === '-' ? x - y : op === '*' ? x * y : x / y
}

/** Where each OS keeps its launchers. */
function launch(os: VmOs, app: 'notes' | 'browser' | 'files' | 'calc' | 'terminal' | 'editor' | 'messages', say: string): Step[] {
  if (os === 'android') return [{ do: 'click', target: `home.${app}`, say }]
  if (os === 'linux') return [{ do: 'click', target: `dock.${app}`, say }]
  if (app === 'browser' || app === 'files') return [{ do: 'click', target: `taskbar.${app}`, say }]
  return [
    { do: 'click', target: 'start', say: 'Open the launcher' },
    { do: 'click', target: `launch.${app}`, say },
  ]
}

const close = (os: VmOs, app: string, say: string): Step =>
  os === 'android' ? { do: 'click', target: 'nav.home', say: 'Go back to the home screen' } : { do: 'click', target: `win.${app}.close`, say }

const DEFS: PlanDef[] = [
  {
    id: 'messages',
    os: ['android'],
    example: "Text Sam that I'm on my way",
    match: /\b(text|message|sms|send|tell|reply)\b/i,
    param: (t) => {
      const m = t.match(/(?:saying|that|:)\s+(.+)$/i)
      if (!m) return null
      let msg = cap(clean(m[1]).replace(/\bI'm\b/i, "I'm"))
      if (!/[.!?]$/.test(msg)) msg += '!'
      return msg.slice(0, 80)
    },
    build: (_os, param) => {
      const msg = param ?? DEFAULT_MESSAGE
      return {
        id: 'messages',
        task: 'Text Sam',
        done: 'Message sent and Sam replied.',
        steps: [
          { do: 'click', target: 'home.messages', say: 'Open Messages' },
          { do: 'click', target: 'msg.thread.0', say: 'Open the chat with Sam' },
          { do: 'type', target: 'msg.input', text: msg, say: 'Write the message' },
          { do: 'click', target: 'msg.send', say: 'Send it' },
          { do: 'wait', ms: 2600, say: 'Wait for a reply' },
          { do: 'click', target: 'app.back', say: 'Back to all chats' },
          { do: 'click', target: 'nav.home', say: 'Go back to the home screen' },
        ],
      }
    },
  },
  {
    id: 'terminal',
    os: ['linux'],
    example: 'Check how much disk space is left',
    match: /\b(disk|space|storage|memory|ram|terminal|command|shell|uptime|cpu)\b/i,
    build: () => ({
      id: 'terminal',
      task: 'Check disk space and memory',
      done: 'Disk is 34% full, plenty of memory free.',
      steps: [
        { do: 'click', target: 'dock.terminal', say: 'Open Terminal' },
        { do: 'type', target: 'term.input', text: 'df -h', enter: true, say: 'Check disk space' },
        { do: 'wait', ms: 900 },
        { do: 'type', target: 'term.input', text: 'free -h', enter: true, say: 'Check memory' },
        { do: 'wait', ms: 900 },
        { do: 'type', target: 'term.input', text: 'uptime', enter: true, say: 'See how long it has been running' },
        { do: 'wait', ms: 1600, say: 'Read the results' },
        { do: 'click', target: 'win.terminal.close', say: 'Close Terminal' },
      ],
    }),
  },
  {
    id: 'calc',
    os: ['windows', 'android', 'linux'],
    example: 'Split a $126 dinner bill 4 ways',
    match: /\b(calc|calculate|split|bill|tip|add up|math|sum)\b|\d\s*[+\-*/x×÷]\s*\d/i,
    param: (t) => {
      const e = t.match(/(\d+(?:\.\d+)?)\s*([+\-*/x×÷])\s*(\d+(?:\.\d+)?)/)
      if (e) return `${e[1]}${{ x: '*', '×': '*', '÷': '/' }[e[2]] ?? e[2]}${e[3]}`
      const nums = t.match(/\d+(?:\.\d+)?/g)
      if (/split|share|between|ways/i.test(t) && nums && nums.length >= 2) return `${nums[0]}/${nums[1]}`
      return null
    },
    build: (os, param) => {
      const { keys, label, result } = calcKeys(param ?? DEFAULT_SUM)
      return {
        id: 'calc',
        task: param ? `Work out ${label}` : 'Split a $126 bill four ways',
        done: param ? `${label} = ${result}` : `Each person pays $${Number(result).toFixed(2)}.`,
        steps: [
          ...launch(os, 'calc', 'Open Calculator'),
          ...keys.map((k, i): Step => ({ do: 'click', target: `calc.${k}`, say: i === 0 ? `Enter ${label}` : undefined })),
          { do: 'click', target: 'calc.eq', say: 'Work it out' },
          { do: 'hover', target: 'calc.display', say: `The answer is ${result}` },
          { do: 'wait', ms: 1500 },
          close(os, 'calc', 'Close Calculator'),
        ],
      }
    },
  },
  {
    id: 'files',
    os: ['windows', 'linux'],
    example: 'Find my tax receipts',
    match: /\b(files?|folders?|documents?|tax|taxes|receipts?|tidy|organi[sz]e)\b/i,
    build: (os) => ({
      id: 'files',
      task: 'Find the tax receipts',
      done: 'Found them: $1,387.20 deductible in total.',
      steps: [
        os === 'windows'
          ? { do: 'click', target: 'desk.files', dbl: true, say: 'Open Files' }
          : { do: 'click', target: 'dock.files', say: 'Open Files' },
        { do: 'click', target: 'files.nav.documents', say: 'Go to Documents' },
        { do: 'click', target: 'files.item.Taxes 2025', dbl: true, say: 'Open the “Taxes 2025” folder' },
        { do: 'click', target: 'files.item.receipts.txt', say: 'Select receipts.txt' },
        { do: 'click', target: 'files.item.receipts.txt', dbl: true, say: 'Open it' },
        { do: 'scroll', target: os === 'linux' ? 'editor.text' : 'notes.text', by: 240, say: 'Look for the total' },
        { do: 'wait', ms: 1400 },
        { do: 'click', target: os === 'linux' ? 'win.editor.close' : 'win.notes.close', say: 'Close the file' },
        { do: 'click', target: 'win.files.close', say: 'Close Files' },
      ],
    }),
  },
  {
    id: 'browser',
    os: ['windows', 'android', 'linux'],
    example: 'Search for an easy lentil soup recipe',
    match: /\b(search|web|browse|look up|google|recipe|weather|news|find|how to|what|where|who)\b/i,
    param: (t) => {
      const m = t.match(/(?:search(?:\s+the\s+web)?(?:\s+for)?|look\s+up|google|find(?:\s+me)?|browse(?:\s+for)?)\s+(.+)/i)
      const q = clean(m?.[1] ?? t).replace(/^(a|an|the|some)\s+/i, '')
      return q ? q.slice(0, 60) : null
    },
    build: (os, param) => {
      const q = param ?? DEFAULT_QUERY
      const open: Step[] =
        os === 'android'
          ? [
              { do: 'click', target: 'home.search', say: 'Tap the search bar' },
              { do: 'type', target: 'browser.address', text: q, enter: true, clear: true, say: `Search for “${q}”` },
            ]
          : [
              ...launch(os, 'browser', 'Open the browser'),
              { do: 'click', target: 'web.search', say: 'Click the search box' },
              { do: 'type', target: 'web.search', text: q, enter: true, say: `Search for “${q}”` },
            ]
      return {
        id: 'browser',
        task: `Search the web for “${q}”`,
        done: 'Found a good page and read it.',
        steps: [
          ...open,
          { do: 'wait', ms: 700 },
          { do: 'scroll', target: 'browser.page', by: 300, say: 'Skim the results' },
          { do: 'scroll', target: 'browser.page', by: -300 },
          { do: 'click', target: 'web.result.0', say: 'Open the top result' },
          { do: 'wait', ms: 700 },
          { do: 'scroll', target: 'browser.page', by: 420, say: 'Read the page' },
          { do: 'scroll', target: 'browser.page', by: 420 },
          { do: 'wait', ms: 900 },
          close(os, 'browser', 'Close the browser'),
        ],
      }
    },
  },
  {
    id: 'notes',
    os: ['windows', 'android', 'linux'],
    example: 'Make a grocery list',
    match: /\b(grocer(y|ies)|shopping|list|notes?|write|todo|to-do|remind|jot)\b/i,
    param: (t) => {
      const m = t.match(/(?:with|of|:|containing)\s+(.+)$/i)
      if (!m) return null
      const items = clean(m[1])
        .split(/,\s*|\s+and\s+|\s*&\s*/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10)
      return items.length >= 2 ? items.join('|') : null
    },
    build: (os, param) => {
      const list = listText(param)
      const task = param ? 'Write a shopping list' : 'Write a grocery list'
      if (os === 'android') {
        return {
          id: 'notes',
          task,
          done: 'List saved in Notes.',
          steps: [
            { do: 'click', target: 'home.notes', say: 'Open Notes' },
            { do: 'click', target: 'notes.new', say: 'Start a new note' },
            { do: 'type', target: 'notes.title', text: list.title, say: 'Give it a title' },
            { do: 'click', target: 'notes.body' },
            { do: 'type', target: 'notes.body', text: list.body, say: 'Type the list' },
            { do: 'wait', ms: 900, say: 'Check nothing is missing' },
            { do: 'click', target: 'app.back', say: 'Save the note' },
            { do: 'wait', ms: 1200 },
            { do: 'click', target: 'nav.home', say: 'Go back to the home screen' },
          ],
        }
      }
      if (os === 'linux') {
        return {
          id: 'notes',
          task,
          done: 'List saved in Text Editor.',
          steps: [
            { do: 'click', target: 'dock.editor', say: 'Open Text Editor' },
            { do: 'type', target: 'editor.text', text: `# ${list.full}\n`, say: 'Type the list' },
            { do: 'click', target: 'editor.save', say: 'Save the file' },
            { do: 'wait', ms: 1200 },
            { do: 'click', target: 'win.editor.close', say: 'Close the editor' },
          ],
        }
      }
      return {
        id: 'notes',
        task,
        done: 'Grocery list written in Notes.',
        steps: [
          ...launch(os, 'notes', 'Open Notes'),
          { do: 'type', target: 'notes.text', text: list.full, say: 'Type the list' },
          { do: 'wait', ms: 900, say: 'Check nothing is missing' },
          { do: 'click', target: 'win.notes.min', say: 'Minimise Notes' },
          { do: 'wait', ms: 700 },
          { do: 'click', target: 'taskbar.notes', say: 'Bring Notes back' },
          { do: 'wait', ms: 600 },
          { do: 'click', target: 'win.notes.close', say: 'Close Notes' },
        ],
      }
    },
  },
]

export const plansFor = (os: VmOs) => DEFS.filter((d) => d.os.includes(os))

/** The plan an agent starts with when you just flip the switch. */
export const defaultPlan = (os: VmOs) => (os === 'linux' ? 'terminal' : os === 'android' ? 'notes' : 'notes')

export function buildPlan(os: VmOs, planId: string | null, param: string | null): Plan {
  const def = plansFor(os).find((d) => d.id === planId) ?? plansFor(os).find((d) => d.id === defaultPlan(os))!
  return def.build(os, param)
}

/** Picks a scripted plan for what the user typed, by keyword. */
export function matchTask(os: VmOs, text: string): { planId: string; param: string | null } | null {
  for (const def of plansFor(os)) {
    if (def.match.test(text)) return { planId: def.id, param: def.param?.(text) ?? null }
  }
  return null
}

export const suggestions = (os: VmOs) => plansFor(os).map((d) => d.example)
