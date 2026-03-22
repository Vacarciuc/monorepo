import axios from 'axios';
import { authService } from '../services/auth.service';
import type { CreateOrderRequest, CreateOrderResponse } from '../types/order';

const ORDER_API_URL = import.meta.env.VITE_ORDER_API || 'http://localhost:3003';

const orderClient = axios.create({
  baseURL: ORDER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
orderClient.interceptors.request.use((config) => {
  const authHeader = authService.getAuthHeader();
  Object.assign(config.headers, authHeader);
  return config;
});

export const createOrder = async (order: CreateOrderRequest): Promise<CreateOrderResponse> => {
  const response = await orderClient.post<CreateOrderResponse>('/orders', order);
  return response.data;
};



