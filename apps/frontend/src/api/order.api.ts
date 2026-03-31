import axios from 'axios'

import { authService } from '../services/auth.service'
import { tokenService } from '../services/token.service'
import type { CreateOrderRequest, CreateOrderResponse } from '../types/order'

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000'

const orderClient = axios.create({
  baseURL: `${GATEWAY_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
orderClient.interceptors.request.use((config) => {
  const authHeader = authService.getAuthHeader()
  Object.assign(config.headers, authHeader)
  return config
})

export const createOrder = async (
  _order: CreateOrderRequest,
): Promise<CreateOrderResponse> => {
  // Gateway creates the order directly from the user's cart
  const userId = tokenService.getUserId()
  const response = await orderClient.post<CreateOrderResponse>(
    '/order/orders',
    {},
    userId ? { params: { userId } } : {},
  )
  return response.data
}
