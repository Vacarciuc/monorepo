export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
}

