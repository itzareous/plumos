import { useCallback, useEffect, useState, type ComponentType } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import type { AppCategory } from '@/apps/types'
import { cn } from '@/lib/cn'
import { AiArt, MediaArt, VmArt } from './HeroArt'
import { useNav } from './nav'

interface Banner {
  id: string
  eyebrow: string
  title: string
  body: string
  cta: string
  category: AppCategory
  background: string
  Art: ComponentType
}

const banners: Banner[] = [
  {
    id: 'ai',
    eyebrow: 'Featured collection',
    title: 'Your own AI, at home',
    body: 'Chat with local models, make images and hand the busywork to an agent — without sending a word to the cloud.',
    cta: 'Explore AI apps',
    category: 'ai',
    background:
      'radial-gradient(90% 120% at 78% 10%, rgb(168 85 247 / 0.75), transparent 60%), radial-gradient(70% 100% at 55% 115%, rgb(236 72 153 / 0.55), transparent 65%), linear-gradient(120deg, #140f33 0%, #26206b 45%, #3b1a6e 100%)',
    Art: AiArt,
  },
  {
    id: 'media',
    eyebrow: 'Movie night',
    title: 'Stream everything you own',
    body: 'Movies, shows, music and audiobooks from your own drives, beautifully organised and ready on every screen.',
    cta: 'Browse media apps',
    category: 'media',
    background:
      'radial-gradient(80% 120% at 80% 0%, rgb(251 146 60 / 0.8), transparent 60%), radial-gradient(80% 120% at 60% 120%, rgb(219 39 119 / 0.6), transparent 60%), linear-gradient(120deg, #2a0d1f 0%, #5b1733 45%, #7c2d12 100%)',
    Art: MediaArt,
  },
  {
    id: 'vm',
    eyebrow: 'Virtual machines',
    title: 'Run any OS in a tab',
    body: 'Windows, Linux and Android on your server, one click from any browser. Let an AI agent take the wheel if you like.',
    cta: 'See virtual machines',
    category: 'virtual-machines',
    background:
      'radial-gradient(90% 120% at 80% 0%, rgb(45 212 191 / 0.6), transparent 60%), radial-gradient(70% 110% at 50% 120%, rgb(59 130 246 / 0.6), transparent 65%), linear-gradient(120deg, #06202a 0%, #0b3a4a 50%, #0f3d63 100%)',
    Art: VmArt,
  },
]

const INTERVAL = 6500

export function Hero() {
  const nav = useNav()
  const [[index, dir], setState] = useState<[number, number]>([0, 1])
  const [paused, setPaused] = useState(false)

  const go = useCallback((next: number, d?: number) => {
    setState(([cur]) => [(next + banners.length) % banners.length, d ?? (next > cur ? 1 : -1)])
  }, [])

  useEffect(() => {
    if (paused) return
    const t = setTimeout(() => go(index + 1, 1), INTERVAL)
    return () => clearTimeout(t)
  }, [index, paused, go])

  const banner = banners[index]

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1, 1)
        if (e.key === 'ArrowLeft') go(index - 1, -1)
      }}
    >
      <div className="relative h-[400px] overflow-hidden rounded-[26px] bg-[#141425] ring-1 ring-inset ring-white/10 sm:h-[300px]">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={banner.id}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: `${d * 100}%` }),
              center: { x: '0%' },
              exit: (d: number) => ({ x: `${d * -100}%` }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 220, damping: 32, mass: 0.9 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 || info.velocity.x < -500) go(index + 1, 1)
              else if (info.offset.x > 60 || info.velocity.x > 500) go(index - 1, -1)
            }}
            className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
            style={{ background: banner.background }}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${banners.length}: ${banner.title}`}
          >
            <banner.Art />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0/0.45),transparent_62%)] max-sm:bg-[linear-gradient(0deg,rgb(0_0_0/0.55),transparent_58%)]" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:top-0 sm:right-auto sm:flex sm:w-[46%] sm:min-w-[340px] sm:flex-col sm:justify-center sm:p-10">
              <div className="text-[12px] font-semibold tracking-[0.08em] text-white/70 uppercase">{banner.eyebrow}</div>
              <h2 className="mt-1.5 text-[28px] leading-[1.08] font-bold tracking-[-0.025em] text-balance sm:text-[38px]">
                {banner.title}
              </h2>
              <p className="mt-2 max-w-[400px] text-[14px] leading-snug text-white/75 sm:mt-3 sm:text-[15px]">
                {banner.body}
              </p>
              <button
                type="button"
                onClick={() => nav.go({ view: 'category', category: banner.category })}
                className="mt-4 inline-flex h-9 w-fit items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black shadow-[0_8px_24px_-8px_rgb(0_0_0/0.5)] transition outline-none hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 active:scale-[0.97] sm:mt-5"
              >
                {banner.cta}
                <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Choose a featured banner">
        {banners.map((b, i) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={b.title}
            onClick={() => go(i)}
            className="group flex h-4 items-center outline-none"
          >
            <span
              className={cn(
                'relative block h-[6px] overflow-hidden rounded-full transition-[width,background-color] duration-300 group-focus-visible:ring-2 group-focus-visible:ring-white/60',
                i === index ? 'w-6 bg-white/25' : 'w-[6px] bg-white/25 group-hover:bg-white/45',
              )}
            >
              {i === index && (
                <motion.span
                  key={`${index}-${paused}`}
                  className="absolute inset-y-0 left-0 rounded-full bg-white"
                  initial={{ width: paused ? '100%' : '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: paused ? 0 : INTERVAL / 1000, ease: 'linear' }}
                />
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
