import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ProductService } from './product.service';
import { CreateProductDto } from '../../dto/create-product.dto';
import { UpdateProductDto } from '../../dto/update-product.dto';
import { ProductResponseDto } from '../../dto/product-response.dto';

// Multer configuration for image upload
const multerOptions = {
  storage: diskStorage({
    destination: './uploads/products',
    filename: (req, file, callback) => {
      // Generate UUID for filename
      const uuid = uuidv4();
      const ext = extname(file.originalname);
      const filename = `${uuid}${ext}`;
      callback(null, filename);
    },
  }),
  fileFilter: (req, file, callback) => {
    // Only allow image files
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return callback(
        new BadRequestException(
          'Only image files (jpg, jpeg, png, gif, webp) are allowed!',
        ),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
};

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @ApiOperation({
    summary: 'Create a new product',
    description:
      'Creates a new product with optional image upload. Image must be jpg, jpeg, png, gif, or webp format, max 10MB. Filename will be auto-generated using UUID.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'price'],
      properties: {
        name: {
          type: 'string',
          example: 'Laptop Dell XPS 13',
          maxLength: 255,
        },
        description: {
          type: 'string',
          example: 'High-performance laptop with Intel Core i7 processor',
        },
        price: {
          type: 'number',
          example: 1299.99,
          minimum: 0,
        },
        quantity: {
          type: 'integer',
          example: 100,
          minimum: 0,
          default: 0,
        },
        sellerId: {
          type: 'string',
          format: 'uuid',
          example: '223e4567-e89b-12d3-a456-426614174001',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Product image file',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or file format',
  })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    const imagePath = file ? `/uploads/products/${file.filename}` : undefined;
    const product = await this.productService.createProduct(
      createProductDto,
      imagePath,
    );
    return ProductResponseDto.fromEntity(product);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all products',
    description:
      'Retrieves all products, sorted by creation date (newest first).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all products retrieved successfully',
    type: [ProductResponseDto],
  })
  async getAllProducts(): Promise<ProductResponseDto[]> {
    const products = await this.productService.findAllProducts();
    return ProductResponseDto.fromEntities(products);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieves a specific product by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product found and retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  async getProductById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productService.findProductById(id);
    return ProductResponseDto.fromEntity(product);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @ApiOperation({
    summary: 'Update a product',
    description:
      'Updates an existing product. Can update name, description, price, and/or image. If a new image is uploaded, the old one will be deleted.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'Laptop Dell XPS 15',
          maxLength: 255,
        },
        description: {
          type: 'string',
          example: 'Updated description',
        },
        price: {
          type: 'number',
          example: 1499.99,
          minimum: 0,
        },
        quantity: {
          type: 'integer',
          example: 50,
          minimum: 0,
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'New product image file (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or file format',
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    const imagePath = file ? `/uploads/products/${file.filename}` : undefined;
    const product = await this.productService.updateProduct(
      id,
      updateProductDto,
      imagePath,
    );
    return ProductResponseDto.fromEntity(product);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a product',
    description:
      'Deletes a product and its associated image file from the disk.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Product UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Product deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productService.deleteProduct(id);
  }
}
