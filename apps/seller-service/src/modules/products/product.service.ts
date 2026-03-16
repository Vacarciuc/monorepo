import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { CreateProductDto } from '../../dto/create-product.dto';
import { UpdateProductDto } from '../../dto/update-product.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  private readonly DEFAULT_SELLER_ID = '00000000-0000-0000-0000-000000000001';

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createProduct(
    createProductDto: CreateProductDto,
    imagePath?: string,
  ): Promise<Product> {
    this.logger.log(`Creating product: ${createProductDto.name}`);

    const product = this.productRepository.create({
      ...createProductDto,
      sellerId: createProductDto.sellerId || this.DEFAULT_SELLER_ID,
      imagePath: imagePath,
    });

    const savedProduct = await this.productRepository.save(product);
    this.logger.log(`Product created with ID: ${savedProduct.id}`);

    return savedProduct;
  }

  async findAllProducts(): Promise<Product[]> {
    return this.productRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    newImagePath?: string,
  ): Promise<Product> {
    const product = await this.findProductById(id);

    this.logger.log(`Updating product ${id}`);

    // If new image is uploaded, delete old image
    if (newImagePath && product.imagePath) {
      this.deleteImageFile(product.imagePath);
    }

    // Update product fields
    Object.assign(product, updateProductDto);
    if (newImagePath) {
      product.imagePath = newImagePath;
    }

    const updatedProduct = await this.productRepository.save(product);
    this.logger.log(`Product ${id} updated successfully`);

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await this.findProductById(id);

    // Delete product image from disk
    if (product.imagePath) {
      this.deleteImageFile(product.imagePath);
    }

    await this.productRepository.remove(product);
    this.logger.log(`Product ${id} deleted successfully`);
  }

  private deleteImageFile(imagePath: string): void {
    try {
      const fullPath = path.join(process.cwd(), imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        this.logger.log(`Deleted image file: ${imagePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete image file: ${imagePath}`, error);
    }
  }
}

