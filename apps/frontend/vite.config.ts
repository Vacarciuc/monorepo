import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // loadEnv reads .env files; process.env holds Docker/OS env vars.
  // Priority: VITE_GATEWAY_API (local dev) → GATEWAY_PROXY_TARGET (Docker, set in Dockerfile.dev) → fallback
  const gatewayUrl =
    env.VITE_GATEWAY_API ||
    env.VITE_GATEWAY_URL ||
    process.env.GATEWAY_PROXY_TARGET ||
    'http://gateway:3000'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
      hmr: {
        port: 5173,
      },
      proxy: {
        '/api': {
          target: gatewayUrl,
          changeOrigin: true,
        },
      },
    },
  }
})


