import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddToCartDto, UpdateCartItemDto } from "../dto/cart.dto";

@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addToCart(
    @Query("userId") userId: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Get()
  async getCart(@Query("userId") userId: string,) {
    return this.cartService.getCart(userId);
  }

  @Patch(":id")
  async updateCartItem(
    @Query("userId") userId: string,
    @Param("id") id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(userId, id, updateCartItemDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromCart(@Query("userId") userId: string, @Param("id") id: string) {
    await this.cartService.removeFromCart(userId, id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(@Query("userId") userId: string,) {
    await this.cartService.clearCart(userId);
  }
}
