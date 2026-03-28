import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartItemJson } from '../../database/entities/cart.entity';
import { Product } from '../../database/entities/product.entity';
import { AddToCartDto, UpdateCartItemDto } from '../../dto/cart.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // ── helpers ────────────────────────────────────────────────────────────────

  private async getOrCreateCart(customerId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({ where: { customerId } });
    if (!cart) {
      cart = this.cartRepo.create({ customerId, items: [] });
      cart = await this.cartRepo.save(cart);
    }
    return cart;
  }

  // ── public API ─────────────────────────────────────────────────────────────

  async getCart(customerId: string): Promise<Cart> {
    return this.getOrCreateCart(customerId);
  }

  async addItem(customerId: string, dto: AddToCartDto): Promise<Cart> {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    const cart = await this.getOrCreateCart(customerId);
    const existing = cart.items.find((i) => i.productId === dto.productId);
    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + dto.quantity;

    if (newQty > product.quantity) {
      throw new BadRequestException(
        `Only ${product.quantity} units of "${product.name}" available (cart already has ${currentQty})`,
      );
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      const item: CartItemJson = {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: dto.quantity,
        imagePath: product.imagePath ?? undefined,
      };
      cart.items = [...cart.items, item];
    }

    const saved = await this.cartRepo.save(cart);
    this.logger.log(
      `Cart updated for customer ${customerId}: "${product.name}" x${newQty}`,
    );
    return saved;
  }

  async updateItem(
    customerId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getOrCreateCart(customerId);

    if (dto.quantity === 0) {
      cart.items = cart.items.filter((i) => i.productId !== productId);
    } else {
      const product = await this.productRepo.findOne({
        where: { id: productId },
      });
      if (!product)
        throw new NotFoundException(`Product ${productId} not found`);

      if (dto.quantity > product.quantity) {
        throw new BadRequestException(
          `Only ${product.quantity} units of "${product.name}" available`,
        );
      }

      const existing = cart.items.find((i) => i.productId === productId);
      if (!existing)
        throw new NotFoundException(`Item ${productId} not in cart`);

      existing.quantity = dto.quantity;
      // refresh price snapshot
      existing.price = Number(product.price);
      existing.name = product.name;
    }

    return this.cartRepo.save(cart);
  }

  async removeItem(customerId: string, productId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(customerId);
    cart.items = cart.items.filter((i) => i.productId !== productId);
    return this.cartRepo.save(cart);
  }

  async clearCart(customerId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(customerId);
    cart.items = [];
    return this.cartRepo.save(cart);
  }

  /**
   * Returns the cart as a JSON payload ready to be sent to the Orders service
   * via RabbitMQ (or HTTP). Does NOT clear the cart — caller decides.
   */
  async checkoutPayload(customerId: string): Promise<{
    customerId: string;
    items: CartItemJson[];
    totalPrice: number;
    createdAt: string;
  }> {
    const cart = await this.getOrCreateCart(customerId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const totalPrice = cart.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );

    return {
      customerId,
      items: cart.items,
      totalPrice: Math.round(totalPrice * 100) / 100,
      createdAt: new Date().toISOString(),
    };
  }
}
