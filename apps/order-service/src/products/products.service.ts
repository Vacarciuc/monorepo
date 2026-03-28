import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { CreateProductDto, UpdateProductDto } from '../dto/product.dto'
import { Product } from '../entities/product.entity'

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto)
    return await this.productRepository.save(product)
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find()
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } })
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`)
    }
    return product
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id)
    Object.assign(product, updateProductDto)
    return await this.productRepository.save(product)
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id)
    await this.productRepository.remove(product)
  }

  async checkStock(productId: string, quantity: number): Promise<boolean> {
    const product = await this.findOne(productId)
    return product.stock >= quantity
  }

  async decreaseStock(productId: string, quantity: number): Promise<void> {
    const product = await this.findOne(productId)
    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product ${product.name}`,
      )
    }
    product.stock -= quantity
    await this.productRepository.save(product)
  }
}
