import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
// @ts-expect-error — plain ESM module shared with the production server
import { handleApi } from './server/api.mjs'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      // Serve the same /api routes in dev and preview as the production server.
      name: 'plumos-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => handleApi(req, res).then((handled: boolean) => handled || next()))
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => handleApi(req, res).then((handled: boolean) => handled || next()))
      },
    },
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { host: true },
})
