import { IsNumber, IsPositive, IsString, IsUUID, Min } from 'class-validator'

export class CreateProductDto {
  @IsString()
  name: string

  @IsNumber()
  @IsPositive()
  price: number

  @IsNumber()
  @Min(0)
  stock: number

  @IsUUID()
  seller_id: string
}

export class UpdateProductDto {
  @IsString()
  name?: string

  @IsNumber()
  @IsPositive()
  price?: number

  @IsNumber()
  @Min(0)
  stock?: number
}
