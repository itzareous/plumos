// HTTP API shared by the production server and the Vite dev server.
import { getSystemStats } from './system.mjs'

const json = (res, status, body) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

/** Handles /api/* requests. Resolves to true when the request was handled. */
export async function handleApi(req, res) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (!url.pathname.startsWith('/api/')) return false

  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      json(res, 200, { ok: true })
    } else if (req.method === 'GET' && url.pathname === '/api/system') {
      json(res, 200, await getSystemStats())
    } else {
      json(res, 404, { error: 'Not found' })
    }
  } catch (error) {
    json(res, 500, { error: String(error?.message ?? error) })
  }
  return true
}
