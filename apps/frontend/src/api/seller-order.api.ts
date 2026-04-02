import apiClient from './client'

export interface SellerOrderItem {
  productId: string
  quantity: number
  price: number
}

/** Matches PendingSellerOrderDto — only unacknowledged (pending) orders from RabbitMQ queue */
export interface SellerOrder {
  orderId: string       // primary key (UUID from order-service)
  sellerId: string
  items: SellerOrderItem[]
  totalPrice: number
  receivedAt: string    // ISO timestamp when seller-service received the message
}

export interface OrderActionResult {
  orderId: string
  status: 'CONFIRMED' | 'REJECTED'
}

export const getSellerOrders = async (): Promise<SellerOrder[]> => {
  const response = await apiClient.get<SellerOrder[]>('/seller/orders')
  return response.data
}

export const getSellerOrderById = async (orderId: string): Promise<SellerOrder> => {
  const response = await apiClient.get<SellerOrder>(`/seller/orders/${orderId}`)
  return response.data
}

export const confirmSellerOrder = async (orderId: string): Promise<OrderActionResult> => {
  const response = await apiClient.post<OrderActionResult>(`/seller/orders/${orderId}/confirm`)
  return response.data
}

export const rejectSellerOrder = async (orderId: string): Promise<OrderActionResult> => {
  const response = await apiClient.post<OrderActionResult>(`/seller/orders/${orderId}/reject`)
  return response.data
}
