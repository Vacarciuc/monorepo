export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  userId: string
  status: string
  items: OrderItem[]
  total?: number
  createdAt?: string
}

export interface CreateOrderRequest {}

export interface CreateOrderResponse {
  id: string
  status: string
  message?: string
}
