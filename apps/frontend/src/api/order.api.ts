import axios from 'axios'

import { authService } from '../services/auth.service'
import { tokenService } from '../services/token.service'
import type { CreateOrderResponse, Order } from '../types/order'

// Use relative base URL — Vite dev server proxies /api → gateway (no CORS)
const orderClient = axios.create({
  baseURL: '/api/v1',
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

export const createOrder = async (): Promise<CreateOrderResponse> => {
  const userId = tokenService.getUserId()
  const response = await orderClient.post<CreateOrderResponse>(
    '/order/orders',
    {},
    userId ? { params: { userId } } : {},
  )
  return response.data
}

export const getOrders = async (): Promise<Order[]> => {
  const userId = tokenService.getUserId()
  const response = await orderClient.get<Order[]>(
    '/order/orders',
    userId ? { params: { userId } } : {},
  )
  return response.data
}

export const getOrder = async (id: string): Promise<Order> => {
  const userId = tokenService.getUserId()
  const response = await orderClient.get<Order>(
    `/order/orders/${id}`,
    userId ? { params: { userId } } : {},
  )
  return response.data
}
