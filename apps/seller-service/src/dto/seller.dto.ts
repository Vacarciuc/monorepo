import { IsString, IsEmail, IsOptional, IsEnum, Length, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SellerStatus } from '../domain/entities/seller.entity';

export class CreateSellerDto {
  @ApiProperty({ example: 'John Doe', description: 'Seller name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Seller email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number' })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  phone?: string;

  @ApiProperty({ example: 'Acme Inc.', description: 'Company name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  companyName: string;
}

export class UpdateSellerDto {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+9876543210' })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  phone?: string;

  @ApiPropertyOptional({ enum: SellerStatus })
  @IsEnum(SellerStatus)
  @IsOptional()
  status?: SellerStatus;
}

export class SellerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ enum: SellerStatus })
  status: SellerStatus;
}

