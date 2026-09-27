import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/controls'

export function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault()
            onChange('')
          }
        }}
        placeholder="Search"
        aria-label="Search settings"
        icon={<Search size={15} />}
        className="[&_input]:h-9 [&_input]:rounded-[10px] [&_input]:pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white/80 transition hover:bg-white/30"
        >
          <X size={12} strokeWidth={2.6} />
        </button>
      )}
    </div>
  )
}
