import { Test, TestingModule } from '@nestjs/testing';
import { ProductUseCases } from './product.usecase';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { SellerRepository } from '../../domain/repositories/seller.repository';
import { CartRepository } from '../../domain/repositories/cart.repository';
import { RabbitMQPublisher } from '../../messaging/rabbitmq/publisher';
import { NotFoundException } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { Seller, SellerStatus } from '../../domain/entities/seller.entity';
import { Cart } from '../../domain/entities/cart.entity';

describe('ProductUseCases', () => {
  let useCases: ProductUseCases;
  let productRepository: jest.Mocked<ProductRepository>;
  let sellerRepository: jest.Mocked<SellerRepository>;
  let cartRepository: jest.Mocked<CartRepository>;
  let publisher: jest.Mocked<RabbitMQPublisher>;

  beforeEach(async () => {
    const mockProductRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySellerId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockSellerRepository = {
      findById: jest.fn(),
    };

    const mockCartRepository = {
      findOrCreate: jest.fn(),
    };

    const mockPublisher = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductUseCases,
        { provide: ProductRepository, useValue: mockProductRepository },
        { provide: SellerRepository, useValue: mockSellerRepository },
        { provide: CartRepository, useValue: mockCartRepository },
        { provide: RabbitMQPublisher, useValue: mockPublisher },
      ],
    }).compile();

    useCases = module.get<ProductUseCases>(ProductUseCases);
    productRepository = module.get(ProductRepository);
    sellerRepository = module.get(SellerRepository);
    cartRepository = module.get(CartRepository);
    publisher = module.get(RabbitMQPublisher);
  });

  describe('createProduct', () => {
    it('should create a product and publish event', async () => {
      const dto = {
        sellerId: 'seller-123',
        name: 'Laptop',
        price: 1200,
        stock: 10,
      };

      const seller: Seller = {
        id: 'seller-123',
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      const cart: Cart = {
        id: 'cart-123',
        sellerId: 'seller-123',
        items: [],
      };

      const product: Product = {
        id: 'product-123',
        ...dto,
        currency: 'USD',
        createdAt: new Date(),
        seller,
      };

      sellerRepository.findById.mockResolvedValue(seller);
      productRepository.create.mockResolvedValue(product);
      cartRepository.findOrCreate.mockResolvedValue(cart);
      publisher.publish.mockResolvedValue(undefined);

      const result = await useCases.createProduct(dto);

      expect(result).toEqual(product);
      expect(sellerRepository.findById).toHaveBeenCalledWith(dto.sellerId);
      expect(productRepository.create).toHaveBeenCalledWith({ ...dto, currency: 'USD' });
      expect(publisher.publish).toHaveBeenCalledWith({
        event: 'product.created',
        context: {
          sellerId: dto.sellerId,
          cartId: cart.id,
        },
        data: {
          productId: product.id,
          name: product.name,
          price: product.price,
          sellerId: product.sellerId,
        },
      });
    });

    it('should throw NotFoundException if seller not found', async () => {
      const dto = {
        sellerId: 'seller-999',
        name: 'Laptop',
        price: 1200,
        stock: 10,
      };

      sellerRepository.findById.mockResolvedValue(null);

      await expect(useCases.createProduct(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProduct', () => {
    it('should update product and publish stock event if stock changed', async () => {
      const productId = 'product-123';
      const dto = { stock: 20 };

      const product: Product = {
        id: productId,
        sellerId: 'seller-123',
        name: 'Laptop',
        price: 1200,
        stock: 10,
        currency: 'USD',
        createdAt: new Date(),
        seller: {} as Seller,
      };

      const cart: Cart = {
        id: 'cart-123',
        sellerId: 'seller-123',
        items: [],
      };

      const updatedProduct: Product = {
        ...product,
        stock: 20,
      };

      productRepository.findById.mockResolvedValue(product);
      productRepository.update.mockResolvedValue(updatedProduct);
      cartRepository.findOrCreate.mockResolvedValue(cart);
      publisher.publish.mockResolvedValue(undefined);

      const result = await useCases.updateProduct(productId, dto);

      expect(result).toEqual(updatedProduct);
      expect(publisher.publish).toHaveBeenCalledWith({
        event: 'product.stock.updated',
        context: {
          sellerId: product.sellerId,
          cartId: cart.id,
        },
        data: {
          productId,
          stock: 20,
          previousStock: 10,
        },
      });
    });
  });
});

