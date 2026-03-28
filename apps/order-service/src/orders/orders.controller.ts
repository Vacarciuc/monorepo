import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { OrdersService } from './orders.service'

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Query('userId') userId: string) {
    return this.ordersService.createOrderFromCart(userId)
  }

  @Get()
  async findAll(@Query('userId') userId: string) {
    return this.ordersService.findAll(userId)
  }

  @Get(':id')
  async findOne(@Query('userId') userId: string, @Param('id') id: string) {
    return this.ordersService.findOne(id, userId)
  }
}
