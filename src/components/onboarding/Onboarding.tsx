import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, HardDrive, Layers, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/icons/Logo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/controls'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useSettings } from '@/stores/settings'
import { poolCapacity, useStorage, type PoolMode } from '@/stores/storage'

type Step = 'welcome' | 'name' | 'drives' | 'password' | 'done'
const STEPS: Step[] = ['welcome', 'name', 'drives', 'password', 'done']

/** First-run setup: name, storage pool and password, then the home screen. */
export function Onboarding() {
  const [step, setStep] = useState<Step>('welcome')
  const [name, setName] = useState(useSettings.getState().userName)
  const setSettings = useSettings((s) => s.set)
  const index = STEPS.indexOf(step)
  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, index + 1)])

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-2xl" />
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="glass-dark relative w-full max-w-[520px] overflow-hidden rounded-[32px] px-7 pt-10 pb-7 sm:px-10"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          >
            {step === 'welcome' && <Welcome onNext={next} />}
            {step === 'name' && <NameStep name={name} setName={setName} onNext={next} />}
            {step === 'drives' && <DrivesStep onNext={next} />}
            {step === 'password' && <PasswordStep onNext={next} />}
            {step === 'done' && (
              <Done name={name} onFinish={() => setSettings({ userName: name.trim() || 'Friend', onboarded: true })} />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-center gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={cn('h-1.5 rounded-full transition-all duration-300', i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/25')}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Title({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="text-center">
      <h2 className="text-[26px] leading-tight font-bold tracking-tight">{children}</h2>
      {sub && <p className="mx-auto mt-2 max-w-[360px] text-[15px] text-white/60">{sub}</p>}
    </div>
  )
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
        className="mb-6 flex size-20 items-center justify-center rounded-[26px] bg-gradient-to-b from-[#6d4fd1] to-[#3a2680] shadow-[0_12px_40px_-8px_rgb(109_79_209/0.7)]"
      >
        <Logo size={52} className="text-white" />
      </motion.div>
      <Title sub="Your photos, files and apps — on a server in your home, reachable from any browser.">
        Welcome to Plumos
      </Title>
      <Button variant="primary" size="lg" className="mt-8 w-full max-w-[280px]" onClick={onNext}>
        Get started <ArrowRight size={18} />
      </Button>
    </div>
  )
}

function NameStep({ name, setName, onNext }: { name: string; setName: (n: string) => void; onNext: () => void }) {
  const valid = name.trim().length > 0
  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onNext()
      }}
    >
      <Title sub="This is how Plumos will greet you.">What should we call you?</Title>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        maxLength={32}
        className="mt-7"
        aria-label="Your name"
      />
      <Button type="submit" variant="primary" size="lg" className="mt-5" disabled={!valid}>
        Continue
      </Button>
    </form>
  )
}

function DrivesStep({ onNext }: { onNext: () => void }) {
  const { drives: allDrives, poolMode, setPoolMode } = useStorage()
  // Filter outside the selector: a selector must not return a new array each call.
  const drives = useMemo(() => allDrives.filter((d) => d.location === 'internal'), [allDrives])
  const [found, setFound] = useState(0)
  const scanning = found < drives.length

  useEffect(() => {
    if (!scanning) return
    const id = setTimeout(() => setFound((f) => f + 1), found === 0 ? 1100 : 650)
    return () => clearTimeout(id)
  }, [found, scanning])

  const capacity = poolCapacity(
    drives.map((d) => ({ ...d, inPool: true })),
    poolMode,
  )

  return (
    <div className="flex flex-col">
      <Title sub={scanning ? 'Looking for drives connected to your server…' : `Found ${drives.length} drives. We'll combine them into one storage pool.`}>
        {scanning ? 'Finding your drives' : 'Your storage'}
      </Title>

      <div className="mt-7 space-y-2">
        {drives.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: i < found ? 1 : 0.25, y: 0 }}
            className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3 ring-1 ring-inset ring-white/[0.08]"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/10">
              <HardDrive size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{d.model}</span>
              <span className="block text-xs text-white/50">{formatBytes(d.size)} · {d.kind.toUpperCase()}</span>
            </span>
            {i < found ? (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex size-6 items-center justify-center rounded-full bg-emerald-500">
                <Check size={14} strokeWidth={3} />
              </motion.span>
            ) : (
              <span className="size-5 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {!scanning && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
            <div className="mt-4 grid grid-cols-2 gap-2">
              <PoolChoice
                mode="combined"
                current={poolMode}
                onSelect={setPoolMode}
                icon={<Layers size={18} />}
                title="More space"
                description="Add up every drive"
              />
              <PoolChoice
                mode="mirrored"
                current={poolMode}
                onSelect={setPoolMode}
                icon={<ShieldCheck size={18} />}
                title="More safety"
                description="Keep two copies of everything"
              />
            </div>
            <div className="mt-4 text-center text-sm text-white/60">
              Storage pool: <span className="font-semibold text-white">{formatBytes(capacity)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button variant="primary" size="lg" className="mt-6" disabled={scanning} onClick={onNext}>
        {scanning ? 'Scanning…' : 'Create storage pool'}
      </Button>
    </div>
  )
}

function PoolChoice({
  mode,
  current,
  onSelect,
  icon,
  title,
  description,
}: {
  mode: PoolMode
  current: PoolMode
  onSelect: (m: PoolMode) => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  const active = mode === current
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      aria-pressed={active}
      className={cn(
        'rounded-2xl p-3.5 text-left ring-1 ring-inset transition',
        active ? 'bg-white/[0.14] ring-white/40' : 'bg-white/[0.05] ring-white/[0.08] hover:bg-white/[0.08]',
      )}
    >
      <span className="text-white/85">{icon}</span>
      <span className="mt-2 block text-sm font-semibold">{title}</span>
      <span className="block text-xs text-white/50">{description}</span>
    </button>
  )
}

function PasswordStep({ onNext }: { onNext: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const strength = Math.min(4, [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length)
  const matches = password.length >= 8 && password === confirm
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-emerald-400']
  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        if (matches) onNext()
      }}
    >
      <Title sub="You'll use it to sign in to Plumos from any device.">Create a password</Title>
      <Input
        autoFocus
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (at least 8 characters)"
        className="mt-7"
        aria-label="Password"
      />
      <div className="mt-2 flex gap-1 px-1" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i < strength ? colors[strength] : 'bg-white/10')} />
        ))}
      </div>
      <Input
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm password"
        className="mt-3"
        aria-label="Confirm password"
      />
      {confirm.length > 0 && !matches && (
        <p className="mt-2 px-1 text-xs text-orange-300">
          {password.length < 8 ? 'Use at least 8 characters.' : "Passwords don't match."}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg" className="mt-5" disabled={!matches}>
        Continue
      </Button>
    </form>
  )
}

function Done({ name, onFinish }: { name: string; onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 15 }}
        className="mb-6 flex size-16 items-center justify-center rounded-full bg-emerald-500 shadow-[0_10px_40px_-6px_rgb(16_185_129/0.7)]"
      >
        <Check size={32} strokeWidth={3} />
      </motion.div>
      <Title sub="Your server is ready. Install apps, back up your phone and invite the people you live with.">
        You're all set{name.trim() ? `, ${name.trim()}` : ''}!
      </Title>
      <Button variant="primary" size="lg" className="mt-8 w-full max-w-[280px]" onClick={onFinish}>
        Go to your home screen
      </Button>
    </div>
  )
}
