// Production server: serves the built app from dist/ plus the /api routes.
//
//   npm run build && npm start        # http://localhost:8080
//   PORT=80 npm start                 # listen on port 80
import http from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApi } from './api.mjs'

const PORT = Number(process.env.PORT || 8080)
const HOST = process.env.HOST || '0.0.0.0'
const DIST = fileURLToPath(new URL('../dist/', import.meta.url))

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

async function serveStatic(req, res) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const safe = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
  let file = join(DIST, safe)
  if (!file.startsWith(DIST)) file = join(DIST, 'index.html')

  let info = await stat(file).catch(() => null)
  if (!info || info.isDirectory()) {
    // Single-page app: unknown paths get index.html.
    file = join(DIST, 'index.html')
    info = await stat(file).catch(() => null)
  }
  if (!info) {
    res.statusCode = 503
    res.end('Plumos has not been built yet. Run `npm run build` first.')
    return
  }

  res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream')
  res.setHeader('Content-Length', info.size)
  if (file.includes(`${DIST}assets`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  createReadStream(file).pipe(res)
}

http
  .createServer(async (req, res) => {
    if (await handleApi(req, res)) return
    await serveStatic(req, res)
  })
  .listen(PORT, HOST, () => {
    console.log(`Plumos is running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`)
  })
