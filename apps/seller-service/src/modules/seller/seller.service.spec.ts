import { Test, TestingModule } from '@nestjs/testing';
import { SellerService } from './seller.service';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Product } from '../../database/entities/product.entity';
import { OrderCreatedEvent, OrderItem } from '../../dto/order-created.event';
import { NotFoundException } from '@nestjs/common';
import { RabbitMQConsumer, PendingOrder } from '../../messaging/rabbitmq.consumer';
import { RabbitMQProducer } from '../../messaging/rabbitmq.producer';
import { OrderStatus } from '../../database/entities/seller-order.entity';

// ─── helpers ────────────────────────────────────────────────────────────────

const makeEvent = (overrides: Partial<OrderCreatedEvent> = {}): OrderCreatedEvent => ({
  orderId: '123e4567-e89b-12d3-a456-426614174000',
  sellerId: '223e4567-e89b-12d3-a456-426614174001',
  totalPrice: 100,
  items: [{ productId: 'prod-1', quantity: 2, price: 50 }] as OrderItem[],
  ...overrides,
});

const makePendingOrder = (overrides: Partial<OrderCreatedEvent> = {}): PendingOrder => ({
  event: makeEvent(overrides),
  receivedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const makeProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 'prod-1',
  name: 'Green Tea',
  price: 50,
  quantity: 10,
  sellerId: 'seller-1',
  ...overrides,
});

// ─── DataSource / transaction mock ──────────────────────────────────────────

const buildDataSourceMock = (products: ReturnType<typeof makeProduct>[]) => {
  const productRepoMock = {
    createQueryBuilder: jest.fn().mockReturnValue({
      setLock: jest.fn().mockReturnThis(),
      whereInIds: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(products),
    }),
    save: jest.fn().mockImplementation(async (p: unknown) => p),
  };

  const emMock = {
    getRepository: jest.fn().mockReturnValue(productRepoMock),
  };

  return {
    transaction: jest
      .fn()
      .mockImplementation(async (_isolation: string, cb: (em: typeof emMock) => Promise<void>) => cb(emMock)),
    productRepoMock,
    emMock,
  };
};

// ─── suite ───────────────────────────────────────────────────────────────────

describe('SellerService', () => {
  let service: SellerService;
  let dataSourceMock: ReturnType<typeof buildDataSourceMock>;

  const mockProductRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockRabbitMQConsumer = {
    getPendingOrders: jest.fn(),
    getPendingOrder: jest.fn(),
    acknowledgeOrder: jest.fn(),
    rejectOrder: jest.fn(),
  };

  const mockRabbitMQProducer = {
    publishOrderProcessed: jest.fn().mockResolvedValue(undefined),
  };

  async function createModule(dsOverride?: ReturnType<typeof buildDataSourceMock>) {
    const ds = dsOverride ?? buildDataSourceMock([]);
    dataSourceMock = ds;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerService,
        { provide: getRepositoryToken(Product), useValue: mockProductRepository },
        { provide: getDataSourceToken(), useValue: ds },
        { provide: RabbitMQConsumer, useValue: mockRabbitMQConsumer },
        { provide: RabbitMQProducer, useValue: mockRabbitMQProducer },
      ],
    }).compile();

    service = module.get<SellerService>(SellerService);
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    await createModule();
  });

  // ── getPendingOrders ──────────────────────────────────────────────────────

  describe('getPendingOrders', () => {
    it('delegates to rabbitMQConsumer.getPendingOrders()', () => {
      const pending = [makePendingOrder()];
      mockRabbitMQConsumer.getPendingOrders.mockReturnValue(pending);

      const result = service.getPendingOrders();

      expect(mockRabbitMQConsumer.getPendingOrders).toHaveBeenCalledTimes(1);
      expect(result).toEqual(pending);
    });

    it('returns empty array when queue is empty', () => {
      mockRabbitMQConsumer.getPendingOrders.mockReturnValue([]);
      expect(service.getPendingOrders()).toEqual([]);
    });
  });

  // ── getOrderById ──────────────────────────────────────────────────────────

  describe('getOrderById', () => {
    it('returns the PendingOrder when found in queue', () => {
      const pending = makePendingOrder();
      mockRabbitMQConsumer.getPendingOrder.mockReturnValue(pending);

      const result = service.getOrderById('123e4567-e89b-12d3-a456-426614174000');

      expect(mockRabbitMQConsumer.getPendingOrder).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(result).toEqual(pending);
    });

    it('throws NotFoundException when orderId is not in pending queue', () => {
      mockRabbitMQConsumer.getPendingOrder.mockReturnValue(undefined);

      expect(() => service.getOrderById('ghost-id')).toThrow(NotFoundException);
    });
  });

  // ── confirmOrder ──────────────────────────────────────────────────────────

  describe('confirmOrder', () => {
    it('decrements stock, ACKs message and publishes CONFIRMED', async () => {
      const product = makeProduct({ quantity: 10 });
      await createModule(buildDataSourceMock([product]));

      mockRabbitMQConsumer.getPendingOrder.mockReturnValue(makePendingOrder());
      mockRabbitMQConsumer.acknowledgeOrder.mockImplementation(() => {});

      const result = await service.confirmOrder('123e4567-e89b-12d3-a456-426614174000');

      // transaction called with SERIALIZABLE isolation
      expect(dataSourceMock.transaction).toHaveBeenCalledWith(
        'SERIALIZABLE',
        expect.any(Function),
      );

      // product stock decremented (10 - 2 = 8)
      expect(dataSourceMock.productRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 8 }),
      );

      // ACK called with the orderId
      expect(mockRabbitMQConsumer.acknowledgeOrder).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      // CONFIRMED published to RabbitMQ
      expect(mockRabbitMQProducer.publishOrderProcessed).toHaveBeenCalledWith({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        status: OrderStatus.CONFIRMED,
      });

      expect(result).toEqual({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'CONFIRMED',
      });
    });

    it('throws NotFoundException when orderId is not in pending queue', async () => {
      mockRabbitMQConsumer.getPendingOrder.mockReturnValue(undefined);

      await expect(service.confirmOrder('ghost-id')).rejects.toThrow(NotFoundException);
      expect(dataSourceMock.transaction).not.toHaveBeenCalled();
      expect(mockRabbitMQConsumer.acknowledgeOrder).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when product is not found in DB', async () => {
      await createModule(buildDataSourceMock([])); // no products
      mockRabbitMQConsumer.getPendingOrder.mockReturnValue(makePendingOrder());

      await expect(
        service.confirmOrder('123e4567-e89b-12d3-a456-426614174000'),
      ).rejects.toThrow(NotFoundException);

      expect(mockRabbitMQConsumer.acknowledgeOrder).not.toHaveBeenCalled();
      expect(mockRabbitMQProducer.publishOrderProcessed).not.toHaveBeenCalled();
    });

    it('throws Error when stock is insufficient', async () => {
      const lowStock = makeProduct({ quantity: 1 }); // only 1, order needs 2
      await createModule(buildDataSourceMock([lowStock]));
      mockRabbitMQConsumer.getPendingOrder.mockReturnValue(makePendingOrder());

      await expect(
        service.confirmOrder('123e4567-e89b-12d3-a456-426614174000'),
      ).rejects.toThrow();

      expect(mockRabbitMQConsumer.acknowledgeOrder).not.toHaveBeenCalled();
      expect(mockRabbitMQProducer.publishOrderProcessed).not.toHaveBeenCalled();
    });

    it('handles multiple items and decrements each product', async () => {
      const productA = makeProduct({ id: 'p-a', name: 'Tea', quantity: 10 });
      const productB = makeProduct({ id: 'p-b', name: 'Honey', quantity: 5 });
      const event = makeEvent({
        items: [
          { productId: 'p-a', quantity: 3, price: 10 },
          { productId: 'p-b', quantity: 2, price: 15 },
        ] as OrderItem[],
      });

      await createModule(buildDataSourceMock([productA, productB]));
      mockRabbitMQConsumer.getPendingOrder.mockReturnValue({ event, receivedAt: new Date() });
      mockRabbitMQConsumer.acknowledgeOrder.mockImplementation(() => {});

      await service.confirmOrder(event.orderId);

      const saveCalls = dataSourceMock.productRepoMock.save.mock.calls;
      expect(saveCalls).toHaveLength(2);
      expect(saveCalls[0][0]).toMatchObject({ id: 'p-a', quantity: 7 }); // 10 - 3
      expect(saveCalls[1][0]).toMatchObject({ id: 'p-b', quantity: 3 }); // 5 - 2
    });
  });

  // ── rejectOrder ───────────────────────────────────────────────────────────

  describe('rejectOrder', () => {
    it('NACKs message and publishes REJECTED without a DB transaction', async () => {
      mockRabbitMQConsumer.getPendingOrder.mockReturnValue(makePendingOrder());
      mockRabbitMQConsumer.rejectOrder.mockImplementation(() => {});

      const result = await service.rejectOrder('123e4567-e89b-12d3-a456-426614174000');

      expect(mockRabbitMQConsumer.rejectOrder).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
      );
      expect(mockRabbitMQProducer.publishOrderProcessed).toHaveBeenCalledWith({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        status: OrderStatus.REJECTED,
      });
      expect(result).toEqual({
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'REJECTED',
      });
      // no stock transaction for reject
      expect(dataSourceMock.transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when orderId is not in pending queue', async () => {
      mockRabbitMQConsumer.getPendingOrder.mockReturnValue(undefined);

      await expect(service.rejectOrder('ghost-id')).rejects.toThrow(NotFoundException);
      expect(mockRabbitMQConsumer.rejectOrder).not.toHaveBeenCalled();
      expect(mockRabbitMQProducer.publishOrderProcessed).not.toHaveBeenCalled();
    });
  });
});
