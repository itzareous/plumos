import { memo, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Star } from 'lucide-react'
import type { FileNode } from '@/stores/files'
import { cn } from '@/lib/cn'
import { RenameField, type BindItem, type ItemBinding, type RenameApi } from './items'
import { Thumb } from './Thumb'

interface GridViewProps {
  items: FileNode[]
  bind: BindItem
  rename: RenameApi
  names: (node: FileNode) => string
  label: string
  /** Reports how many columns fit, for arrow-key movement. */
  onColumns: (n: number) => void
}

export function GridView({ items, bind, rename, names, label, onColumns }: GridViewProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => onColumns(Math.max(1, getComputedStyle(el).gridTemplateColumns.split(' ').length))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [onColumns])

  return (
    <div
      ref={ref}
      role="listbox"
      aria-multiselectable="true"
      aria-label={label}
      className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-x-1.5 gap-y-2 sm:grid-cols-[repeat(auto-fill,minmax(124px,1fr))] sm:gap-x-2"
    >
      {items.map((node, i) => (
        <GridItem key={node.id} node={node} index={i} name={names(node)} binding={bind(node)} rename={rename} />
      ))}
    </div>
  )
}

const GridItem = memo(
  function GridItem({
    node,
    index,
    name,
    binding,
    rename,
  }: {
    node: FileNode
    index: number
    name: string
    binding: ItemBinding
    rename: RenameApi
  }) {
    const { selected, focused, renaming, dropping, subtitle, handlers } = binding
    return (
      <div
        role="option"
        aria-selected={selected}
        aria-label={name}
        data-file-id={node.id}
        tabIndex={focused ? 0 : -1}
        className="group min-w-0 cursor-default rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        {...handlers}
      >
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32, delay: Math.min(index, 24) * 0.012 }}
          className="flex flex-col items-center gap-1 px-1 pt-1.5 pb-2"
        >
          <div
            className={cn(
              'relative flex h-[92px] w-full items-center justify-center rounded-[14px] transition-colors duration-150 sm:h-[100px]',
              selected ? 'bg-white/[0.11]' : 'group-hover:bg-white/[0.045]',
              dropping && 'bg-accent-soft ring-2 ring-accent ring-inset',
            )}
          >
            <Thumb node={node} size={78} />
            {node.favorite && (
              <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm">
                <Star size={11} className="fill-amber-300 text-amber-300" />
              </span>
            )}
          </div>
          {renaming ? (
            <RenameField node={node} api={rename} className="w-full text-center" />
          ) : (
            <span
              className={cn(
                'line-clamp-2 max-w-full rounded-[6px] px-1.5 py-px text-center text-[12.5px] leading-[1.35] font-medium break-words transition-colors',
                selected ? 'bg-accent text-black/90' : 'text-white/90',
              )}
            >
              {name}
            </span>
          )}
          <span className="max-w-full truncate px-1 text-[11px] leading-tight text-white/40 tabular-nums">{subtitle}</span>
        </motion.div>
      </div>
    )
  },
  (a, b) =>
    a.node === b.node &&
    a.name === b.name &&
    a.index === b.index &&
    a.rename === b.rename &&
    a.binding.selected === b.binding.selected &&
    a.binding.focused === b.binding.focused &&
    a.binding.renaming === b.binding.renaming &&
    a.binding.dropping === b.binding.dropping &&
    a.binding.subtitle === b.binding.subtitle &&
    a.binding.handlers === b.binding.handlers,
)
