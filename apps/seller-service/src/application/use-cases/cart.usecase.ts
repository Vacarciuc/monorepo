import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CartRepository } from '../../domain/repositories/cart.repository';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { SellerRepository } from '../../domain/repositories/seller.repository';
import { Cart, CartItem } from '../../domain/entities/cart.entity';
import { AddCartItemDto, UpdateCartItemDto } from '../../dto/cart.dto';
import { RabbitMQPublisher } from '../../messaging/rabbitmq/publisher';
import { CartUpdatedEvent } from '../../messaging/rabbitmq/event.types';

@Injectable()
export class CartUseCases {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly sellerRepository: SellerRepository,
    private readonly publisher: RabbitMQPublisher,
  ) {}

  async getCart(sellerId: string): Promise<Cart> {
    const seller = await this.sellerRepository.findById(sellerId);
    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }

    return this.cartRepository.findOrCreate(sellerId);
  }

  async addItem(sellerId: string, dto: AddCartItemDto): Promise<Cart> {
    const cart = await this.getCart(sellerId);

    // Verify product exists and belongs to seller
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }
    if (product.sellerId !== sellerId) {
      throw new BadRequestException('Product does not belong to this seller');
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex((item) => item.productId === dto.productId);

    if (existingItemIndex !== -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += dto.quantity;
    } else {
      // Add new item
      cart.items.push({
        productId: dto.productId,
        quantity: dto.quantity,
      });
    }

    const updated = await this.cartRepository.update(cart.id, cart.items);

    // Publish event
    await this.publisher.publish<CartUpdatedEvent>({
      event: 'cart.updated',
      context: {
        sellerId,
        cartId: cart.id,
      },
      data: {
        cartId: cart.id,
        sellerId,
        itemCount: cart.items.length,
      },
    });

    return updated!;
  }

  async updateItem(sellerId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getCart(sellerId);

    const itemIndex = cart.items.findIndex((item) => item.productId === dto.productId);
    if (itemIndex === -1) {
      throw new NotFoundException(`Product ${dto.productId} not found in cart`);
    }

    cart.items[itemIndex].quantity = dto.quantity;

    const updated = await this.cartRepository.update(cart.id, cart.items);

    // Publish event
    await this.publisher.publish<CartUpdatedEvent>({
      event: 'cart.updated',
      context: {
        sellerId,
        cartId: cart.id,
      },
      data: {
        cartId: cart.id,
        sellerId,
        itemCount: cart.items.length,
      },
    });

    return updated!;
  }

  async removeItem(sellerId: string, productId: string): Promise<Cart> {
    const cart = await this.getCart(sellerId);

    const itemIndex = cart.items.findIndex((item) => item.productId === productId);
    if (itemIndex === -1) {
      throw new NotFoundException(`Product ${productId} not found in cart`);
    }

    cart.items.splice(itemIndex, 1);

    const updated = await this.cartRepository.update(cart.id, cart.items);

    // Publish event
    await this.publisher.publish<CartUpdatedEvent>({
      event: 'cart.item.removed',
      context: {
        sellerId,
        cartId: cart.id,
      },
      data: {
        cartId: cart.id,
        sellerId,
        itemCount: cart.items.length,
      },
    });

    return updated!;
  }
}

