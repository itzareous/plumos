import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Segmented } from '@/components/ui/controls'

type Platform = 'mac' | 'windows'

const guess = (): Platform => (/Win/i.test(navigator.userAgent) ? 'windows' : 'mac')

const B = ({ children }: { children: ReactNode }) => <span className="font-semibold text-white">{children}</span>
const Code = ({ children }: { children: ReactNode }) => <code className="selectable font-mono text-[12.5px] text-white">{children}</code>

/** Short how-to for opening Plumos as a network drive. */
export function ConnectSteps({ smb, unc }: { smb: string; unc: string }) {
  const [platform, setPlatform] = useState<Platform>(guess)
  const steps: ReactNode[] =
    platform === 'mac'
      ? [
          <>
            In <B>Finder</B>, choose <B>Go › Connect to Server</B> (⌘K).
          </>,
          <>
            Enter <Code>{smb}</Code> and click <B>Connect</B>.
          </>,
          <>Sign in with your Plumos name and password. Your folder and Shared appear in the Finder sidebar.</>,
        ]
      : [
          <>
            Open <B>File Explorer</B> and click the address bar.
          </>,
          <>
            Type <Code>{unc}</Code> and press <B>Enter</B>.
          </>,
          <>
            Sign in with your Plumos name and password. Right-click a folder and choose <B>Map network drive</B> to keep it.
          </>,
        ]

  return (
    <div>
      <Segmented
        value={platform}
        onChange={setPlatform}
        options={[
          { value: 'mac', label: 'Mac' },
          { value: 'windows', label: 'Windows' },
        ]}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.ol
          key={platform}
          initial={{ opacity: 0, x: platform === 'mac' ? -8 : 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="mt-4 flex flex-col gap-2.5"
        >
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-white/70">
              <span className="mt-px flex size-[22px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-bold text-accent tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0">{step}</span>
            </li>
          ))}
        </motion.ol>
      </AnimatePresence>
    </div>
  )
}
