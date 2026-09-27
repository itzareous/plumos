import { create } from 'zustand'

export type AgentStatus = 'idle' | 'running' | 'paused'
export type CursorMode = 'pointer' | 'text' | 'scroll'

export interface LogEntry {
  id: number
  at: number
  text: string
  kind: 'step' | 'info' | 'done' | 'warn' | 'user'
}

interface AgentState {
  enabled: boolean
  status: AgentStatus
  planId: string | null
  /** Plan parameter pulled from the user's task (a search query, a message…). */
  param: string | null
  /** Human-readable description of the current task. */
  task: string
  step: number
  total: number
  log: LogEntry[]
  /** Bumped to restart the runner with a new plan. */
  runKey: number
  cursorMode: CursorMode
  /** Bumped on every agent click, for the ripple. */
  presses: number

  enable: (planId: string, task: string, intro: string) => void
  disable: () => void
  assign: (planId: string, param: string | null, task: string, userText: string) => void
  pause: (reason: string) => void
  resume: () => void
  rewind: () => void
  push: (text: string, kind?: LogEntry['kind']) => void
  setStep: (step: number, total: number) => void
  setCursor: (mode: CursorMode) => void
  press: () => void
  reset: () => void
}

let nextId = 1
const entry = (text: string, kind: LogEntry['kind']): LogEntry => ({ id: nextId++, at: Date.now(), text, kind })
const MAX_LOG = 80

const initial = {
  enabled: false,
  status: 'idle' as AgentStatus,
  planId: null,
  param: null,
  task: '',
  step: 0,
  total: 0,
  log: [] as LogEntry[],
  runKey: 0,
  cursorMode: 'pointer' as CursorMode,
  presses: 0,
}

/** State of the demo AI agent driving the open VM. One VM viewer is open at a time. */
export const useAgent = create<AgentState>((set) => ({
  ...initial,

  enable: (planId, task, intro) =>
    set((s) => ({
      enabled: true,
      status: 'running',
      planId: s.planId ?? planId,
      task: s.planId ? s.task : task,
      step: 0,
      runKey: s.runKey + 1,
      log: [...s.log, entry(intro, 'info')].slice(-MAX_LOG),
    })),

  disable: () =>
    set((s) => ({
      enabled: false,
      status: 'idle',
      step: 0,
      cursorMode: 'pointer',
      log: [...s.log, entry('Agent disconnected. You have the controls.', 'info')].slice(-MAX_LOG),
    })),

  assign: (planId, param, task, userText) =>
    set((s) => ({
      enabled: true,
      status: 'running',
      planId,
      param,
      task,
      step: 0,
      runKey: s.runKey + 1,
      log: [...s.log, entry(userText, 'user')].slice(-MAX_LOG),
    })),

  pause: (reason) =>
    set((s) =>
      s.status === 'running' ? { status: 'paused', cursorMode: 'pointer', log: [...s.log, entry(reason, 'warn')].slice(-MAX_LOG) } : s,
    ),

  resume: () =>
    set((s) => (s.status === 'paused' ? { status: 'running', log: [...s.log, entry('Picking up where I left off.', 'info')].slice(-MAX_LOG) } : s)),

  rewind: () => set((s) => (s.step === 0 ? s : { step: 0, runKey: s.runKey + 1 })),

  push: (text, kind = 'info') => set((s) => ({ log: [...s.log, entry(text, kind)].slice(-MAX_LOG) })),
  setStep: (step, total) => set({ step, total }),
  setCursor: (cursorMode) => set({ cursorMode }),
  press: () => set((s) => ({ presses: s.presses + 1 })),
  reset: () => set({ ...initial }),
}))
