import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { HttpService } from '@nestjs/axios'
import { Response } from 'express'
import { firstValueFrom } from 'rxjs'
import { isAxiosError } from 'axios'

import { Public } from '@/auth/auth.decorator'
import { AppEnv } from '@/types/app-env.types'

@Controller()
@ApiTags('Uploads')
export class UploadsProxyController {
  private readonly sellerServiceUrl: string

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService<AppEnv>,
  ) {
    this.sellerServiceUrl = configService.get('SELLER_SERVICE_URL')!
  }

  @Get('uploads/products/:filename')
  @Public()
  @ApiOperation({ summary: 'Proxy imagine produs din seller-service' })
  async serveProductImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const url = `${this.sellerServiceUrl}/uploads/products/${filename}`
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { responseType: 'stream' }),
      )
      const contentType = response.headers['content-type'] ?? 'application/octet-stream'
      res.setHeader('Content-Type', contentType)
      res.setHeader('Cache-Control', 'public, max-age=86400')
      ;(response.data as NodeJS.ReadableStream).pipe(res)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        throw new NotFoundException('Imaginea produsului nu a fost găsită')
      }
      throw new NotFoundException('Imaginea produsului nu a fost găsită')
    }
  }
}

