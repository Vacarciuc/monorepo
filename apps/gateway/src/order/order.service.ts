import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'

import { BaseMicroserviceService } from '@/common/classes/base-microservice-service'
import { AddToCartDto } from '@/order/dto/add-to-cart.dto'
import { CreateProductDto } from '@/order/dto/create-product.dto'
import { OrderDto } from '@/order/dto/order.dto'
import { ProductDto } from '@/order/dto/product.dto'
import { UpdateCartItemDto } from '@/order/dto/update-cart-item.dto'
import { UpdateProductDto } from '@/order/dto/update-product.dto'
import { orderEndpoints } from '@/order/order-endpoints.constants'
import { SellerService } from '@/seller/seller.service'

// Raw cart item as returned by order-service
interface RawCartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
}

// Enriched cart shape consumed by the frontend
export interface EnrichedCartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imagePath?: string
}

export interface EnrichedCart {
  customerId: string
  items: EnrichedCartItem[]
}

@Injectable()
export class OrderService extends BaseMicroserviceService {
  constructor(
    httpService: HttpService,
    private readonly sellerService: SellerService,
  ) {
    super(httpService, new Logger(OrderService.name))
  }

  // ── Products ─────────────────────────────────────────────────────────────

  createProduct(dto: CreateProductDto): Promise<any> {
    return this.forwardRequest({ url: orderEndpoints.createProduct(), method: 'POST', data: dto })
  }

  getAllProducts(): Promise<ProductDto[]> {
    return this.forwardRequest({ url: orderEndpoints.getAllProducts(), method: 'GET' })
  }

  getOneProduct(id: string): Promise<ProductDto> {
    return this.forwardRequest({ url: orderEndpoints.getOneProduct({ id }), method: 'GET' })
  }

  updateOneProduct(id: string, dto: UpdateProductDto): Promise<any> {
    return this.forwardRequest({ url: orderEndpoints.updateOneProduct({ id }), method: 'PATCH', data: dto })
  }

  deleteOneProduct(id: string): Promise<any> {
    return this.forwardRequest({ url: orderEndpoints.deleteOneProduct({ id }), method: 'DELETE' })
  }

  // ── Cart ─────────────────────────────────────────────────────────────────

  async addToCart(userId: string, dto: AddToCartDto): Promise<EnrichedCart> {
    await this.forwardRequest({
      url: orderEndpoints.addToCart(),
      method: 'POST',
      data: { ...dto },
      params: { userId },
    })
    return this.buildCart(userId)
  }

  async getCart(userId: string): Promise<EnrichedCart> {
    return this.buildCart(userId)
  }

  async updateCartItem(userId: string, productId: string, dto: UpdateCartItemDto): Promise<EnrichedCart> {
    await this.forwardRequest({
      url: orderEndpoints.updateCartItem({ id: productId }),
      method: 'PATCH',
      data: { ...dto },
      params: { userId },
    })
    return this.buildCart(userId)
  }

  async removeFromCart(userId: string, productId: string): Promise<EnrichedCart> {
    await this.forwardRequest({
      url: orderEndpoints.removeFromCart({ id: productId }),
      method: 'DELETE',
      params: { userId },
    })
    return this.buildCart(userId)
  }

  async clearCart(userId: string): Promise<EnrichedCart> {
    await this.forwardRequest({
      url: orderEndpoints.clearCart(),
      method: 'DELETE',
      params: { userId },
    })
    return this.buildCart(userId)
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  createOrderFromCart(userId: string): Promise<OrderDto> {
    return this.forwardRequest({ url: orderEndpoints.createOrderFromCart(), method: 'POST', params: { userId } })
  }

  findAll(userId: string): Promise<OrderDto[]> {
    return this.forwardRequest({ url: orderEndpoints.findAllOrders(), method: 'GET', params: { userId } })
  }

  findOne(id: string, userId: string): Promise<OrderDto> {
    return this.forwardRequest({ url: orderEndpoints.findOneOrder({ id }), method: 'GET', params: { userId } })
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async buildCart(userId: string): Promise<EnrichedCart> {
    const rawItems: RawCartItem[] = await this.forwardRequest({
      url: orderEndpoints.getCart(),
      method: 'GET',
      params: { userId },
    })

    const items = Array.isArray(rawItems) ? rawItems : []

    const enriched: EnrichedCartItem[] = await Promise.all(
      items.map(async (item) => {
        try {
          const product = await this.sellerService.getProductById(item.product_id)
          return {
            productId: item.product_id,
            name: product.name,
            price: Number(product.price),
            quantity: item.quantity,
            imagePath: product.imagePath,
          }
        } catch {
          // product lookup failed – return minimal item
          return {
            productId: item.product_id,
            name: 'Produs necunoscut',
            price: 0,
            quantity: item.quantity,
          }
        }
      }),
    )

    return { customerId: userId, items: enriched }
  }
}
