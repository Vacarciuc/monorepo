import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { SellerRepository } from '../../domain/repositories/seller.repository';
import { Product } from '../../domain/entities/product.entity';
import { CreateProductDto, UpdateProductDto } from '../../dto/product.dto';
import { RabbitMQPublisher } from '../../messaging/rabbitmq/publisher';
import { ProductCreatedEvent, StockUpdatedEvent } from '../../messaging/rabbitmq/event.types';
import { CartRepository } from '../../domain/repositories/cart.repository';

@Injectable()
export class ProductUseCases {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly sellerRepository: SellerRepository,
    private readonly cartRepository: CartRepository,
    private readonly publisher: RabbitMQPublisher,
  ) {}

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const seller = await this.sellerRepository.findById(dto.sellerId);
    if (!seller) {
      throw new NotFoundException(`Seller with ID ${dto.sellerId} not found`);
    }

    const product = await this.productRepository.create({
      ...dto,
      currency: dto.currency || 'USD',
    });

    // Get or create cart for seller
    const cart = await this.cartRepository.findOrCreate(dto.sellerId);

    // Publish event with context
    await this.publisher.publish<ProductCreatedEvent>({
      event: 'product.created',
      context: {
        sellerId: dto.sellerId,
        cartId: cart.id,
      },
      data: {
        productId: product.id,
        name: product.name,
        price: product.price,
        sellerId: product.sellerId,
      },
    });

    return product;
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async getProductsBySellerId(sellerId: string): Promise<Product[]> {
    const seller = await this.sellerRepository.findById(sellerId);
    if (!seller) {
      throw new NotFoundException(`Seller with ID ${sellerId} not found`);
    }
    return this.productRepository.findBySellerId(sellerId);
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.getProductById(id);
    const previousStock = product.stock;

    const updated = await this.productRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // If stock changed, publish event
    if (dto.stock !== undefined && dto.stock !== previousStock) {
      const cart = await this.cartRepository.findOrCreate(product.sellerId);

      await this.publisher.publish<StockUpdatedEvent>({
        event: 'product.stock.updated',
        context: {
          sellerId: product.sellerId,
          cartId: cart.id,
        },
        data: {
          productId: id,
          stock: dto.stock,
          previousStock,
        },
      });
    }

    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.getProductById(id);
    await this.productRepository.delete(id);
  }
}

