import {
  Controller,
  Get,
  Post,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { SellerService, OrderActionResult } from './seller.service';

export interface PendingOrderDto {
  orderId: string;
  sellerId: string;
  items: { productId: string; quantity: number; price: number }[];
  totalPrice: number;
  receivedAt: string;
}

@ApiTags('seller-orders')
@Controller('seller/orders')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get()
  @ApiOperation({
    summary: 'Comenzi pendinte din coadă (fără DB)',
    description:
      'Returnează comenzile aflate în memorie (neACK-ate). ' +
      'Mesajele rămân în broker până la confirmare/respingere.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Listă comenzi pendinte' })
  getPendingOrders(): PendingOrderDto[] {
    return this.sellerService.getPendingOrders().map((p) => ({
      orderId: p.event.orderId,
      sellerId: p.event.sellerId,
      items: p.event.items,
      totalPrice: p.event.totalPrice,
      receivedAt: p.receivedAt.toISOString(),
    }));
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Comandă pendintă după ID' })
  @ApiParam({ name: 'orderId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comandă pendintă' })
  @ApiNotFoundResponse({ description: 'orderId nu se află în coada pendinte' })
  getOrderById(@Param('orderId') orderId: string): PendingOrderDto {
    const p = this.sellerService.getOrderById(orderId);
    return {
      orderId: p.event.orderId,
      sellerId: p.event.sellerId,
      items: p.event.items,
      totalPrice: p.event.totalPrice,
      receivedAt: p.receivedAt.toISOString(),
    };
  }

  @Post(':orderId/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmă comanda (ACK + publică CONFIRMED)',
    description:
      'Scade stocul, ACK-ează mesajul din coadă și publică order.processed cu CONFIRMED.',
  })
  @ApiParam({
    name: 'orderId',
    type: 'string',
    format: 'uuid',
    description: 'orderId din order-service',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comanda confirmată' })
  @ApiNotFoundResponse({
    description: 'orderId nu se află în coada pendinte',
  })
  async confirmOrder(
    @Param('orderId') orderId: string,
  ): Promise<OrderActionResult> {
    return this.sellerService.confirmOrder(orderId);
  }

  @Post(':orderId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Respinge comanda (NACK + publică REJECTED)',
    description:
      'NACK-ează mesajul (eliminat din coadă) și publică order.processed cu REJECTED.',
  })
  @ApiParam({
    name: 'orderId',
    type: 'string',
    format: 'uuid',
    description: 'orderId din order-service',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Comanda respinsă' })
  @ApiNotFoundResponse({
    description: 'orderId nu se află în coada pendinte',
  })
  async rejectOrder(
    @Param('orderId') orderId: string,
  ): Promise<OrderActionResult> {
    return this.sellerService.rejectOrder(orderId);
  }
}
