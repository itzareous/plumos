// Renders the SVG wallpaper generators in scripts/wallpapers/ to JPEGs in
// public/wallpapers/. Needs a Chromium: set CHROMIUM_PATH if Playwright's
// bundled browser isn't installed.
//
//   npm run wallpapers            # render all
//   npm run wallpapers -- vestra  # render one
import { chromium } from 'playwright-core'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { W, H } from './wallpapers/util.mjs'

const ALL = ['vestra', 'aurora', 'dunes', 'midnight', 'lagoon']
const only = process.argv.slice(2)
const ids = (only.length ? only : ALL).filter((id) => existsSync(new URL(`./wallpapers/${id}.mjs`, import.meta.url)))

const outDir = new URL('../public/wallpapers/', import.meta.url)
await mkdir(outDir, { recursive: true })

const executablePath =
  process.env.CHROMIUM_PATH ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
const browser = await chromium.launch({ executablePath })
const page = await browser.newPage({ viewport: { width: W, height: H } })

for (const id of ids) {
  const { default: markup } = await import(`./wallpapers/${id}.mjs`)
  const started = Date.now()
  await page.setContent(`<!doctype html><style>html,body{margin:0;background:#000}svg{display:block}</style>${markup}`)
  await page.waitForTimeout(100)
  const full = await page.screenshot({ type: 'jpeg', quality: 86 })
  await writeFile(new URL(`${id}.jpg`, outDir), full)

  // Small thumbnail for the wallpaper picker and as a blurred placeholder.
  const thumbPage = await browser.newPage({ viewport: { width: 480, height: 300 } })
  await thumbPage.setContent(
    `<!doctype html><style>html,body{margin:0}img{width:480px;height:300px;display:block}</style><img src="data:image/jpeg;base64,${full.toString('base64')}">`,
  )
  await writeFile(new URL(`${id}-thumb.jpg`, outDir), await thumbPage.screenshot({ type: 'jpeg', quality: 80 }))
  await thumbPage.close()
  console.log(`✓ ${id} (${Date.now() - started}ms, ${(full.length / 1024).toFixed(0)} KB)`)
}

await browser.close()
