import apiClient from './client'

export interface SellerOrderItem {
  productId: string
  quantity: number
  price: number
}

export type SellerOrderStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED'

export interface SellerOrder {
  id: string
  orderId: string
  status: SellerOrderStatus
  orderItems: SellerOrderItem[]
  processedAt: string | null
  createdAt: string
}

export const getSellerOrders = async (): Promise<SellerOrder[]> => {
  const response = await apiClient.get<SellerOrder[]>('/seller/orders')
  return response.data
}

export const getSellerOrderById = async (id: string): Promise<SellerOrder> => {
  const response = await apiClient.get<SellerOrder>(`/seller/orders/${id}`)
  return response.data
}

export const confirmSellerOrder = async (id: string): Promise<SellerOrder> => {
  const response = await apiClient.post<SellerOrder>(`/seller/orders/${id}/confirm`)
  return response.data
}

export const rejectSellerOrder = async (id: string): Promise<SellerOrder> => {
  const response = await apiClient.post<SellerOrder>(`/seller/orders/${id}/reject`)
  return response.data
}

