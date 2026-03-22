export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imagePath?: string;
}

export interface Cart {
  id: string;
  customerId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutPayload {
  customerId: string;
  items: CartItem[];
  totalPrice: number;
  createdAt: string;
}

