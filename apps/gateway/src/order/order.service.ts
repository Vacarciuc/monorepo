import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'

import { BaseMicroserviceService } from '@/common/classes/base-microservice-service'
import { AddToCartDto } from '@/order/dto/add-to-cart.dto'
import { CartDto } from '@/order/dto/cart.dto'
import { CreateProductDto } from '@/order/dto/create-product.dto'
import { OrderDto } from '@/order/dto/order.dto'
import { ProductDto } from '@/order/dto/product.dto'
import { UpdateCartItemDto } from '@/order/dto/update-cart-item.dto'
import { UpdateProductDto } from '@/order/dto/update-product.dto'
import { orderEndpoints } from '@/order/order-endpoints.constants'

@Injectable()
export class OrderService extends BaseMicroserviceService {
  constructor(httpService: HttpService) {
    super(httpService, new Logger(OrderService.name))
  }

  createProduct(dto: CreateProductDto): Promise<any> {
    return this.forwardRequest({
      url: orderEndpoints.createProduct(),
      method: 'POST',
      data: dto,
    })
  }

  getAllProducts(): Promise<ProductDto[]> {
    return this.forwardRequest({
      url: orderEndpoints.getAllProducts(),
      method: 'GET',
    })
  }

  getOneProduct(id: string): Promise<ProductDto> {
    return this.forwardRequest({
      url: orderEndpoints.getOneProduct({ id }),
      method: 'GET',
    })
  }

  updateOneProduct(id: string, dto: UpdateProductDto): Promise<any> {
    return this.forwardRequest({
      url: orderEndpoints.updateOneProduct({ id }),
      method: 'PATCH',
      data: dto,
    })
  }

  deleteOneProduct(id: string): Promise<any> {
    return this.forwardRequest({
      url: orderEndpoints.deleteOneProduct({ id }),
      method: 'DELETE',
    })
  }

  addToCart(userId: string, dto: AddToCartDto): Promise<CartDto> {
    return this.forwardRequest({
      url: orderEndpoints.addToCart(),
      method: 'POST',
      data: dto,
      params: { userId },
    })
  }

  getCart(userId: string): Promise<CartDto> {
    return this.forwardRequest({
      url: orderEndpoints.getCart(),
      method: 'GET',
      params: { userId },
    })
  }

  updateCartItem(
    userId: string,
    id: string,
    dto: UpdateCartItemDto,
  ): Promise<any> {
    return this.forwardRequest({
      url: orderEndpoints.updateCartItem({ id }),
      method: 'PATCH',
      data: dto,
      params: { userId },
    })
  }

  removeFromCart(userId: string, id: string): Promise<any> {
    return this.forwardRequest({
      url: orderEndpoints.removeFromCart({ id }),
      method: 'DELETE',
      params: { userId },
    })
  }

  clearCart(userId: string): Promise<any> {
    return this.forwardRequest({
      url: orderEndpoints.clearCart(),
      method: 'DELETE',
      params: { userId },
    })
  }

  async createOrderFromCart(userId: string): Promise<OrderDto> {
    return this.forwardRequest({
      url: orderEndpoints.createOrderFromCart(),
      method: 'POST',
      params: { userId },
    })
  }

  async findAll(userId: string): Promise<OrderDto[]> {
    return this.forwardRequest({
      url: orderEndpoints.findAllOrders(),
      method: 'GET',
      params: { userId },
    })
  }

  async findOne(id: string, userId: string): Promise<OrderDto> {
    return this.forwardRequest({
      url: orderEndpoints.findOneOrder({ id }),
      method: 'GET',
      params: { userId },
    })
  }
}
