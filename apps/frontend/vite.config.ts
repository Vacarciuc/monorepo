import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
  },
})
