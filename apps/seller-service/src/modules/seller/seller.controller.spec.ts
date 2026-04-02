import { Test, TestingModule } from '@nestjs/testing';
import { SellerController, PendingOrderDto } from './seller.controller';
import { SellerService, OrderActionResult } from './seller.service';
import { OrderCreatedEvent, OrderItem } from '../../dto/order-created.event';
import { PendingOrder } from '../../messaging/rabbitmq.consumer';

// ─── helpers ────────────────────────────────────────────────────────────────

const makeEvent = (): OrderCreatedEvent => ({
  orderId: '123e4567-e89b-12d3-a456-426614174000',
  sellerId: '223e4567-e89b-12d3-a456-426614174001',
  totalPrice: 100,
  items: [{ productId: 'prod-1', quantity: 2, price: 50 }] as OrderItem[],
});

const makePendingOrder = (): PendingOrder => ({
  event: makeEvent(),
  receivedAt: new Date('2026-01-01T00:00:00.000Z'),
});

// ─── suite ───────────────────────────────────────────────────────────────────

describe('SellerController', () => {
  let controller: SellerController;
  let service: jest.Mocked<SellerService>;

  const mockSellerService = {
    getPendingOrders: jest.fn(),
    getOrderById: jest.fn(),
    confirmOrder: jest.fn(),
    rejectOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerController],
      providers: [{ provide: SellerService, useValue: mockSellerService }],
    }).compile();

    controller = module.get<SellerController>(SellerController);
    service = module.get(SellerService);
    jest.clearAllMocks();
  });

  // ── getPendingOrders ──────────────────────────────────────────────────────

  describe('getPendingOrders', () => {
    it('maps PendingOrder[] to flat PendingOrderDto[]', () => {
      const pending = makePendingOrder();
      mockSellerService.getPendingOrders.mockReturnValue([pending]);

      const result = controller.getPendingOrders();

      expect(service.getPendingOrders).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual<PendingOrderDto>({
        orderId: pending.event.orderId,
        sellerId: pending.event.sellerId,
        items: pending.event.items,
        totalPrice: pending.event.totalPrice,
        receivedAt: pending.receivedAt.toISOString(),
      });
    });

    it('returns empty array when queue is empty', () => {
      mockSellerService.getPendingOrders.mockReturnValue([]);
      expect(controller.getPendingOrders()).toEqual([]);
    });
  });

  // ── getOrderById ──────────────────────────────────────────────────────────

  describe('getOrderById', () => {
    it('maps a single PendingOrder to PendingOrderDto', () => {
      const pending = makePendingOrder();
      mockSellerService.getOrderById.mockReturnValue(pending);

      const result = controller.getOrderById(pending.event.orderId);

      expect(service.getOrderById).toHaveBeenCalledWith(pending.event.orderId);
      expect(result).toEqual<PendingOrderDto>({
        orderId: pending.event.orderId,
        sellerId: pending.event.sellerId,
        items: pending.event.items,
        totalPrice: pending.event.totalPrice,
        receivedAt: pending.receivedAt.toISOString(),
      });
    });
  });

  // ── confirmOrder ──────────────────────────────────────────────────────────

  describe('confirmOrder', () => {
    it('delegates to service and returns OrderActionResult', async () => {
      const orderId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult: OrderActionResult = { orderId, status: 'CONFIRMED' };
      mockSellerService.confirmOrder.mockResolvedValue(mockResult);

      const result = await controller.confirmOrder(orderId);

      expect(service.confirmOrder).toHaveBeenCalledWith(orderId);
      expect(result).toEqual(mockResult);
    });
  });

  // ── rejectOrder ───────────────────────────────────────────────────────────

  describe('rejectOrder', () => {
    it('delegates to service and returns OrderActionResult', async () => {
      const orderId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResult: OrderActionResult = { orderId, status: 'REJECTED' };
      mockSellerService.rejectOrder.mockResolvedValue(mockResult);

      const result = await controller.rejectOrder(orderId);

      expect(service.rejectOrder).toHaveBeenCalledWith(orderId);
      expect(result).toEqual(mockResult);
    });
  });
});
