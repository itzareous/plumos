/** Low-level helpers the agent uses to act on the guest's DOM like a person would. */

export class AbortedError extends Error {
  constructor() {
    super('aborted')
  }
}

export class NotFoundError extends Error {
  target: string
  constructor(target: string) {
    super(`Couldn't find ${target}`)
    this.target = target
  }
}

export function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new AbortedError())
    const t = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(t)
      reject(new AbortedError())
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a)

function visible(root: HTMLElement, el: HTMLElement) {
  if (el.closest('[data-hidden]')) return false
  const r = el.getBoundingClientRect()
  const box = root.getBoundingClientRect()
  if (r.width < 1 || r.height < 1) return false
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  return cx > box.left && cx < box.right && cy > box.top && cy < box.bottom
}

/** Waits for an element tagged `data-agent="target"` to be on screen and settled (not mid-animation). */
export async function find(root: HTMLElement, target: string, signal: AbortSignal, timeout = 3500) {
  const selector = `[data-agent="${CSS.escape(target)}"]`
  const start = performance.now()
  let last: DOMRect | null = null
  while (performance.now() - start < timeout) {
    const els = [...root.querySelectorAll<HTMLElement>(selector)]
    const el = els.find((e) => visible(root, e))
    if (el) {
      const r = el.getBoundingClientRect()
      if (last && Math.abs(r.left - last.left) < 0.5 && Math.abs(r.top - last.top) < 0.5 && Math.abs(r.width - last.width) < 0.5) return el
      last = r
    } else last = null
    await sleep(90, signal)
  }
  throw new NotFoundError(target)
}

/** Point on the element in guest (unscaled) coordinates. */
export function pointOn(root: HTMLElement, el: HTMLElement, logicalWidth: number, anchor: 'center' | 'text' = 'center') {
  const box = root.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  const s = box.width / logicalWidth
  const x = anchor === 'text' && r.width > 120 ? r.left + Math.min(56, r.width / 3) : r.left + r.width / 2
  const y = anchor === 'text' && r.height > 60 ? r.top + Math.min(32, r.height / 3) : r.top + r.height / 2
  return { x: (x - box.left) / s, y: (y - box.top) / s }
}

/** Sets an input's value the way typing does, so React's onChange fires. */
export function setValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
  if (el instanceof HTMLTextAreaElement) el.scrollTop = el.scrollHeight
  else el.scrollLeft = el.scrollWidth
}

export function pressKey(el: HTMLElement, key: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }))
}

export function doubleClick(el: HTMLElement) {
  el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, detail: 2 }))
}

/** A human-ish delay after typing a character. */
export function keyDelay(ch: string) {
  if (ch === '\n') return rand(220, 360)
  if (/[.,!?:]/.test(ch)) return rand(110, 180)
  if (ch === ' ') return rand(60, 110)
  return rand(34, 78)
}
