import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { Role } from '@/auth/auth.decorator'
import { UserRole } from '@/auth/user-role'
import { SellerOrderDto } from '@/seller/dto/seller-order.dto'
import { SellerService } from '@/seller/seller.service'

@Controller('seller')
@ApiTags('Seller')
@ApiBadRequestResponse()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('orders')
  @Role(UserRole.Seller)
  @ApiOperation({ summary: 'Toate comenzile primite (seller/admin)' })
  @ApiOkResponse({ type: [SellerOrderDto] })
  getAllOrders(): Promise<SellerOrderDto[]> {
    return this.sellerService.getAllOrders()
  }

  @Get('orders/:id')
  @Role(UserRole.Seller)
  @ApiOperation({ summary: 'Comandă după ID (seller/admin)' })
  @ApiOkResponse({ type: SellerOrderDto })
  @ApiNotFoundResponse()
  getOrderById(@Param('id') id: string): Promise<SellerOrderDto> {
    return this.sellerService.getOrderById(id)
  }

  @Post('orders/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @Role(UserRole.Seller)
  @ApiOperation({ summary: 'Confirmă o comandă (seller/admin)' })
  @ApiOkResponse({ type: SellerOrderDto })
  @ApiNotFoundResponse()
  confirmOrder(@Param('id') id: string): Promise<SellerOrderDto> {
    return this.sellerService.confirmOrder(id)
  }

  @Post('orders/:id/reject')
  @HttpCode(HttpStatus.OK)
  @Role(UserRole.Seller)
  @ApiOperation({ summary: 'Respinge o comandă (seller/admin)' })
  @ApiOkResponse({ type: SellerOrderDto })
  @ApiNotFoundResponse()
  rejectOrder(@Param('id') id: string): Promise<SellerOrderDto> {
    return this.sellerService.rejectOrder(id)
  }
}

