import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Chromium can run an SVG filter as a backdrop-filter, which lets us bend the
 * wallpaper at the edges of a panel like real glass. Safari and Firefox
 * accept the syntax but render nothing, so they get frosted glass instead.
 */
export const supportsLiquidGlass = (() => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands
  const chromium = brands?.some((b) => b.brand === 'Chromium') ?? (/Chrome\//.test(ua) && !/CriOS|FxiOS|Firefox/.test(ua))
  return chromium && !/Mobile/.test(ua)
})()

/** Builds the displacement map: red encodes x-offset, blue y-offset, grey = none. */
function displacementMap(width: number, height: number, radius: number, depth: number) {
  const inset = Math.max(4, Math.min(width, height) * depth)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="#f00"/></linearGradient>
      <linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#000"/><stop offset="100%" stop-color="#00f"/></linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#000"/>
    <rect width="${width}" height="${height}" rx="${radius}" fill="url(#r)"/>
    <rect width="${width}" height="${height}" rx="${radius}" fill="url(#b)" style="mix-blend-mode:screen"/>
    <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}" rx="${Math.max(0, radius - inset / 2)}" fill="#808080" style="filter:blur(${inset / 2.2}px)"/>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

interface GlassProps {
  children?: ReactNode
  className?: string
  style?: CSSProperties
  /** Corner radius in px. Must match the element's rounded-* class. */
  radius?: number
  /** Strength of the edge refraction. 0 turns it off. */
  refraction?: number
  /** How far in from the edge the bending reaches, as a fraction of the shorter side. */
  depth?: number
  /** Backdrop blur in px. */
  blur?: number
  /** Extra frost/tint on top of the backdrop. */
  tint?: string
  onClick?: () => void
  as?: 'div' | 'button'
  title?: string
  'aria-label'?: string
}

export function Glass({
  children,
  className,
  style,
  radius = 28,
  refraction = 70,
  depth = 0.16,
  blur = 3,
  tint = 'rgb(255 255 255 / 0.06)',
  onClick,
  as = 'div',
  ...rest
}: GlassProps) {
  const ref = useRef<HTMLDivElement & HTMLButtonElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const filterId = `glass-${useId().replace(/:/g, '')}`
  const liquid = supportsLiquidGlass && refraction > 0

  useLayoutEffect(() => {
    if (!liquid || !ref.current) return
    const el = ref.current
    const measure = () => {
      const w = Math.round(el.offsetWidth)
      const h = Math.round(el.offsetHeight)
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [liquid])

  const map = useMemo(
    () => (liquid && size && size.w > 0 && size.h > 0 ? displacementMap(size.w, size.h, radius, depth) : null),
    [liquid, size, radius, depth],
  )

  const backdrop = map
    ? `url(#${filterId}) saturate(1.5) brightness(1.05)`
    : `blur(${Math.max(blur * 4, 16)}px) saturate(1.6) brightness(1.05)`

  const Tag = as
  return (
    <Tag
      ref={ref}
      onClick={onClick}
      className={cn('glass', className)}
      style={{ borderRadius: radius, ...style }}
      {...(as === 'button' ? { type: 'button' as const } : {})}
      {...rest}
    >
      {map && size && (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
          <filter
            id={filterId}
            x="0"
            y="0"
            width={size.w}
            height={size.h}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage href={map} x="0" y="0" width={size.w} height={size.h} result="map" preserveAspectRatio="none" />
            <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="blurred" />
            {/* Split the channels slightly for a hint of chromatic aberration. */}
            <feDisplacementMap in="blurred" in2="map" scale={-refraction} xChannelSelector="R" yChannelSelector="B" result="dr" />
            <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
            <feDisplacementMap in="blurred" in2="map" scale={-refraction * 0.97} xChannelSelector="R" yChannelSelector="B" result="dg" />
            <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
            <feDisplacementMap in="blurred" in2="map" scale={-refraction * 0.94} xChannelSelector="R" yChannelSelector="B" result="db" />
            <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" />
          </filter>
        </svg>
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          borderRadius: radius,
          backdropFilter: backdrop,
          WebkitBackdropFilter: backdrop,
          background: tint,
        }}
      />
      {/* Specular sheen along the top edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          borderRadius: radius,
          background:
            'linear-gradient(160deg, rgb(255 255 255 / 0.22) 0%, rgb(255 255 255 / 0.04) 28%, transparent 55%, rgb(255 255 255 / 0.05) 100%)',
        }}
      />
      {children}
    </Tag>
  )
}
