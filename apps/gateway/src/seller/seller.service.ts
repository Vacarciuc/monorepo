import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'

import { BaseMicroserviceService } from '@/common/classes/base-microservice-service'
import { sellerEndpoints } from '@/seller/seller-endpoints.constants'
import { SellerOrderDto } from '@/seller/dto/seller-order.dto'

@Injectable()
export class SellerService extends BaseMicroserviceService {
  constructor(httpService: HttpService) {
    super(httpService, new Logger(SellerService.name))
  }

  getAllOrders(): Promise<SellerOrderDto[]> {
    return this.forwardRequest({
      url: sellerEndpoints.getAllOrders(),
      method: 'GET',
    })
  }

  getOrderById(id: string): Promise<SellerOrderDto> {
    return this.forwardRequest({
      url: sellerEndpoints.getOrderById({ id }),
      method: 'GET',
    })
  }

  confirmOrder(id: string): Promise<SellerOrderDto> {
    return this.forwardRequest({
      url: sellerEndpoints.confirmOrder({ id }),
      method: 'POST',
    })
  }

  rejectOrder(id: string): Promise<SellerOrderDto> {
    return this.forwardRequest({
      url: sellerEndpoints.rejectOrder({ id }),
      method: 'POST',
    })
  }
}

