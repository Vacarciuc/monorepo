import axios from 'axios';
import { authService } from '../services/auth.service';

const AUTH_API_URL = import.meta.env.VITE_AUTH_API || 'http://localhost:3001';

const apiClient = axios.create({
  // auth-service uses global prefix /api and versioning v1
  baseURL: `${AUTH_API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const authHeader = authService.getAuthHeader();
  Object.assign(config.headers, authHeader);
  return config;
});

export default apiClient;


