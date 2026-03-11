import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SellerUseCases } from '../../application/use-cases/seller.usecase';
import { CreateSellerDto, UpdateSellerDto, SellerResponseDto } from '../../dto/seller.dto';

@ApiTags('sellers')
@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerUseCases: SellerUseCases) {}

  @Post()
  @ApiOperation({ summary: 'Create a new seller' })
  @ApiResponse({ status: 201, description: 'Seller created successfully', type: SellerResponseDto })
  @ApiResponse({ status: 409, description: 'Seller with this email already exists' })
  async createSeller(@Body() dto: CreateSellerDto): Promise<SellerResponseDto> {
    return this.sellerUseCases.createSeller(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sellers' })
  @ApiResponse({ status: 200, description: 'List of sellers', type: [SellerResponseDto] })
  async getAllSellers(): Promise<SellerResponseDto[]> {
    return this.sellerUseCases.getAllSellers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get seller by ID' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Seller found', type: SellerResponseDto })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async getSellerById(@Param('id') id: string): Promise<SellerResponseDto> {
    return this.sellerUseCases.getSellerById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update seller' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Seller updated successfully', type: SellerResponseDto })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async updateSeller(
    @Param('id') id: string,
    @Body() dto: UpdateSellerDto,
  ): Promise<SellerResponseDto> {
    return this.sellerUseCases.updateSeller(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete seller' })
  @ApiParam({ name: 'id', description: 'Seller ID' })
  @ApiResponse({ status: 204, description: 'Seller deleted successfully' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async deleteSeller(@Param('id') id: string): Promise<void> {
    return this.sellerUseCases.deleteSeller(id);
  }
}

