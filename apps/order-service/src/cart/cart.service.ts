import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { AddToCartDto, UpdateCartItemDto } from '../dto/cart.dto'
import { CartItem } from '../entities/cart-item.entity'

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
  ) {}

  async addToCart(
    userId: string,
    addToCartDto: AddToCartDto,
  ): Promise<CartItem> {
    let cartItem = await this.cartItemRepository.findOne({
      where: {
        user_id: userId,
        product_id: addToCartDto.product_id,
      },
    })

    if (cartItem) {
      cartItem.quantity += addToCartDto.quantity
    } else {
      cartItem = this.cartItemRepository.create({
        user_id: userId,
        product_id: addToCartDto.product_id,
        quantity: addToCartDto.quantity,
      })
    }

    return await this.cartItemRepository.save(cartItem)
  }

  async getCart(userId: string): Promise<CartItem[]> {
    return await this.cartItemRepository.find({
      where: { user_id: userId },
    })
  }

  async updateCartItem(
    userId: string,
    productId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartItem> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { product_id: productId, user_id: userId },
    })

    if (!cartItem) {
      throw new NotFoundException('Cart item not found')
    }

    cartItem.quantity = updateCartItemDto.quantity
    return await this.cartItemRepository.save(cartItem)
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { product_id: productId, user_id: userId },
    })

    if (!cartItem) {
      throw new NotFoundException('Cart item not found')
    }

    await this.cartItemRepository.remove(cartItem)
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartItemRepository.delete({ user_id: userId })
  }
}
