export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imagePath?: string
}

export interface Cart {
  customerId: string
  items: CartItem[]
}

export interface CheckoutPayload {
  customerId: string
  items: CartItem[]
  totalPrice: number
  createdAt: string
}
