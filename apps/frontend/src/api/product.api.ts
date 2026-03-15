import axios from 'axios';
import { authService } from '../services/auth.service';
import type { Product, CreateProductRequest, UpdateProductRequest } from '../types/product';

const AUTH_API_URL = import.meta.env.VITE_AUTH_API || 'http://localhost:3001';

const productClient = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
productClient.interceptors.request.use((config) => {
  const authHeader = authService.getAuthHeader();
  Object.assign(config.headers, authHeader);
  return config;
});

export const getProducts = async (): Promise<Product[]> => {
  const response = await productClient.get<Product[]>('/products');
  return response.data;
};

export const getProduct = async (id: string): Promise<Product> => {
  const response = await productClient.get<Product>(`/products/${id}`);
  return response.data;
};

export const createProduct = async (product: CreateProductRequest): Promise<Product> => {
  const response = await productClient.post<Product>('/products', product);
  return response.data;
};

export const updateProduct = async (id: string, product: UpdateProductRequest): Promise<Product> => {
  const response = await productClient.put<Product>(`/products/${id}`, product);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await productClient.delete(`/products/${id}`);
};



