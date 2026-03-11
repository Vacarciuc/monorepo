import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from '../entities/seller.entity';

@Injectable()
export class SellerRepository {
  constructor(
    @InjectRepository(Seller)
    private readonly repository: Repository<Seller>,
  ) {}

  async create(seller: Partial<Seller>): Promise<Seller> {
    const newSeller = this.repository.create(seller);
    return this.repository.save(newSeller);
  }

  async findAll(): Promise<Seller[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<Seller | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Seller | null> {
    return this.repository.findOne({ where: { email } });
  }

  async update(id: string, seller: Partial<Seller>): Promise<Seller | null> {
    await this.repository.update(id, seller);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}

