import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductUseCases } from '../../application/use-cases/product.usecase';
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from '../../dto/product.dto';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productUseCases: ProductUseCases) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async createProduct(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productUseCases.createProduct(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product found', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productUseCases.getProductById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productUseCases.updateProduct(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(@Param('id') id: string): Promise<void> {
    return this.productUseCases.deleteProduct(id);
  }
}

@ApiTags('sellers')
@Controller('sellers')
export class SellerProductController {
  constructor(private readonly productUseCases: ProductUseCases) {}

  @Get(':id/products')
  @ApiOperation({ summary: 'Get all products for a seller' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'List of products', type: [ProductResponseDto] })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async getProductsBySellerId(@Param('id') sellerId: string): Promise<ProductResponseDto[]> {
    return this.productUseCases.getProductsBySellerId(sellerId);
  }
}

