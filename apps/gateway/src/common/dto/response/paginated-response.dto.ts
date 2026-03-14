import { ApiProperty } from '@nestjs/swagger';

export abstract class PaginatedResponseDto<T> {
   abstract items: T[];

   @ApiProperty({ type: Number })
   totalItems: number = null!;

   @ApiProperty({ type: Number })
   itemsPerPage: number = null!;

   @ApiProperty({ type: Number })
   page: number = null!;
}
