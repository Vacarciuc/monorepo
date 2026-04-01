import axios from 'axios'

import { authService } from '../services/auth.service'
import type {
  CreateProductRequest,
  Product,
  UpdateProductRequest,
} from '../types/product'

// Use relative base URL — Vite dev server proxies /api → gateway (no CORS)
const productClient = axios.create({
  baseURL: '/api/v1',
})

// Add auth token to requests
productClient.interceptors.request.use((config) => {
  const authHeader = authService.getAuthHeader()
  Object.assign(config.headers, authHeader)
  return config
})

export const getProducts = async (): Promise<Product[]> => {
  const response = await productClient.get<Product[]>('/order/product')
  return response.data
}

export const getProduct = async (id: string): Promise<Product> => {
  const response = await productClient.get<Product>(`/order/product/${id}`)
  return response.data
}

export const createProduct = async (
  product: CreateProductRequest,
): Promise<Product> => {
  const formData = new FormData()
  formData.append('name', product.name)
  formData.append('price', product.price.toString())

  if (product.description) {
    formData.append('description', product.description)
  }

  if (product.quantity !== undefined) {
    formData.append('quantity', product.quantity.toString())
  }

  if (product.image) {
    formData.append('image', product.image)
  }

  const response = await productClient.post<Product>('/order/product', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export const updateProduct = async (
  id: string,
  product: UpdateProductRequest,
): Promise<Product> => {
  const formData = new FormData()

  if (product.name !== undefined) {
    formData.append('name', product.name)
  }

  if (product.price !== undefined) {
    formData.append('price', product.price.toString())
  }

  if (product.description !== undefined) {
    formData.append('description', product.description)
  }

  if (product.quantity !== undefined) {
    formData.append('quantity', product.quantity.toString())
  }

  if (product.image) {
    formData.append('image', product.image)
  }

  const response = await productClient.patch<Product>(
    `/order/product/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
  return response.data
}

export const deleteProduct = async (id: string): Promise<void> => {
  await productClient.delete(`/order/product/${id}`)
}

export const getImageUrl = (imagePath?: string): string => {
  if (!imagePath) {
    return 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop'
  }
  // Use relative path — Vite proxy forwards /uploads → seller-service (no CORS)
  return imagePath
}
