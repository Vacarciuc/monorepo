import { compile } from 'path-to-regexp'

export const sellerEndpoints = {
  getAllOrders: compile('/seller/orders'),
  getOrderById: compile('/seller/orders/:id'),
  confirmOrder: compile('/seller/orders/:id/confirm'),
  rejectOrder: compile('/seller/orders/:id/reject'),
}

