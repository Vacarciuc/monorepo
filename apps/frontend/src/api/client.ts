import axios from 'axios'
import { authService } from '../services/auth.service'

// Use relative base URL — Vite dev server proxies /api → gateway (no CORS).
// In Docker the proxy target is http://gateway:3000 (set via GATEWAY_PROXY_TARGET in Dockerfile.dev).
const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const authHeader = authService.getAuthHeader()
  Object.assign(config.headers, authHeader)
  return config
})

export default apiClient
