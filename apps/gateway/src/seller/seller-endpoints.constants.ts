import { compile } from 'path-to-regexp'

export const sellerEndpoints = {
  // Orders
  getAllOrders: compile('/seller/orders'),
  getOrderById: compile('/seller/orders/:id'),
  confirmOrder: compile('/seller/orders/:id/confirm'),
  rejectOrder: compile('/seller/orders/:id/reject'),

  // Products
  getAllProducts: compile('/products'),
  getProductById: compile('/products/:id'),
  createProduct: compile('/products'),
  updateProduct: compile('/products/:id'),
  deleteProduct: compile('/products/:id'),
}

