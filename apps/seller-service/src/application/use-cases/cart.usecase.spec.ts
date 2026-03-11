import { Test, TestingModule } from '@nestjs/testing';
import { CartUseCases } from './cart.usecase';
import { CartRepository } from '../../domain/repositories/cart.repository';
import { ProductRepository } from '../../domain/repositories/product.repository';
import { SellerRepository } from '../../domain/repositories/seller.repository';
import { RabbitMQPublisher } from '../../messaging/rabbitmq/publisher';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Cart } from '../../domain/entities/cart.entity';
import { Product } from '../../domain/entities/product.entity';
import { Seller, SellerStatus } from '../../domain/entities/seller.entity';

describe('CartUseCases', () => {
  let useCases: CartUseCases;
  let cartRepository: jest.Mocked<CartRepository>;
  let productRepository: jest.Mocked<ProductRepository>;
  let sellerRepository: jest.Mocked<SellerRepository>;
  let publisher: jest.Mocked<RabbitMQPublisher>;

  beforeEach(async () => {
    const mockCartRepository = {
      findOrCreate: jest.fn(),
      update: jest.fn(),
    };

    const mockProductRepository = {
      findById: jest.fn(),
    };

    const mockSellerRepository = {
      findById: jest.fn(),
    };

    const mockPublisher = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartUseCases,
        { provide: CartRepository, useValue: mockCartRepository },
        { provide: ProductRepository, useValue: mockProductRepository },
        { provide: SellerRepository, useValue: mockSellerRepository },
        { provide: RabbitMQPublisher, useValue: mockPublisher },
      ],
    }).compile();

    useCases = module.get<CartUseCases>(CartUseCases);
    cartRepository = module.get(CartRepository);
    productRepository = module.get(ProductRepository);
    sellerRepository = module.get(SellerRepository);
    publisher = module.get(RabbitMQPublisher);
  });

  describe('getCart', () => {
    it('should return cart for seller', async () => {
      const sellerId = 'seller-123';

      const seller: Seller = {
        id: sellerId,
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      const cart: Cart = {
        id: 'cart-123',
        sellerId,
        items: [],
      };

      sellerRepository.findById.mockResolvedValue(seller);
      cartRepository.findOrCreate.mockResolvedValue(cart);

      const result = await useCases.getCart(sellerId);

      expect(result).toEqual(cart);
      expect(sellerRepository.findById).toHaveBeenCalledWith(sellerId);
      expect(cartRepository.findOrCreate).toHaveBeenCalledWith(sellerId);
    });

    it('should throw NotFoundException if seller not found', async () => {
      sellerRepository.findById.mockResolvedValue(null);

      await expect(useCases.getCart('seller-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addItem', () => {
    it('should add item to cart and publish event', async () => {
      const sellerId = 'seller-123';
      const dto = { productId: 'product-123', quantity: 2 };

      const seller: Seller = {
        id: sellerId,
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      const product: Product = {
        id: 'product-123',
        sellerId,
        name: 'Laptop',
        price: 1200,
        stock: 10,
        currency: 'USD',
        createdAt: new Date(),
        seller,
      };

      const cart: Cart = {
        id: 'cart-123',
        sellerId,
        items: [],
      };

      const updatedCart: Cart = {
        ...cart,
        items: [{ productId: dto.productId, quantity: dto.quantity }],
      };

      sellerRepository.findById.mockResolvedValue(seller);
      cartRepository.findOrCreate.mockResolvedValue(cart);
      productRepository.findById.mockResolvedValue(product);
      cartRepository.update.mockResolvedValue(updatedCart);
      publisher.publish.mockResolvedValue(undefined);

      const result = await useCases.addItem(sellerId, dto);

      expect(result).toEqual(updatedCart);
      expect(publisher.publish).toHaveBeenCalledWith({
        event: 'cart.updated',
        context: {
          sellerId,
          cartId: cart.id,
        },
        data: {
          cartId: cart.id,
          sellerId,
          itemCount: 1,
        },
      });
    });

    it('should throw BadRequestException if product does not belong to seller', async () => {
      const sellerId = 'seller-123';
      const dto = { productId: 'product-123', quantity: 2 };

      const seller: Seller = {
        id: sellerId,
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      const product: Product = {
        id: 'product-123',
        sellerId: 'other-seller',
        name: 'Laptop',
        price: 1200,
        stock: 10,
        currency: 'USD',
        createdAt: new Date(),
        seller: {} as Seller,
      };

      const cart: Cart = {
        id: 'cart-123',
        sellerId,
        items: [],
      };

      sellerRepository.findById.mockResolvedValue(seller);
      cartRepository.findOrCreate.mockResolvedValue(cart);
      productRepository.findById.mockResolvedValue(product);

      await expect(useCases.addItem(sellerId, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart and publish event', async () => {
      const sellerId = 'seller-123';
      const productId = 'product-123';

      const seller: Seller = {
        id: sellerId,
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      const cart: Cart = {
        id: 'cart-123',
        sellerId,
        items: [{ productId, quantity: 2 }],
      };

      const updatedCart: Cart = {
        ...cart,
        items: [],
      };

      sellerRepository.findById.mockResolvedValue(seller);
      cartRepository.findOrCreate.mockResolvedValue(cart);
      cartRepository.update.mockResolvedValue(updatedCart);
      publisher.publish.mockResolvedValue(undefined);

      const result = await useCases.removeItem(sellerId, productId);

      expect(result).toEqual(updatedCart);
      expect(publisher.publish).toHaveBeenCalledWith({
        event: 'cart.item.removed',
        context: {
          sellerId,
          cartId: cart.id,
        },
        data: {
          cartId: cart.id,
          sellerId,
          itemCount: 0,
        },
      });
    });

    it('should throw NotFoundException if item not found in cart', async () => {
      const sellerId = 'seller-123';
      const productId = 'product-999';

      const seller: Seller = {
        id: sellerId,
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      const cart: Cart = {
        id: 'cart-123',
        sellerId,
        items: [],
      };

      sellerRepository.findById.mockResolvedValue(seller);
      cartRepository.findOrCreate.mockResolvedValue(cart);

      await expect(useCases.removeItem(sellerId, productId)).rejects.toThrow(NotFoundException);
    });
  });
});

