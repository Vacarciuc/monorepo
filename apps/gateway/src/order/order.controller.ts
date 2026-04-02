import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { Authorize } from '@/auth/auth.decorator'
import { AppTag } from '@/config/tags.config'
import { AddToCartDto } from '@/order/dto/add-to-cart.dto'
import { CreateProductDto } from '@/order/dto/create-product.dto'
import { OrderDto } from '@/order/dto/order.dto'
import { ProductDto } from '@/order/dto/product.dto'
import { UpdateCartItemDto } from '@/order/dto/update-cart-item.dto'
import { UpdateProductDto } from '@/order/dto/update-product.dto'
import { type EnrichedCart, OrderService } from '@/order/order.service'

@Controller('order')
@ApiTags(AppTag.Order)
@Authorize()
@ApiBadRequestResponse()
@ApiUnauthorizedResponse()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ── Products ─────────────────────────────────────────────────────────────

  @Post('product')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiCreatedResponse({ type: ProductDto })
  async create(@Body() dto: CreateProductDto): Promise<any> {
    return this.orderService.createProduct(dto)
  }

  @Get('product')
  @ApiOperation({ summary: 'Get all products' })
  @ApiOkResponse({ type: [ProductDto] })
  async getAllProducts(): Promise<ProductDto[]> {
    return this.orderService.getAllProducts()
  }

  @Get('product/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiOkResponse({ type: ProductDto })
  @ApiNotFoundResponse()
  async getOneProduct(@Param('id') id: string): Promise<ProductDto> {
    return this.orderService.getOneProduct(id)
  }

  @Patch('product/:id')
  @ApiOperation({ summary: 'Update an existing product' })
  @ApiOkResponse({ type: ProductDto })
  @ApiNotFoundResponse()
  async updateOneProduct(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<any> {
    return this.orderService.updateOneProduct(id, dto)
  }

  @Delete('product/:id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiOkResponse({ description: 'Product successfully deleted' })
  @ApiNotFoundResponse()
  async deleteOneProduct(@Param('id') id: string): Promise<any> {
    return this.orderService.deleteOneProduct(id)
  }

  // ── Cart ─────────────────────────────────────────────────────────────────

  @Post('cart')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiCreatedResponse({ description: 'Updated cart' })
  async addToCart(
    @Query('userId') userId: string,
    @Body() dto: AddToCartDto,
  ): Promise<EnrichedCart> {
    return this.orderService.addToCart(userId, dto)
  }

  @Get('cart')
  @ApiOperation({ summary: 'Get user cart' })
  @ApiOkResponse({ description: 'User cart with enriched product data' })
  async getCart(@Query('userId') userId: string): Promise<EnrichedCart> {
    return this.orderService.getCart(userId)
  }

  @Patch('cart/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiOkResponse({ description: 'Updated cart' })
  async updateCartItem(
    @Query('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<EnrichedCart> {
    return this.orderService.updateCartItem(userId, id, dto)
  }

  @Delete('cart/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiOkResponse({ description: 'Updated cart after item removal' })
  async removeFromCart(
    @Query('userId') userId: string,
    @Param('id') id: string,
  ): Promise<EnrichedCart> {
    return this.orderService.removeFromCart(userId, id)
  }

  @Delete('cart')
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiOkResponse({ description: 'Empty cart' })
  async clearCart(@Query('userId') userId: string): Promise<EnrichedCart> {
    return this.orderService.clearCart(userId)
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create order from user cart' })
  @ApiCreatedResponse({ type: OrderDto })
  async createOrder(@Query('userId') userId: string): Promise<OrderDto> {
    return this.orderService.createOrderFromCart(userId)
  }

  @Get('orders')
  @ApiOperation({ summary: 'Find all orders for a user' })
  @ApiOkResponse({ type: [OrderDto] })
  async findAll(@Query('userId') userId: string): Promise<OrderDto[]> {
    return this.orderService.findAll(userId)
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Find a specific order for a user' })
  @ApiOkResponse({ type: OrderDto })
  @ApiNotFoundResponse()
  async findOne(
    @Query('userId') userId: string,
    @Param('id') id: string,
  ): Promise<OrderDto> {
    return this.orderService.findOne(id, userId)
  }
}
