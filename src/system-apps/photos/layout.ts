import type { Photo } from '@/lib/photos'
import { monthKey, monthLabel, placesSummary } from './format'

export type Grouping = 'month' | 'none'

export interface Group {
  key: number
  label: string
  places: string
  /** y of the group's header, relative to the grid content. */
  start: number
  /** y of the first row of tiles. */
  top: number
  index0: number
  count: number
  rows: number
  year: number
}

export interface GridLayout {
  cols: number
  size: number
  gap: number
  stride: number
  groups: Group[]
  total: number
  grouping: Grouping
}

export const HEADER_H = 54
const GROUP_GAP = 18
const BOTTOM_PAD = 120

export function columnsFor(width: number, density: number) {
  const targets = width < 640 ? [46, 68, 110, 168] : [74, 110, 158, 236]
  return Math.max(width < 640 && density === 3 ? 2 : 3, Math.round(width / targets[density]))
}

export function computeLayout(items: Photo[], grouping: Grouping, width: number, density: number): GridLayout {
  const cols = columnsFor(Math.max(1, width), density)
  const gap = density <= 1 ? 2 : 3
  const size = Math.max(1, (width - gap * (cols - 1)) / cols)
  const stride = size + gap
  const groups: Group[] = []
  let y = grouping === 'none' ? 4 : 0

  const push = (index0: number, count: number, label: string, places: string, key: number, year: number) => {
    const rows = Math.ceil(count / cols)
    const start = y
    const top = grouping === 'month' ? y + HEADER_H : y
    groups.push({ key, label, places, start, top, index0, count, rows, year })
    y = top + rows * stride - gap + GROUP_GAP
  }

  if (grouping === 'none') {
    if (items.length) push(0, items.length, '', '', 0, new Date(items[0].date).getFullYear())
  } else {
    let i = 0
    while (i < items.length) {
      const key = monthKey(items[i].date)
      let j = i
      const places: (string | null)[] = []
      while (j < items.length && monthKey(items[j].date) === key) places.push(items[j++].place)
      push(i, j - i, monthLabel(items[i].date), placesSummary(places), key, new Date(items[i].date).getFullYear())
      i = j
    }
  }
  return { cols, size, gap, stride, groups, total: y + BOTTOM_PAD, grouping }
}

/** The group containing tile `index`. */
export function groupOfIndex(layout: GridLayout, index: number): Group | undefined {
  const g = layout.groups
  let lo = 0
  let hi = g.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (index < g[mid].index0) hi = mid - 1
    else if (index >= g[mid].index0 + g[mid].count) lo = mid + 1
    else return g[mid]
  }
  return undefined
}

/** Last group whose header starts at or above `y`. */
export function groupAtY(layout: GridLayout, y: number): number {
  const g = layout.groups
  let lo = 0
  let hi = g.length - 1
  let found = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (g[mid].start <= y) {
      found = mid
      lo = mid + 1
    } else hi = mid - 1
  }
  return found
}

export function tilePosition(layout: GridLayout, index: number): { x: number; y: number } | null {
  const g = groupOfIndex(layout, index)
  if (!g) return null
  const local = index - g.index0
  return { x: (local % layout.cols) * layout.stride, y: g.top + Math.floor(local / layout.cols) * layout.stride }
}

/** Index of the tile one row up or down, keeping the column where possible. */
export function verticalNeighbour(layout: GridLayout, index: number, dir: 1 | -1): number {
  const g = groupOfIndex(layout, index)
  if (!g) return index
  const local = index - g.index0
  const row = Math.floor(local / layout.cols)
  const col = local % layout.cols
  const gi = layout.groups.indexOf(g)
  if (dir === 1) {
    if (row + 1 < g.rows) return Math.min(g.index0 + g.count - 1, index + layout.cols)
    const next = layout.groups[gi + 1]
    return next ? next.index0 + Math.min(col, next.count - 1) : index
  }
  if (row > 0) return index - layout.cols
  const prev = layout.groups[gi - 1]
  if (!prev) return index
  const lastRow = prev.rows - 1
  return prev.index0 + Math.min(prev.count - 1, lastRow * layout.cols + col)
}
