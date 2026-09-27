import type { Drive } from '@/stores/storage'

export const KIND_LABEL: Record<Drive['kind'], string> = {
  nvme: 'NVMe SSD',
  ssd: 'SSD',
  hdd: 'hard drive',
  usb: 'USB drive',
}

export const HEALTH: Record<Drive['health'], { label: string; className: string }> = {
  healthy: { label: 'Healthy', className: 'bg-emerald-400/15 text-emerald-300' },
  warning: { label: 'Check soon', className: 'bg-amber-400/15 text-amber-300' },
  failing: { label: 'Failing', className: 'bg-red-400/15 text-red-300' },
}
