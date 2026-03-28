import { compile } from 'path-to-regexp'

export const orderEndpoints = {
  createProduct: compile('/products'),
  getAllProducts: compile('/products'),
  getOneProduct: compile('/products/:id'),
  updateOneProduct: compile('/products/:id'),
  deleteOneProduct: compile('/products/:id'),

  addToCart: compile('/cart'),
  getCart: compile('/cart'),
  clearCart: compile('/cart'),
  updateCartItem: compile('/cart/:id'),
  removeFromCart: compile('/cart/:id'),

  createOrderFromCart: compile('/orders'),
  findAllOrders: compile('/orders'),
  findOneOrder: compile('/orders/:id'),
}
