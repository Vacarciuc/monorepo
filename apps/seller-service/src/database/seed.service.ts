import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

const DEFAULT_SELLER_ID = '00000000-0000-0000-0000-000000000001';

const MOCK_PRODUCTS = [
  {
    name: 'Organic Green Tea',
    description:
      'Premium loose-leaf green tea sourced from sustainable farms in Japan. Rich in antioxidants and natural flavors.',
    price: 24.99,
    quantity: 150,
    sellerId: DEFAULT_SELLER_ID,
  },
  {
    name: 'Cold-Press Olive Oil',
    description:
      'Extra virgin olive oil cold-pressed from hand-picked olives. Perfect for cooking and salads.',
    price: 18.5,
    quantity: 80,
    sellerId: DEFAULT_SELLER_ID,
  },
  {
    name: 'Raw Wildflower Honey',
    description:
      'Unfiltered, raw honey collected from wildflower meadows. No additives, pure nature in a jar.',
    price: 14.99,
    quantity: 200,
    sellerId: DEFAULT_SELLER_ID,
  },
  {
    name: 'Quinoa Grain (500g)',
    description:
      'High-protein organic quinoa grain, perfect for salads, bowls, and side dishes. Gluten-free.',
    price: 9.99,
    quantity: 300,
    sellerId: DEFAULT_SELLER_ID,
  },
  {
    name: 'Coconut Sugar',
    description:
      'Natural coconut palm sugar with a low glycemic index. A healthier alternative to refined sugar.',
    price: 7.49,
    quantity: 250,
    sellerId: DEFAULT_SELLER_ID,
  },
  {
    name: 'Chia Seeds (250g)',
    description:
      'Organic chia seeds packed with omega-3 fatty acids, fiber, and protein. Ideal for smoothies and puddings.',
    price: 6.99,
    quantity: 400,
    sellerId: DEFAULT_SELLER_ID,
  },
  {
    name: 'Almond Butter',
    description:
      'Creamy natural almond butter made from 100% roasted almonds. No added sugar or palm oil.',
    price: 12.99,
    quantity: 120,
    sellerId: DEFAULT_SELLER_ID,
  },
  {
    name: 'Turmeric Powder (100g)',
    description:
      'Pure turmeric root powder with high curcumin content. Great for curries, golden milk, and health drinks.',
    price: 4.99,
    quantity: 500,
    sellerId: DEFAULT_SELLER_ID,
  },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedProducts();
  }

  private async seedProducts(): Promise<void> {
    try {
      const count = await this.productRepository.count();
      if (count > 0) {
        this.logger.log(`Database already has ${count} products, skipping seed.`);
        return;
      }

      this.logger.log('Seeding mock products into the database...');
      const products = this.productRepository.create(MOCK_PRODUCTS);
      await this.productRepository.save(products);
      this.logger.log(`Successfully seeded ${products.length} products.`);
    } catch (error) {
      this.logger.error('Failed to seed products:', error);
    }
  }
}


