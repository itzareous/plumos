import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/controls'
import { hasBlob, type FileNode } from '@/stores/files'
import { formatBytes } from '@/lib/format'
import { kindLabel } from '../lib/kinds'
import { formatFileDate, itemsLabel, type FolderStats } from '../lib/tree'
import { Modal } from './Modal'
import { Thumb } from './Thumb'

export interface ConfirmRequest {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
}

export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  const confirm = () => {
    request?.onConfirm()
    onClose()
  }
  return (
    <Modal open={Boolean(request)} onClose={onClose} label={request?.title ?? 'Confirm'} className="max-w-[380px]" onEnter={confirm}>
      {request && (
        <div className="p-6 pt-7">
          <h2 className="pr-8 text-[18px] font-semibold tracking-tight">{request.title}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-white/60">{request.message}</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirm} data-autofocus>
              {request.confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5 text-[13.5px] [&+&]:border-t [&+&]:border-white/[0.06]">
      <dt className="shrink-0 text-white/50">{label}</dt>
      <dd className="selectable min-w-0 text-right break-words text-white/90 tabular-nums">{children}</dd>
    </div>
  )
}

export function InfoDialog({
  node,
  onClose,
  stats,
  name,
  where,
  onFavorite,
}: {
  node: FileNode | null
  onClose: () => void
  stats: Map<string, FolderStats>
  name: string
  where: string
  onFavorite: (id: string, value: boolean) => void
}) {
  const folder = node?.kind === 'folder'
  const s = node && folder ? stats.get(node.id) : undefined
  return (
    <Modal open={Boolean(node)} onClose={onClose} label={`Info for ${name}`} className="max-w-[420px]">
      {node && (
        <div className="p-6 pt-7">
          <div className="flex items-center gap-4 pr-8">
            <span className="flex size-16 shrink-0 items-center justify-center">
              <Thumb node={node} size={60} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[17px] leading-snug font-semibold tracking-tight break-words">{name}</h2>
              <p className="text-[13px] text-white/50 tabular-nums">
                {kindLabel(node.kind, node.name)} · {formatBytes(folder ? (s?.bytes ?? 0) : node.size)}
              </p>
            </div>
          </div>
          <dl className="mt-5 rounded-2xl bg-white/[0.05] px-4 ring-1 ring-inset ring-white/[0.07]">
            <InfoRow label="Kind">{kindLabel(node.kind, node.name)}</InfoRow>
            <InfoRow label="Size">
              {folder
                ? `${formatBytes(s?.bytes ?? 0)} · ${itemsLabel(s?.count ?? 0)}`
                : `${formatBytes(node.size)} (${node.size.toLocaleString()} bytes)`}
            </InfoRow>
            <InfoRow label={node.trashed ? 'Deleted from' : 'Where'}>{where || '—'}</InfoRow>
            <InfoRow label="Modified">{formatFileDate(node.modified)}</InfoRow>
            {node.added && <InfoRow label="Added">{formatFileDate(node.added)}</InfoRow>}
            {node.opened && <InfoRow label="Last opened">{formatFileDate(node.opened)}</InfoRow>}
            {node.trashed && <InfoRow label="Deleted">{formatFileDate(node.trashed.at)}</InfoRow>}
            {node.uploaded && (
              <InfoRow label="Contents">{hasBlob(node.id) ? 'Uploaded from this browser' : 'Cleared after reload (demo)'}</InfoRow>
            )}
          </dl>
          {!node.trashed && (
            <label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-3 ring-1 ring-inset ring-white/[0.07]">
              <span className="text-[14px] font-medium">Favorite</span>
              <Switch checked={Boolean(node.favorite)} onChange={(v) => onFavorite(node.id, v)} label="Favorite" />
            </label>
          )}
          <div className="mt-5 flex justify-end">
            <Button variant="secondary" onClick={onClose} data-autofocus>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
