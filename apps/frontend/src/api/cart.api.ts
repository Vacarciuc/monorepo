import axios from 'axios'

import { authService } from '../services/auth.service'
import type { Cart, CheckoutPayload } from '../types/cart'

const SELLER_API_URL =
  import.meta.env.VITE_SELLER_API || 'http://localhost:3002'

const cartClient = axios.create({ baseURL: SELLER_API_URL })

cartClient.interceptors.request.use((config) => {
  const authHeader = authService.getAuthHeader()
  Object.assign(config.headers, authHeader)
  return config
})

export const getCart = (): Promise<Cart> =>
  cartClient.get<Cart>('/cart').then((r) => r.data)

export const addToCart = (productId: string, quantity: number): Promise<Cart> =>
  cartClient
    .post<Cart>('/cart/items', { productId, quantity })
    .then((r) => r.data)

export const updateCartItem = (
  productId: string,
  quantity: number,
): Promise<Cart> =>
  cartClient
    .put<Cart>(`/cart/items/${productId}`, { quantity })
    .then((r) => r.data)

export const removeCartItem = (productId: string): Promise<Cart> =>
  cartClient.delete<Cart>(`/cart/items/${productId}`).then((r) => r.data)

export const clearCart = (): Promise<Cart> =>
  cartClient.delete<Cart>('/cart').then((r) => r.data)

export const checkout = (): Promise<CheckoutPayload> =>
  cartClient.post<CheckoutPayload>('/cart/checkout').then((r) => r.data)
