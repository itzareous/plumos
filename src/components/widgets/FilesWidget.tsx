import { useWindows } from '@/stores/windows'
import { FolderIcon } from '@/components/icons/FolderIcon'
import { WidgetFrame } from './WidgetFrame'

const FOLDERS = ['Downloads', 'Documents', 'Photos', 'Videos']

export function FilesWidget() {
  const open = useWindows((s) => s.open)
  return (
    <WidgetFrame label="Files" padded={false}>
      <div className="grid h-full grid-cols-2 grid-rows-2 gap-2 p-2.5">
        {FOLDERS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => open('files', { path: `/Home/${name}` })}
            className="flex min-w-0 items-center gap-2 rounded-[16px] bg-white/[0.09] px-2.5 text-left ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.16] active:scale-[0.97]"
          >
            <FolderIcon size={22} className="shrink-0" />
            <span className="truncate text-[12.5px] font-semibold text-white/90">{name}</span>
          </button>
        ))}
      </div>
    </WidgetFrame>
  )
}
