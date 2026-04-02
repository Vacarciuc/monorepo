import { HttpService } from '@nestjs/axios'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom } from 'rxjs'

export interface SellerProduct {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  imagePath?: string
  sellerId: string
  createdAt: string
  updatedAt: string
}

@Injectable()
export class SellerClientService {
  private readonly logger = new Logger(SellerClientService.name)
  private readonly baseUrl: string

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService.get<string>('SELLER_SERVICE_URL', 'http://seller-service:3000')
  }

  async getProduct(id: string): Promise<SellerProduct> {
    try {
      const response$ = this.httpService.get<SellerProduct>(
        `${this.baseUrl}/products/${id}`,
      )
      const response = await firstValueFrom(response$)
      return response.data
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 404) {
        throw new NotFoundException(`Product with ID ${id} not found`)
      }
      this.logger.error(`Failed to get product ${id}: ${err?.message}`)
      throw err
    }
  }

  async getProducts(): Promise<SellerProduct[]> {
    try {
      const response$ = this.httpService.get<SellerProduct[]>(
        `${this.baseUrl}/products`,
      )
      const response = await firstValueFrom(response$)
      return response.data
    } catch (err: any) {
      this.logger.error(`Failed to get products: ${err?.message}`)
      throw err
    }
  }
}

