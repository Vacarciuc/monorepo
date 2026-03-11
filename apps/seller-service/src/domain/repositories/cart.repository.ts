import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartItem } from '../entities/cart.entity';

@Injectable()
export class CartRepository {
  constructor(
    @InjectRepository(Cart)
    private readonly repository: Repository<Cart>,
  ) {}

  async findBySellerId(sellerId: string): Promise<Cart | null> {
    return this.repository.findOne({ where: { sellerId } });
  }

  async create(sellerId: string): Promise<Cart> {
    const cart = this.repository.create({ sellerId, items: [] });
    return this.repository.save(cart);
  }

  async update(id: string, items: CartItem[]): Promise<Cart | null> {
    await this.repository.update(id, { items });
    return this.repository.findOne({ where: { id } });
  }

  async findOrCreate(sellerId: string): Promise<Cart> {
    let cart = await this.findBySellerId(sellerId);
    if (!cart) {
      cart = await this.create(sellerId);
    }
    return cart;
  }
}

