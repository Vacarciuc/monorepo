export class OrderCreatedEvent {
  orderId: string
  sellerId: string
  items: Array<{
    product_id: string
    quantity: number
    price: number
  }>
  totalPrice: number
}

export class OrderProcessedEvent {
  orderId: string
  status: 'CONFIRMED' | 'REJECTED'
}
