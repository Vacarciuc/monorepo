import axios from 'axios'
import { authService } from '../services/auth.service'

// All requests go through the gateway (port 3000 in dev)
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: `${GATEWAY_URL}/api/v1`,
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
