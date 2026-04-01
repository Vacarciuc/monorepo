import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Proxy targets — in Docker these are set via ENV in Dockerfile.dev.
// Locally they default to the host-mapped ports.
const GATEWAY_PROXY_TARGET = process.env.GATEWAY_PROXY_TARGET ?? 'http://localhost:3000'
const SELLER_PROXY_TARGET = process.env.SELLER_PROXY_TARGET ?? 'http://localhost:3003'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Allow requests from any host (needed when running inside Docker)
    allowedHosts: true,
    hmr: {
      // HMR websocket must use the same port the browser connects to
      port: 5173,
    },
    proxy: {
      // All /api requests are forwarded to the gateway — no CORS needed
      '/api': {
        target: GATEWAY_PROXY_TARGET,
        changeOrigin: true,
      },
      // Static uploads (product images) served by seller-service
      '/uploads': {
        target: SELLER_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
})
