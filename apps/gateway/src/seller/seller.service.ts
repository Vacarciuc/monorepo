import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import FormData from 'form-data'

import { BaseMicroserviceService } from '@/common/classes/base-microservice-service'
import { sellerEndpoints } from '@/seller/seller-endpoints.constants'
import { SellerOrderDto } from '@/seller/dto/seller-order.dto'
import {
  CreateSellerProductDto,
  SellerProductDto,
  UpdateSellerProductDto,
} from '@/seller/dto/seller-product.dto'

@Injectable()
export class SellerService extends BaseMicroserviceService {
  constructor(httpService: HttpService) {
    super(httpService, new Logger(SellerService.name))
  }

  // ── Orders ────────────────────────────────────────────────────────────────

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

  // ── Products ──────────────────────────────────────────────────────────────

  getAllProducts(): Promise<SellerProductDto[]> {
    return this.forwardRequest({
      url: sellerEndpoints.getAllProducts(),
      method: 'GET',
    })
  }

  getProductById(id: string): Promise<SellerProductDto> {
    return this.forwardRequest({
      url: sellerEndpoints.getProductById({ id }),
      method: 'GET',
    })
  }

  createProduct(
    dto: CreateSellerProductDto,
    file?: Express.Multer.File,
  ): Promise<SellerProductDto> {
    const form = this.buildProductForm(dto, file)
    return this.forwardRequest({
      url: sellerEndpoints.createProduct(),
      method: 'POST',
      data: form,
      headers: form.getHeaders(),
    })
  }

  updateProduct(
    id: string,
    dto: UpdateSellerProductDto,
    file?: Express.Multer.File,
  ): Promise<SellerProductDto> {
    const form = this.buildProductForm(dto, file)
    return this.forwardRequest({
      url: sellerEndpoints.updateProduct({ id }),
      method: 'PUT',
      data: form,
      headers: form.getHeaders(),
    })
  }

  deleteProduct(id: string): Promise<void> {
    return this.forwardRequest({
      url: sellerEndpoints.deleteProduct({ id }),
      method: 'DELETE',
    })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private buildProductForm(
    dto: Partial<CreateSellerProductDto & UpdateSellerProductDto>,
    file?: Express.Multer.File,
  ): FormData {
    const form = new FormData()

    if (dto.name !== undefined) form.append('name', dto.name)
    if (dto.description !== undefined) form.append('description', dto.description)
    if (dto.price !== undefined) form.append('price', String(dto.price))
    if (dto.quantity !== undefined) form.append('quantity', String(dto.quantity))
    if ((dto as CreateSellerProductDto).sellerId) {
      form.append('sellerId', (dto as CreateSellerProductDto).sellerId!)
    }
    if (file) {
      form.append('image', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
        knownLength: file.size,
      })
    }

    return form
  }
}

