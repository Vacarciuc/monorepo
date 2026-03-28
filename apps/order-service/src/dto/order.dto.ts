import { Type } from 'class-transformer'
import {
  IsArray,
  IsInt,
  IsNumber,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator'

export class OrderItemDto {
  @IsUUID()
  product_id: string

  @IsInt()
  @IsPositive()
  quantity: number

  @IsNumber()
  @IsPositive()
  price: number
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]
}
