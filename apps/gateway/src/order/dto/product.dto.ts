import { ApiProperty } from '@nestjs/swagger'

export class ProductDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiProperty()
  price: number

  @ApiProperty()
  stock: number

  @ApiProperty()
  seller_id: string

  @ApiProperty()
  created_at: Date

  @ApiProperty()
  updated_at: Date
}
