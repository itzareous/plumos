import type { MenuEntry } from '@/components/ui/ContextMenu'

const ROW = 36
const SEPARATOR = 9
const PADDING = 14
const MARGIN = 10

/**
 * Where to open a menu so it stays on screen. The shared menu measures itself
 * while it's still scaled down by its entrance animation, so near the right or
 * bottom edge it can spill a little off screen; nudging it in first avoids that.
 */
export function menuPosition(x: number, y: number, items: MenuEntry[]) {
  const rows = items.filter((i) => i !== 'separator')
  const height = rows.length * ROW + (items.length - rows.length) * SEPARATOR + PADDING
  const longest = rows.reduce((max, i) => Math.max(max, i.label.length), 0)
  const width = Math.max(200, 64 + longest * 7.8)
  return {
    x: Math.max(MARGIN, Math.min(x, window.innerWidth - width - MARGIN)),
    y: Math.max(MARGIN, Math.min(y, window.innerHeight - height - MARGIN)),
  }
}
