import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CartUseCases } from '../../application/use-cases/cart.usecase';
import { AddCartItemDto, UpdateCartItemDto, CartResponseDto } from '../../dto/cart.dto';

@ApiTags('sellers')
@Controller('sellers')
export class CartController {
  constructor(private readonly cartUseCases: CartUseCases) {}

  @Get(':id/cart')
  @ApiOperation({ summary: 'Get seller cart' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Cart retrieved', type: CartResponseDto })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async getCart(@Param('id') sellerId: string): Promise<CartResponseDto> {
    return this.cartUseCases.getCart(sellerId);
  }

  @Post(':id/cart/items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 201, description: 'Item added to cart', type: CartResponseDto })
  @ApiResponse({ status: 404, description: 'Seller or product not found' })
  @ApiResponse({ status: 400, description: 'Product does not belong to seller' })
  async addItem(
    @Param('id') sellerId: string,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartUseCases.addItem(sellerId, dto);
  }

  @Put(':id/cart/items')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Item updated', type: CartResponseDto })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  async updateItem(
    @Param('id') sellerId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartUseCases.updateItem(sellerId, dto);
  }

  @Delete(':id/cart/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiParam({ name: 'itemId', description: 'Product ID to remove' })
  @ApiResponse({ status: 200, description: 'Item removed from cart', type: CartResponseDto })
  @ApiResponse({ status: 404, description: 'Item not found in cart' })
  async removeItem(
    @Param('id') sellerId: string,
    @Param('itemId') productId: string,
  ): Promise<CartResponseDto> {
    return this.cartUseCases.removeItem(sellerId, productId);
  }
}

