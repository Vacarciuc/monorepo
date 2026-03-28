import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from '../../database/entities/product.entity';
import { SeedService } from '../../database/seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductController],
  providers: [ProductService, SeedService],
  exports: [ProductService],
})
export class ProductModule {}
