import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Cart } from '../../database/entities/cart.entity';
import { Product } from '../../database/entities/product.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// ─── helpers ────────────────────────────────────────────────────────────────

const CUSTOMER = 'customer-uuid-1';
const PRODUCT_ID = 'prod-uuid-1';

const makeProduct = (overrides: Partial<any> = {}) => ({
  id: PRODUCT_ID,
  name: 'Green Tea',
  price: 24.99,
  quantity: 50,
  imagePath: null,
  sellerId: 'seller-1',
  ...overrides,
});

const makeCart = (items: any[] = []) => ({
  id: 'cart-uuid-1',
  customerId: CUSTOMER,
  items,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ─── suite ───────────────────────────────────────────────────────────────────

describe('CartService', () => {
  let service: CartService;

  const mockCartRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockProductRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(Cart), useValue: mockCartRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    jest.clearAllMocks();
  });

  // ── getCart ────────────────────────────────────────────────────────────────

  describe('getCart', () => {
    it('returns existing cart', async () => {
      const cart = makeCart();
      mockCartRepo.findOne.mockResolvedValue(cart);

      const result = await service.getCart(CUSTOMER);

      expect(mockCartRepo.findOne).toHaveBeenCalledWith({
        where: { customerId: CUSTOMER },
      });
      expect(result).toEqual(cart);
    });

    it('creates a new cart when none exists', async () => {
      const cart = makeCart();
      mockCartRepo.findOne.mockResolvedValue(null);
      mockCartRepo.create.mockReturnValue(cart);
      mockCartRepo.save.mockResolvedValue(cart);

      const result = await service.getCart(CUSTOMER);

      expect(mockCartRepo.create).toHaveBeenCalledWith({
        customerId: CUSTOMER,
        items: [],
      });
      expect(result.items).toEqual([]);
    });
  });

  // ── addItem ────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('adds a new item to an empty cart', async () => {
      const product = makeProduct();
      const cart = makeCart();
      const updatedCart = makeCart([
        { productId: PRODUCT_ID, name: 'Green Tea', price: 24.99, quantity: 2 },
      ]);

      mockProductRepo.findOne.mockResolvedValue(product);
      mockCartRepo.findOne.mockResolvedValue(cart);
      mockCartRepo.save.mockResolvedValue(updatedCart);

      const result = await service.addItem(CUSTOMER, {
        productId: PRODUCT_ID,
        quantity: 2,
      });

      expect(mockCartRepo.save).toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(2);
    });

    it('increases quantity for an existing item', async () => {
      const product = makeProduct({ quantity: 50 });
      const cart = makeCart([
        { productId: PRODUCT_ID, name: 'Green Tea', price: 24.99, quantity: 3 },
      ]);
      mockProductRepo.findOne.mockResolvedValue(product);
      mockCartRepo.findOne.mockResolvedValue(cart);
      mockCartRepo.save.mockImplementation(async (c) => c);

      const result = await service.addItem(CUSTOMER, {
        productId: PRODUCT_ID,
        quantity: 2,
      });

      // 3 existing + 2 new = 5
      expect(result.items[0].quantity).toBe(5);
    });

    it('throws NotFoundException when product does not exist', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addItem(CUSTOMER, { productId: 'ghost', quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when quantity exceeds stock', async () => {
      const product = makeProduct({ quantity: 3 });
      const cart = makeCart();
      mockProductRepo.findOne.mockResolvedValue(product);
      mockCartRepo.findOne.mockResolvedValue(cart);

      await expect(
        service.addItem(CUSTOMER, { productId: PRODUCT_ID, quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when cart + new qty exceeds stock', async () => {
      const product = makeProduct({ quantity: 4 });
      // 3 already in cart, trying to add 3 more → 6 > 4
      const cart = makeCart([
        { productId: PRODUCT_ID, quantity: 3, price: 24.99, name: 'Green Tea' },
      ]);
      mockProductRepo.findOne.mockResolvedValue(product);
      mockCartRepo.findOne.mockResolvedValue(cart);

      await expect(
        service.addItem(CUSTOMER, { productId: PRODUCT_ID, quantity: 3 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── updateItem ─────────────────────────────────────────────────────────────

  describe('updateItem', () => {
    it('updates item quantity', async () => {
      const product = makeProduct({ quantity: 50 });
      const cart = makeCart([
        { productId: PRODUCT_ID, quantity: 2, price: 24.99, name: 'Green Tea' },
      ]);
      mockCartRepo.findOne.mockResolvedValue(cart);
      mockProductRepo.findOne.mockResolvedValue(product);
      mockCartRepo.save.mockImplementation(async (c) => c);

      const result = await service.updateItem(CUSTOMER, PRODUCT_ID, {
        quantity: 10,
      });

      expect(result.items[0].quantity).toBe(10);
    });

    it('removes item when quantity is 0', async () => {
      const cart = makeCart([
        { productId: PRODUCT_ID, quantity: 2, price: 24.99, name: 'Green Tea' },
      ]);
      mockCartRepo.findOne.mockResolvedValue(cart);
      mockCartRepo.save.mockImplementation(async (c) => c);

      const result = await service.updateItem(CUSTOMER, PRODUCT_ID, {
        quantity: 0,
      });

      expect(result.items).toHaveLength(0);
    });

    it('throws BadRequestException when new quantity exceeds stock', async () => {
      const product = makeProduct({ quantity: 5 });
      const cart = makeCart([
        { productId: PRODUCT_ID, quantity: 2, price: 24.99, name: 'Green Tea' },
      ]);
      mockCartRepo.findOne.mockResolvedValue(cart);
      mockProductRepo.findOne.mockResolvedValue(product);

      await expect(
        service.updateItem(CUSTOMER, PRODUCT_ID, { quantity: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when item is not in cart', async () => {
      const product = makeProduct({ quantity: 50 });
      const cart = makeCart([]); // empty cart
      mockCartRepo.findOne.mockResolvedValue(cart);
      mockProductRepo.findOne.mockResolvedValue(product);

      await expect(
        service.updateItem(CUSTOMER, PRODUCT_ID, { quantity: 1 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── removeItem ─────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('removes specific item from cart', async () => {
      const cart = makeCart([
        { productId: PRODUCT_ID, quantity: 1, price: 24.99, name: 'Green Tea' },
        { productId: 'other-id', quantity: 2, price: 9.99, name: 'Honey' },
      ]);
      mockCartRepo.findOne.mockResolvedValue(cart);
      mockCartRepo.save.mockImplementation(async (c) => c);

      const result = await service.removeItem(CUSTOMER, PRODUCT_ID);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('other-id');
    });
  });

  // ── clearCart ──────────────────────────────────────────────────────────────

  describe('clearCart', () => {
    it('empties all items', async () => {
      const cart = makeCart([
        { productId: PRODUCT_ID, quantity: 3, price: 24.99, name: 'Green Tea' },
      ]);
      mockCartRepo.findOne.mockResolvedValue(cart);
      mockCartRepo.save.mockImplementation(async (c) => c);

      const result = await service.clearCart(CUSTOMER);

      expect(result.items).toHaveLength(0);
    });
  });

  // ── checkoutPayload ────────────────────────────────────────────────────────

  describe('checkoutPayload', () => {
    it('returns correct payload with totalPrice', async () => {
      const cart = makeCart([
        { productId: 'p1', quantity: 2, price: 10.0, name: 'Item A' },
        { productId: 'p2', quantity: 1, price: 5.5, name: 'Item B' },
      ]);
      mockCartRepo.findOne.mockResolvedValue(cart);

      const result = await service.checkoutPayload(CUSTOMER);

      expect(result.customerId).toBe(CUSTOMER);
      expect(result.items).toHaveLength(2);
      expect(result.totalPrice).toBeCloseTo(25.5);
      expect(result.createdAt).toBeDefined();
    });

    it('throws BadRequestException when cart is empty', async () => {
      const cart = makeCart([]);
      mockCartRepo.findOne.mockResolvedValue(cart);

      await expect(service.checkoutPayload(CUSTOMER)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rounds totalPrice to 2 decimal places', async () => {
      const cart = makeCart([
        { productId: 'p1', quantity: 3, price: 1.005, name: 'Item' },
      ]);
      mockCartRepo.findOne.mockResolvedValue(cart);

      const result = await service.checkoutPayload(CUSTOMER);

      expect(result.totalPrice).toBe(Math.round(3 * 1.005 * 100) / 100);
    });
  });
});
