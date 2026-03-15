import { IsUUID, IsNumber, IsPositive, Min } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;
}

