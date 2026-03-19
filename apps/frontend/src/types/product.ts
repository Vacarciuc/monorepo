export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imagePath?: string;
  sellerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  image?: File;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  image?: File;
}

