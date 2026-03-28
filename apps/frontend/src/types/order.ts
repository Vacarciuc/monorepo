export interface Order {
  id?: string
  productId: string
  quantity: number
  status?: string
}

export interface CreateOrderRequest {
  productId: string
  quantity: number
}

export interface CreateOrderResponse {
  id: string
  productId: string
  quantity: number
  status: string
  message: string
}
