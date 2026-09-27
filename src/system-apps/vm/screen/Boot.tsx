import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Logo } from '@/components/icons/Logo'
import { BOOT_MS, type VmOs, type VmSpec } from '../types'
import { DotSpinner, PeakMark, PetalMark, SproutMark } from './marks'

function firmwareLines(spec: VmSpec) {
  return [
    'Plumos Virtual Firmware  v2.4.1',
    'Copyright (C) Plumos contributors',
    '',
    `CPU: ${spec.cpus} x virtual core ........................ OK`,
    `Memory test: ${(spec.memoryGb * 1024).toLocaleString('en-US')} MB ................ OK`,
    `Disk 0: virtio-blk  ${spec.diskGb} GB ...................... OK`,
    'Network: virtio-net  52:54:00:3a:1c:07 ........ OK',
    '',
    'Booting from Disk 0...',
  ]
}

const KERNEL = [
  '[    0.000000] Starting guest kernel on virtual hardware',
  '[    0.004211] Memory map ready',
  '[    0.118305] vda: virtual disk attached',
  '[    0.201990] eth0: link up',
  '[  OK  ] Mounted root file system.',
  '[  OK  ] Checked disk for errors.',
  '[  OK  ] Network is up.',
  '[  OK  ] Started clock sync.',
  '[  OK  ] Started login manager.',
  '[  OK  ] Starting desktop session...',
]

/** Keeps revealing lines while the boot runs. */
function useReveal(count: number, every: number, delay = 0) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let i = 0
    let t = setTimeout(function step() {
      i++
      setN(i)
      if (i < count) t = setTimeout(step, every)
    }, delay)
    return () => clearTimeout(t)
  }, [count, every, delay])
  return n
}

function usePhase(at: number) {
  const [past, setPast] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setPast(true), at)
    return () => clearTimeout(t)
  }, [at])
  return past
}

export function Boot({ os, spec }: { os: VmOs; spec: VmSpec }) {
  if (os === 'android') return <PhoneBoot />
  return <DesktopBoot os={os} spec={spec} />
}

function DesktopBoot({ os, spec }: { os: VmOs; spec: VmSpec }) {
  const lines = firmwareLines(spec)
  const shown = useReveal(lines.length, 120, 150)
  const kernelStart = 1500
  const kernel = os === 'linux'
  const kernelShown = useReveal(kernel ? KERNEL.length : 0, 110, kernelStart)
  const logo = usePhase(kernel ? kernelStart + KERNEL.length * 110 + 250 : 1550)

  return (
    <div className="absolute inset-0 overflow-hidden bg-black font-mono text-[14px] leading-[22px] text-[#c9ccd6]">
      <AnimatePresence>
        {!logo && (
          <motion.div key="post" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 p-10">
            {shown < lines.length || !kernel || kernelShown === 0 ? (
              <>
                <div className="absolute top-10 right-10 flex items-center gap-2 text-white/80">
                  <Logo size={34} />
                </div>
                {lines.slice(0, shown).map((l, i) => (
                  <div key={i} className="whitespace-pre">
                    {l.replace(/ OK$/, '')}
                    {l.endsWith(' OK') && <span className="text-emerald-400"> OK</span>}
                    {' '}
                  </div>
                ))}
                <div className="mt-1 h-4 w-2.5 animate-pulse bg-[#c9ccd6]" />
              </>
            ) : (
              KERNEL.slice(0, kernelShown).map((l, i) => (
                <div key={i} className="whitespace-pre">
                  {l.startsWith('[  OK  ]') ? (
                    <>
                      [<span className="text-emerald-400">  OK  </span>]{l.slice(8)}
                    </>
                  ) : (
                    l
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {logo && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center gap-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
            {os === 'linux' ? <PeakMark size={96} /> : <PetalMark size={104} />}
          </motion.div>
          {os === 'linux' ? <BootBar ms={BOOT_MS.linux - 2900} /> : <DotSpinner size={34} />}
        </motion.div>
      )}
    </div>
  )
}

function BootBar({ ms }: { ms: number }) {
  return (
    <div className="h-1 w-40 overflow-hidden rounded-full bg-white/15">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-500"
        initial={{ width: '5%' }}
        animate={{ width: '100%' }}
        transition={{ duration: ms / 1000, ease: 'easeInOut' }}
      />
    </div>
  )
}

function PhoneBoot() {
  const ready = usePhase(500)
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
      {ready && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 140, damping: 13 }}
            className="relative"
          >
            <motion.div
              className="absolute inset-[-40%] rounded-full bg-emerald-400/25 blur-2xl"
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <SproutMark size={84} className="relative" />
          </motion.div>
          <motion.p
            className="mt-6 text-[15px] font-medium tracking-[0.2em] text-white/80 lowercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            virtual phone
          </motion.p>
          <motion.p
            className="absolute bottom-10 flex items-center gap-1.5 text-[11px] text-white/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <Logo size={14} /> Plumos
          </motion.p>
        </>
      )}
    </div>
  )
}

/** Shown while the guest powers off. */
export function Shutdown({ os }: { os: VmOs }) {
  if (os === 'android') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black text-white/80">
        <motion.div animate={{ opacity: [1, 0.2] }} transition={{ duration: 1.4 }}>
          <SproutMark size={64} />
        </motion.div>
        <p className="text-[14px]">Powering off…</p>
      </div>
    )
  }
  if (os === 'linux') {
    return (
      <div className="absolute inset-0 bg-black p-10 font-mono text-[14px] leading-[22px] text-[#c9ccd6]">
        {['Stopping desktop session...', 'Stopping network...', 'Unmounting home folder...', 'Reached power off.'].map((l, i) => (
          <motion.div key={l} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.3 }}>
            [<span className="text-emerald-400">  OK  </span>] {l}
          </motion.div>
        ))}
      </div>
    )
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-5 bg-gradient-to-b from-[#0d1a3a] to-[#070b1a] text-white">
      <DotSpinner size={30} />
      <span className="text-[24px] font-light">Shutting down</span>
    </div>
  )
}
