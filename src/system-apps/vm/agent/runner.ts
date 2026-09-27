import { useEffect, useRef, type RefObject } from 'react'
import { animate, type MotionValue } from 'motion/react'
import { SCREEN, type DeskBridge, type Power, type VmOs } from '../types'
import { AbortedError, doubleClick, find, keyDelay, NotFoundError, pointOn, pressKey, rand, setValue, sleep } from './dom'
import { buildPlan, type Step } from './plans'
import { useAgent } from './store'

const EASE: [number, number, number, number] = [0.42, 0, 0.22, 1]

function tween(duration: number, onUpdate: (t: number) => void, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new AbortedError())
    const onAbort = () => {
      controls.stop()
      reject(new AbortedError())
    }
    const controls = animate(0, 1, {
      duration,
      ease: EASE,
      onUpdate,
      onComplete: () => {
        signal.removeEventListener('abort', onAbort)
        resolve()
      },
    })
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

interface Options {
  os: VmOs
  power: Power
  screenRef: RefObject<HTMLDivElement | null>
  bridge: RefObject<DeskBridge | null>
  x: MotionValue<number>
  y: MotionValue<number>
}

/**
 * Runs the agent's scripted plan against the guest: glides the cursor along
 * curved paths, clicks, types character by character and scrolls. Loops
 * until paused, stopped or given a new task.
 */
export function useAgentRunner({ os, power, screenRef, bridge, x, y }: Options) {
  const enabled = useAgent((s) => s.enabled)
  const status = useAgent((s) => s.status)
  const runKey = useAgent((s) => s.runKey)
  /** Where we got to, so a resumed step doesn't redo finished work. */
  const progress = useRef({ key: -1, step: -1, char: 0, done: false })

  useEffect(() => {
    if (!enabled || status !== 'running' || power !== 'running') return
    const controller = new AbortController()
    const ctx = controller.signal
    const store = useAgent.getState
    const W = SCREEN[os].w

    const root = () => {
      const el = screenRef.current
      if (!el) throw new NotFoundError('screen')
      return el
    }

    const moveTo = async (tx: number, ty: number) => {
      const fx = x.get()
      const fy = y.get()
      const dx = tx - fx
      const dy = ty - fy
      const dist = Math.hypot(dx, dy)
      if (dist < 2) return
      // Bend the path a little to one side, like a hand moving a mouse.
      const bend = (Math.random() > 0.5 ? 1 : -1) * Math.min(W * 0.1, dist * rand(0.12, 0.26))
      const cx = (fx + tx) / 2 - (dy / dist) * bend
      const cy = (fy + ty) / 2 + (dx / dist) * bend
      const duration = Math.min(1.25, Math.max(0.42, 0.3 + (dist / W) * 0.9))
      await tween(
        duration,
        (t) => {
          const u = 1 - t
          x.set(u * u * fx + 2 * u * t * cx + t * t * tx)
          y.set(u * u * fy + 2 * u * t * cy + t * t * ty)
        },
        ctx,
      )
    }

    const goTo = async (target: string, anchor: 'center' | 'text' = 'center') => {
      const el = await find(root(), target, ctx)
      const p = pointOn(root(), el, W, anchor)
      await moveTo(p.x, p.y)
      // It may have moved while we travelled (a window opening, say): correct.
      const q = pointOn(root(), el, W, anchor)
      if (Math.hypot(q.x - p.x, q.y - p.y) > 3) await moveTo(q.x, q.y)
      return el
    }

    const click = async (el: HTMLElement, dbl = false) => {
      await sleep(rand(90, 170), ctx)
      store().press()
      el.click()
      if (dbl) {
        await sleep(110, ctx)
        store().press()
        doubleClick(el)
      }
    }

    const exec = async (step: Step, resume: { char: number }) => {
      switch (step.do) {
        case 'wait':
          return sleep(step.ms, ctx)
        case 'hover':
          await goTo(step.target)
          return
        case 'click': {
          const el = await goTo(step.target)
          await click(el, step.dbl)
          return
        }
        case 'scroll': {
          const el = await goTo(step.target, 'text')
          store().setCursor('scroll')
          const from = el.scrollTop
          const to = Math.max(0, Math.min(el.scrollHeight - el.clientHeight, from + step.by))
          await tween(Math.min(1.1, 0.45 + Math.abs(to - from) / 700), (t) => (el.scrollTop = from + (to - from) * t), ctx)
          await sleep(200, ctx)
          store().setCursor('pointer')
          return
        }
        case 'type': {
          const el = (await goTo(step.target, 'text')) as HTMLInputElement | HTMLTextAreaElement
          if (resume.char === 0) {
            await click(el)
            if (step.clear) setValue(el, '')
          }
          store().setCursor('text')
          await sleep(220, ctx)
          for (let i = resume.char; i < step.text.length; i++) {
            const ch = step.text[i]
            setValue(el, el.value + ch)
            progress.current.char = i + 1
            await sleep(keyDelay(ch), ctx)
          }
          if (step.enter) {
            await sleep(260, ctx)
            pressKey(el, 'Enter')
          }
          store().setCursor('pointer')
          return
        }
      }
    }

    const run = async () => {
      const key = store().runKey
      const plan = buildPlan(os, store().planId, store().param)
      let i = store().step
      const p = progress.current
      if (p.key !== key || p.step !== i) progress.current = { key, step: -1, char: 0, done: false }

      await sleep(700, ctx)
      if (i === 0 && progress.current.step === -1) {
        bridge.current?.reset()
        await sleep(450, ctx)
      }

      for (;;) {
        for (; i < plan.steps.length; i++) {
          const step = plan.steps[i]
          const resuming = progress.current.step === i
          if (resuming && progress.current.done) continue
          store().setStep(i, plan.steps.length)
          if (!resuming) {
            progress.current = { key, step: i, char: 0, done: false }
            if (step.say) store().push(step.say, 'step')
          }
          try {
            await exec(step, { char: progress.current.char })
          } catch (e) {
            if (!(e instanceof NotFoundError)) throw e
            store().push("That isn't on screen any more, so I'm starting over.", 'warn')
            store().setCursor('pointer')
            await sleep(1200, ctx)
            bridge.current?.reset()
            await sleep(600, ctx)
            progress.current = { key, step: -1, char: 0, done: false }
            i = -1
            continue
          }
          progress.current.done = true
          await sleep(rand(320, 640), ctx)
        }
        store().setStep(plan.steps.length, plan.steps.length)
        store().push(plan.done, 'done')
        await sleep(3400, ctx)
        store().push('Running the task again.', 'info')
        bridge.current?.reset()
        progress.current = { key, step: -1, char: 0, done: false }
        await sleep(900, ctx)
        i = 0
      }
    }

    run().catch((e) => {
      if (!(e instanceof AbortedError)) console.warn('[vm agent]', e)
    })
    return () => {
      controller.abort()
      useAgent.getState().setCursor('pointer')
    }
  }, [enabled, status, power, runKey, os, screenRef, bridge, x, y])
}
