import type { ReactNode } from 'react'

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 px-4 py-3 [&+&]:border-t [&+&]:border-white/[0.06]">
      <dt className="shrink-0 text-sm text-white/55">{label}</dt>
      <dd className="selectable min-w-0 text-right text-sm font-medium break-words text-white tabular-nums">{children}</dd>
    </div>
  )
}
