import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { SellerService } from './seller.service';
import { SellerOrder } from '../../database/entities/seller-order.entity';

@ApiTags('seller-orders')
@Controller('seller/orders')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all orders',
    description:
      'Retrieves all orders processed by the seller service, sorted by creation date (newest first).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all orders retrieved successfully',
    type: [SellerOrder],
  })
  async getAllOrders(): Promise<SellerOrder[]> {
    return this.sellerService.findAllOrders();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
    description: 'Retrieves a specific order by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order found and retrieved successfully',
    type: SellerOrder,
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed (uuid is expected)',
        error: 'Bad Request',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Order with id 550e8400-e29b-41d4-a716-446655440000 not found',
        error: 'Not Found',
      },
    },
  })
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SellerOrder> {
    return this.sellerService.findOrderById(id);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually confirm an order',
    description:
      'Manually confirms a pending order, updates status to CONFIRMED, and sends ACK to RabbitMQ (message will be deleted from queue).',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order confirmed successfully',
    type: SellerOrder,
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
  })
  async confirmOrder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SellerOrder> {
    return this.sellerService.confirmOrder(id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually reject an order',
    description:
      'Manually rejects a pending order, updates status to REJECTED, and sends NACK to RabbitMQ (message will be deleted from queue without requeue).',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order rejected successfully',
    type: SellerOrder,
  })
  @ApiBadRequestResponse({
    description: 'Invalid UUID format',
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
  })
  async rejectOrder(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SellerOrder> {
    return this.sellerService.rejectOrder(id);
  }
}

