// "Vestra" — sunset over a jagged mountain range and a black-sand beach.
// The default Plumos wallpaper.
import { W, H, ridge, toPath, smooth, grain, svg } from './util.mjs'

const HORIZON = 880

const main = ridge(
  [
    [-0.02, 0.55], [0.08, 0.54], [0.13, 0.49], [0.17, 0.44], [0.2, 0.38], [0.235, 0.31],
    [0.27, 0.26], [0.3, 0.215], [0.325, 0.25], [0.345, 0.205], [0.37, 0.27], [0.4, 0.33],
    [0.43, 0.38], [0.46, 0.415], [0.5, 0.43], [0.54, 0.41], [0.57, 0.39], [0.6, 0.365],
    [0.63, 0.35], [0.66, 0.375], [0.69, 0.325], [0.72, 0.355], [0.75, 0.335], [0.78, 0.3],
    [0.81, 0.325], [0.835, 0.265], [0.855, 0.32], [0.88, 0.37], [0.91, 0.41], [0.94, 0.395],
    [0.97, 0.43], [1.02, 0.46],
  ],
  { seed: 11, amp: 46, roughness: 0.52, depth: 5 },
)

const far = ridge(
  [
    [-0.02, 0.5], [0.05, 0.47], [0.1, 0.45], [0.14, 0.43], [0.2, 0.46], [0.26, 0.5],
    [0.4, 0.45], [0.48, 0.4], [0.55, 0.38], [0.62, 0.41], [0.72, 0.43], [0.86, 0.42],
    [0.93, 0.44], [1.02, 0.47],
  ],
  { seed: 5, amp: 26, roughness: 0.5, depth: 5 },
)

const closeBottom = [[W + 40, HORIZON + 4], [-40, HORIZON + 4]]
const mainPath = toPath(main, closeBottom)
const farPath = toPath(far, closeBottom)

// Wet sand that mirrors the sky.
const pools = [
  smooth([[-0.05, 0.545], [0.2, 0.548], [0.4, 0.556], [0.44, 0.585], [0.3, 0.61], [0.1, 0.63], [-0.05, 0.64]], true),
  smooth([[0.55, 0.55], [0.8, 0.548], [1.05, 0.55], [1.05, 0.63], [0.85, 0.625], [0.7, 0.6], [0.6, 0.58]], true),
  smooth([[0.18, 0.66], [0.32, 0.655], [0.4, 0.668], [0.3, 0.68], [0.2, 0.678]], true),
  smooth([[0.62, 0.655], [0.8, 0.648], [0.95, 0.66], [0.8, 0.675], [0.66, 0.672]], true),
]

// The incoming wave in the foreground.
const waveTop = [
  [-0.05, 0.92], [0.05, 0.88], [0.15, 0.83], [0.26, 0.79], [0.38, 0.765], [0.5, 0.75],
  [0.62, 0.742], [0.75, 0.735], [0.88, 0.728], [1.05, 0.72],
]
const wavePath = smooth(waveTop) + ` L${W + 60},${H + 60} L-60,${H + 60} Z`
const crestPath = smooth(waveTop)

const sky = `
  <linearGradient id="sky" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="#172f66"/>
    <stop offset="0.28" stop-color="#3b5299"/>
    <stop offset="0.5" stop-color="#8a78b3"/>
    <stop offset="0.68" stop-color="#d897a6"/>
    <stop offset="0.82" stop-color="#f3bb86"/>
    <stop offset="1" stop-color="#fbd9a0"/>
  </linearGradient>
  <radialGradient id="sun" cx="0.74" cy="0.53" r="0.55" gradientTransform="matrix(1 0 0 0.7 0 0.16)">
    <stop offset="0" stop-color="#fff0c2" stop-opacity="1"/>
    <stop offset="0.25" stop-color="#ffd185" stop-opacity="0.85"/>
    <stop offset="0.6" stop-color="#f59e7a" stop-opacity="0.25"/>
    <stop offset="1" stop-color="#f59e7a" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="vignetteSky" cx="0.1" cy="0" r="0.8">
    <stop offset="0" stop-color="#0b1a45" stop-opacity="0.7"/>
    <stop offset="1" stop-color="#0b1a45" stop-opacity="0"/>
  </radialGradient>

  <filter id="cirrus" x="-900" y="-900" width="${W + 1800}" height="${H + 1800}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.0009 0.0075" numOctaves="6" seed="21"/>
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  4.2 0 0 0 -2.05"/>
    <feGaussianBlur stdDeviation="1.2"/>
  </filter>
  <filter id="puffs" x="-900" y="-900" width="${W + 1800}" height="${H + 1800}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.0022 0.0055" numOctaves="5" seed="8"/>
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  3.4 0 0 0 -1.62"/>
    <feGaussianBlur stdDeviation="3"/>
  </filter>
  <linearGradient id="cloudRegion" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.95"/>
    <stop offset="0.35" stop-color="#fff" stop-opacity="0.85"/>
    <stop offset="0.52" stop-color="#fff" stop-opacity="0.2"/>
    <stop offset="0.6" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <mask id="cloudRegionMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="url(#cloudRegion)"/>
  </mask>
  <mask id="cirrusMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <g mask="url(#cloudRegionMask)">
      <g transform="rotate(14 ${W / 2} ${H / 2})">
        <rect x="-800" y="-800" width="${W + 1600}" height="${H + 1600}" filter="url(#cirrus)"/>
      </g>
    </g>
  </mask>
  <mask id="puffMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <g mask="url(#cloudRegionMask)">
      <g transform="rotate(9 ${W / 2} ${H / 2})">
        <rect x="-800" y="-800" width="${W + 1600}" height="${H + 1600}" filter="url(#puffs)"/>
      </g>
    </g>
  </mask>
  <linearGradient id="cloudColor" x1="0" y1="0" x2="1" y2="0.8">
    <stop offset="0" stop-color="#b9b3e6"/>
    <stop offset="0.35" stop-color="#f6d3e4"/>
    <stop offset="0.6" stop-color="#ffe1cf"/>
    <stop offset="0.8" stop-color="#ffd7a3"/>
    <stop offset="1" stop-color="#f2b58c"/>
  </linearGradient>
  <linearGradient id="cloudShade" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="#4c4f94"/>
    <stop offset="0.5" stop-color="#9b77a8"/>
    <stop offset="1" stop-color="#d98e86"/>
  </linearGradient>`

const skyLayer = `
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#sun)"/>
  <rect width="${W}" height="${H}" fill="url(#vignetteSky)"/>
  <rect width="${W}" height="${H}" fill="url(#cloudShade)" mask="url(#puffMask)" opacity="0.55"/>
  <rect width="${W}" height="${H}" fill="url(#cloudColor)" mask="url(#cirrusMask)" opacity="0.92"/>`

const mountainDefs = `
  <clipPath id="mainClip"><path d="${mainPath}"/></clipPath>
  <clipPath id="farClip"><path d="${farPath}"/></clipPath>
  <linearGradient id="rockBase" x1="0" y1="${0.2 * H}" x2="0" y2="${HORIZON}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#4a2616"/>
    <stop offset="0.3" stop-color="#2c1911"/>
    <stop offset="0.7" stop-color="#150e0c"/>
    <stop offset="1" stop-color="#1d1719"/>
  </linearGradient>
  <linearGradient id="rimLight" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#ff9a4a" stop-opacity="0.15"/>
    <stop offset="0.3" stop-color="#ffab5c" stop-opacity="0.55"/>
    <stop offset="0.7" stop-color="#ffc07a" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#ffc07a" stop-opacity="0.15"/>
  </linearGradient>
  <linearGradient id="haze" x1="0" y1="${HORIZON - 200}" x2="0" y2="${HORIZON}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#c9a3b0" stop-opacity="0"/>
    <stop offset="1" stop-color="#b68f9e" stop-opacity="0.32"/>
  </linearGradient>
  <filter id="rock" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.0045 0.011" numOctaves="7" seed="4" result="n"/>
    <feDiffuseLighting in="n" surfaceScale="9" diffuseConstant="1.15" lighting-color="#ffd2a8">
      <feDistantLight azimuth="200" elevation="28"/>
    </feDiffuseLighting>
  </filter>
  <filter id="gullies" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.011 0.0035" numOctaves="5" seed="12"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.02  0 0 0 0 0.01  0 0 0 0 0.01  2.6 0 0 0 -1.15"/>
  </filter>
  <filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>
  <radialGradient id="sunlit" cx="${0.62 * W}" cy="${0.3 * H}" r="${0.55 * W}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ff9d4d" stop-opacity="0.32"/>
    <stop offset="0.6" stop-color="#e0753a" stop-opacity="0.1"/>
    <stop offset="1" stop-color="#e0753a" stop-opacity="0"/>
  </radialGradient>`

const mountains = `
  <g clip-path="url(#farClip)">
    <rect width="${W}" height="${H}" fill="#6b5a82"/>
    <rect width="${W}" height="${H}" filter="url(#rock)" opacity="0.35" style="mix-blend-mode:soft-light"/>
    <rect y="${HORIZON - 300}" width="${W}" height="300" fill="url(#haze)"/>
  </g>
  <g clip-path="url(#mainClip)">
    <rect width="${W}" height="${H}" fill="url(#rockBase)"/>
    <rect width="${W}" height="${H}" filter="url(#rock)" opacity="0.85" style="mix-blend-mode:overlay"/>
    <rect width="${W}" height="${H}" fill="url(#sunlit)" style="mix-blend-mode:screen"/>
    <rect width="${W}" height="${H}" filter="url(#gullies)" opacity="0.55"/>
    <path d="${toPath(main)}" fill="none" stroke="url(#rimLight)" stroke-width="18" filter="url(#soft)"/>
    <rect y="${HORIZON - 200}" width="${W}" height="200" fill="url(#haze)"/>
  </g>`

const ground = `
  <linearGradient id="sand" x1="0" y1="${HORIZON}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#23222a"/>
    <stop offset="0.35" stop-color="#121218"/>
    <stop offset="1" stop-color="#07070a"/>
  </linearGradient>
  <filter id="reflectBlur" x="-5%" y="-5%" width="110%" height="110%">
    <feGaussianBlur stdDeviation="2 9"/>
  </filter>
  <filter id="poolEdge"><feGaussianBlur stdDeviation="6"/></filter>
  <mask id="wetMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <rect y="${HORIZON}" width="${W}" height="40" fill="#fff"/>
    <g filter="url(#poolEdge)" fill="#fff">${pools.map((d) => `<path d="${d}"/>`).join('')}</g>
    <path d="${wavePath}" fill="#3a3a3a" filter="url(#poolEdge)"/>
  </mask>
  <filter id="sandTexture" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.0025 0.03" numOctaves="4" seed="31"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.5  0 0 0 0 0.52  2.2 0 0 0 -1.05"/>
  </filter>
  <filter id="foam" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feTurbulence type="turbulence" baseFrequency="0.009 0.024" numOctaves="3" seed="41"/>
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -9 0 0 0 1.25"/>
  </filter>
  <filter id="foamFine" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feTurbulence type="turbulence" baseFrequency="0.035 0.07" numOctaves="2" seed="9"/>
    <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -10 0 0 0 1.1"/>
  </filter>
  <linearGradient id="foamFade" x1="0" y1="${0.72 * H}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#fff" stop-opacity="1"/>
    <stop offset="0.12" stop-color="#fff" stop-opacity="0.8"/>
    <stop offset="0.5" stop-color="#fff" stop-opacity="0.45"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0.25"/>
  </linearGradient>
  <mask id="foamMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <path d="${wavePath}" fill="url(#foamFade)"/>
  </mask>
  <linearGradient id="water" x1="0" y1="${0.72 * H}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#3a4760"/>
    <stop offset="0.4" stop-color="#1b2433"/>
    <stop offset="1" stop-color="#0c1018"/>
  </linearGradient>`

const groundLayer = `
  <rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#sand)"/>
  <rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" filter="url(#sandTexture)" opacity="0.18"/>
  <g mask="url(#wetMask)">
    <g filter="url(#reflectBlur)" transform="translate(0 ${2 * HORIZON}) scale(1 -1)" opacity="0.92">
      ${skyLayer}
      ${mountains}
    </g>
  </g>
  <path d="${wavePath}" fill="url(#water)" opacity="0.6"/>
  <g mask="url(#foamMask)">
    <rect width="${W}" height="${H}" filter="url(#foam)" opacity="0.9"/>
    <rect width="${W}" height="${H}" filter="url(#foamFine)" opacity="0.35"/>
  </g>
  <mask id="crestFoamMask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" filter="url(#foamFine)"/>
  </mask>
  <g transform="translate(0 26)" mask="url(#crestFoamMask)">
    <path d="${crestPath}" fill="none" stroke="#fff" stroke-width="56" opacity="0.9" filter="url(#poolEdge)"/>
  </g>
  <path d="${crestPath}" fill="none" stroke="#fff" stroke-width="10" opacity="0.8" filter="url(#poolEdge)"/>
  <path d="${crestPath}" fill="none" stroke="#fff" stroke-width="3" opacity="0.9"/>`

export default svg(`
  <defs>${sky}${mountainDefs}${ground}</defs>
  ${skyLayer}
  ${mountains}
  ${groundLayer}
  ${grain(0.1)}
`)
