import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { Public } from '@/auth/auth.decorator'
import { Role } from '@/auth/auth.decorator'
import { UserRole } from '@/auth/user-role'
import { PendingSellerOrderDto, OrderActionResultDto } from '@/seller/dto/seller-order.dto'
import {
  CreateSellerProductDto,
  SellerProductDto,
  UpdateSellerProductDto,
} from '@/seller/dto/seller-product.dto'
import { SellerService } from '@/seller/seller.service'

const imageInterceptor = FileInterceptor('image', {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  },
})

@Controller('seller')
@ApiTags('Seller')
@ApiBadRequestResponse()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  // ── Orders ────────────────────────────────────────────────────────────────

  @Get('orders')
  @Role(UserRole.Seller)
  @ApiOperation({ summary: 'Toate comenzile primite (seller/admin)' })
  @ApiOkResponse({ type: [PendingSellerOrderDto] })
  getAllOrders(): Promise<PendingSellerOrderDto[]> {
    return this.sellerService.getAllOrders()
  }

  @Get('orders/:id')
  @Role(UserRole.Seller)
  @ApiOperation({ summary: 'Comandă după ID (seller/admin)' })
  @ApiOkResponse({ type: PendingSellerOrderDto })
  @ApiNotFoundResponse()
  getOrderById(@Param('id') id: string): Promise<PendingSellerOrderDto> {
    return this.sellerService.getOrderById(id)
  }

  @Post('orders/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @Role(UserRole.Seller)
  @ApiOperation({ summary: 'Confirmă o comandă (seller/admin)' })
  @ApiOkResponse({ type: OrderActionResultDto })
  @ApiNotFoundResponse()
  confirmOrder(@Param('id') id: string): Promise<OrderActionResultDto> {
    return this.sellerService.confirmOrder(id)
  }

  @Post('orders/:id/reject')
  @HttpCode(HttpStatus.OK)
  @Role(UserRole.Seller)
  @ApiOperation({ summary: 'Respinge o comandă (seller/admin)' })
  @ApiOkResponse({ type: OrderActionResultDto })
  @ApiNotFoundResponse()
  rejectOrder(@Param('id') id: string): Promise<OrderActionResultDto> {
    return this.sellerService.rejectOrder(id)
  }

  // ── Products ──────────────────────────────────────────────────────────────

  @Get('products')
  @Public()
  @ApiOperation({ summary: 'Toate produsele din catalog' })
  @ApiOkResponse({ type: [SellerProductDto] })
  getAllProducts(): Promise<SellerProductDto[]> {
    return this.sellerService.getAllProducts()
  }

  @Get('products/:id')
  @Public()
  @ApiOperation({ summary: 'Produs după ID' })
  @ApiOkResponse({ type: SellerProductDto })
  @ApiNotFoundResponse()
  getProductById(@Param('id') id: string): Promise<SellerProductDto> {
    return this.sellerService.getProductById(id)
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @Role(UserRole.Seller)
  @UseInterceptors(imageInterceptor)
  @ApiOperation({ summary: 'Creează un produs nou (cu imagine opțională)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'price'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        quantity: { type: 'integer' },
        sellerId: { type: 'string', format: 'uuid' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: SellerProductDto })
  createProduct(
    @Body() dto: CreateSellerProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SellerProductDto> {
    return this.sellerService.createProduct(dto, file)
  }

  @Put('products/:id')
  @Role(UserRole.Seller)
  @UseInterceptors(imageInterceptor)
  @ApiOperation({ summary: 'Actualizează un produs (cu imagine opțională)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        quantity: { type: 'integer' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: SellerProductDto })
  @ApiNotFoundResponse()
  updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateSellerProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SellerProductDto> {
    return this.sellerService.updateProduct(id, dto, file)
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Role(UserRole.Seller)
  @ApiOperation({ summary: 'Șterge un produs' })
  @ApiNotFoundResponse()
  deleteProduct(@Param('id') id: string): Promise<void> {
    return this.sellerService.deleteProduct(id)
  }
}


