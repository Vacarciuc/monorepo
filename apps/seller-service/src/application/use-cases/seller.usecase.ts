import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { SellerRepository } from '../../domain/repositories/seller.repository';
import { Seller } from '../../domain/entities/seller.entity';
import { CreateSellerDto, UpdateSellerDto } from '../../dto/seller.dto';

@Injectable()
export class SellerUseCases {
  constructor(private readonly sellerRepository: SellerRepository) {}

  async createSeller(dto: CreateSellerDto): Promise<Seller> {
    const existingSeller = await this.sellerRepository.findByEmail(dto.email);
    if (existingSeller) {
      throw new ConflictException(`Seller with email ${dto.email} already exists`);
    }

    return this.sellerRepository.create(dto);
  }

  async getAllSellers(): Promise<Seller[]> {
    return this.sellerRepository.findAll();
  }

  async getSellerById(id: string): Promise<Seller> {
    const seller = await this.sellerRepository.findById(id);
    if (!seller) {
      throw new NotFoundException(`Seller with ID ${id} not found`);
    }
    return seller;
  }

  async updateSeller(id: string, dto: UpdateSellerDto): Promise<Seller> {
    const seller = await this.getSellerById(id);

    if (dto.email && dto.email !== seller.email) {
      const existingSeller = await this.sellerRepository.findByEmail(dto.email);
      if (existingSeller) {
        throw new ConflictException(`Seller with email ${dto.email} already exists`);
      }
    }

    const updated = await this.sellerRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Seller with ID ${id} not found`);
    }
    return updated;
  }

  async deleteSeller(id: string): Promise<void> {
    await this.getSellerById(id);
    await this.sellerRepository.delete(id);
  }
}

