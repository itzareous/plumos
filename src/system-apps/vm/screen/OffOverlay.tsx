import { motion } from 'motion/react'
import { Power } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/** Covers the display while the guest is off. Rendered at page scale so it stays readable. */
export function OffOverlay({ name, detail, onStart }: { name: string; detail: string; onStart: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#1b1d26,#08090d)] px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-white/[0.07] text-white/60 ring-1 ring-white/10">
        <Power size={24} />
      </span>
      <p className="mt-4 text-[17px] font-semibold text-white">This virtual machine is off</p>
      <p className="mt-1 max-w-[320px] text-[13px] text-white/50">
        {name} · {detail}
      </p>
      <Button variant="primary" className="mt-5" icon={<Power size={16} />} onClick={onStart}>
        Start
      </Button>
    </motion.div>
  )
}
