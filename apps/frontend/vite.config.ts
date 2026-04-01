import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const gatewayUrl = env.VITE_GATEWAY_API || env.VITE_GATEWAY_URL || 'http://gateway:3000'

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
