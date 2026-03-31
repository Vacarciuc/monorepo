import axios from 'axios'
import { authService } from '../services/auth.service'
import { tokenService } from '../services/token.service'
import type { Cart, CheckoutPayload } from '../types/cart'

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000'

const cartClient = axios.create({ baseURL: `${GATEWAY_URL}/api/v1` })

cartClient.interceptors.request.use((config) => {
  const authHeader = authService.getAuthHeader()
  Object.assign(config.headers, authHeader)
  return config
})

/** Returns userId query param string — gateway requires it for all cart ops. */
const userParam = () => {
  const id = tokenService.getUserId()
  return id ? { params: { userId: id } } : {}
}

export const getCart = (): Promise<Cart> =>
  cartClient.get<Cart>('/order/cart', userParam()).then((r) => r.data)

export const addToCart = (productId: string, quantity: number): Promise<Cart> =>
  cartClient
    .post<Cart>('/order/cart', { productId, quantity }, userParam())
    .then((r) => r.data)

export const updateCartItem = (productId: string, quantity: number): Promise<Cart> =>
  cartClient
    .patch<Cart>(`/order/cart/${productId}`, { quantity }, userParam())
    .then((r) => r.data)

export const removeCartItem = (productId: string): Promise<Cart> =>
  cartClient
    .delete<Cart>(`/order/cart/${productId}`, userParam())
    .then((r) => r.data)

export const clearCart = (): Promise<Cart> =>
  cartClient.delete<Cart>('/order/cart', userParam()).then((r) => r.data)

export const checkout = (): Promise<CheckoutPayload> =>
  cartClient.post<CheckoutPayload>('/order/orders', {}, userParam()).then((r) => r.data)
