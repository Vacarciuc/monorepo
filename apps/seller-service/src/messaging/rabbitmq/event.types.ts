export interface EventContext {
  sellerId: string;
  cartId?: string;
}

export interface BaseEvent<T = any> {
  event: string;
  context: EventContext;
  data: T;
  timestamp?: Date;
}

export interface ProductCreatedEvent {
  productId: string;
  name: string;
  price: number;
  sellerId: string;
}

export interface StockUpdatedEvent {
  productId: string;
  stock: number;
  previousStock?: number;
}

export interface CartUpdatedEvent {
  cartId: string;
  sellerId: string;
  itemCount: number;
}

