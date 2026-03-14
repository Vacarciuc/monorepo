import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export abstract class PaginatedRequestDto {
   @Transform(({ value }) => parseInt(value))
   @IsInt()
   @Min(0)
   @ApiProperty({ type: Number, default: 0 })
   offset: number = 0;

   @Transform(({ value }) => parseInt(value))
   @IsInt()
   @Min(0)
   @ApiProperty({ type: Number, default: 10 })
   limit: number = 10;
}
