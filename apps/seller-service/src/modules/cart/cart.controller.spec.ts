import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { UnauthorizedException } from '@nestjs/common';

// Build a minimal JWT with the given sub (no real signing needed for unit tests)
function fakeToken(sub: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString(
    'base64url',
  );
  const payload = Buffer.from(
    JSON.stringify({ sub, email: 'test@test.com' }),
  ).toString('base64url');
  return `Bearer ${header}.${payload}.fakesig`;
}

const CUSTOMER = 'customer-uuid-1';
const MOCK_CUSTOMER_ID = 'mock-customer-dev';
const AUTH = fakeToken(CUSTOMER);

const makeCart = (items: any[] = []) => ({
  id: 'cart-uuid-1',
  customerId: CUSTOMER,
  items,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('CartController', () => {
  let controller: CartController;

  const mockService = {
    getCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
    checkoutPayload: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: mockService }],
    }).compile();

    controller = module.get<CartController>(CartController);
    jest.clearAllMocks();
  });

  // ── auth guard ─────────────────────────────────────────────────────────────

  describe('token extraction', () => {
    it('falls back to mock customer id when no auth header (dev/test env)', async () => {
      const cart = makeCart();
      mockService.getCart.mockResolvedValue(cart);

      await controller.getCart(undefined as any);

      // In non-production env the mock fallback is used
      expect(mockService.getCart).toHaveBeenCalledWith(MOCK_CUSTOMER_ID);
    });

    it('falls back to mock customer id when header is malformed (dev/test env)', async () => {
      const cart = makeCart();
      mockService.getCart.mockResolvedValue(cart);

      await controller.getCart('not-a-token');

      expect(mockService.getCart).toHaveBeenCalledWith(MOCK_CUSTOMER_ID);
    });

    it('throws UnauthorizedException in production when no auth header', async () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      let caught: any;
      try {
        await controller.getCart(undefined as any);
      } catch (e) {
        caught = e;
      } finally {
        process.env.NODE_ENV = original;
      }
      expect(caught).toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException in production when header is malformed', async () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      let caught: any;
      try {
        await controller.getCart('not-a-token');
      } catch (e) {
        caught = e;
      } finally {
        process.env.NODE_ENV = original;
      }
      expect(caught).toBeInstanceOf(UnauthorizedException);
    });
  });

  // ── getCart ────────────────────────────────────────────────────────────────

  describe('getCart', () => {
    it('calls service.getCart with extracted customerId', async () => {
      const cart = makeCart();
      mockService.getCart.mockResolvedValue(cart);

      const result = await controller.getCart(AUTH);

      expect(mockService.getCart).toHaveBeenCalledWith(CUSTOMER);
      expect(result).toEqual(cart);
    });
  });

  // ── addItem ────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('calls service.addItem with correct args', async () => {
      const cart = makeCart([
        { productId: 'p-1', quantity: 2, price: 10, name: 'Tea' },
      ]);
      mockService.addItem.mockResolvedValue(cart);

      const result = await controller.addItem(AUTH, {
        productId: 'p-1',
        quantity: 2,
      });

      expect(mockService.addItem).toHaveBeenCalledWith(CUSTOMER, {
        productId: 'p-1',
        quantity: 2,
      });
      expect(result.items).toHaveLength(1);
    });
  });

  // ── updateItem ─────────────────────────────────────────────────────────────

  describe('updateItem', () => {
    it('calls service.updateItem with correct args', async () => {
      const cart = makeCart([
        { productId: 'p-1', quantity: 5, price: 10, name: 'Tea' },
      ]);
      mockService.updateItem.mockResolvedValue(cart);

      const result = await controller.updateItem(AUTH, 'p-1', { quantity: 5 });

      expect(mockService.updateItem).toHaveBeenCalledWith(CUSTOMER, 'p-1', {
        quantity: 5,
      });
      expect(result.items[0].quantity).toBe(5);
    });
  });

  // ── removeItem ─────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('calls service.removeItem and returns updated cart', async () => {
      const cart = makeCart([]);
      mockService.removeItem.mockResolvedValue(cart);

      const result = await controller.removeItem(AUTH, 'p-1');

      expect(mockService.removeItem).toHaveBeenCalledWith(CUSTOMER, 'p-1');
      expect(result.items).toHaveLength(0);
    });
  });

  // ── clearCart ──────────────────────────────────────────────────────────────

  describe('clearCart', () => {
    it('calls service.clearCart', async () => {
      const cart = makeCart([]);
      mockService.clearCart.mockResolvedValue(cart);

      await controller.clearCart(AUTH);

      expect(mockService.clearCart).toHaveBeenCalledWith(CUSTOMER);
    });
  });

  // ── checkoutPayload ────────────────────────────────────────────────────────

  describe('checkoutPayload', () => {
    it('returns checkout payload from service', async () => {
      const payload = {
        customerId: CUSTOMER,
        items: [{ productId: 'p-1', quantity: 2, price: 10, name: 'Tea' }],
        totalPrice: 20,
        createdAt: new Date().toISOString(),
      };
      mockService.checkoutPayload.mockResolvedValue(payload);

      const result = await controller.checkoutPayload(AUTH);

      expect(mockService.checkoutPayload).toHaveBeenCalledWith(CUSTOMER);
      expect(result.totalPrice).toBe(20);
    });
  });
});
