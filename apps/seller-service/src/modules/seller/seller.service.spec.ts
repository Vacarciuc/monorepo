import { Test, TestingModule } from '@nestjs/testing';
import { SellerService } from './seller.service';
import { Repository } from 'typeorm';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import {
  SellerOrder,
  OrderStatus,
} from '../../database/entities/seller-order.entity';
import { OrderCreatedEvent, OrderItem } from '../../dto/order-created.event';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RabbitMQConsumer } from '../../messaging/rabbitmq.consumer';
import { RabbitMQProducer } from '../../messaging/rabbitmq.producer';

// ─── helpers ────────────────────────────────────────────────────────────────

const makeEvent = (
  overrides: Partial<OrderCreatedEvent> = {},
): OrderCreatedEvent => ({
  orderId: '123e4567-e89b-12d3-a456-426614174000',
  sellerId: '223e4567-e89b-12d3-a456-426614174001',
  totalPrice: 100,
  items: [{ productId: 'prod-1', quantity: 2, price: 50 }] as OrderItem[],
  ...overrides,
});

const makeOrder = (overrides = {}) => ({
  id: 'order-uuid-1',
  orderId: '123e4567-e89b-12d3-a456-426614174000',
  status: OrderStatus.PENDING,
  orderItems: [{ productId: 'prod-1', quantity: 2, price: 50 }] as OrderItem[],
  processedAt: null,
  createdAt: new Date(),
  ...overrides,
});

const makeProduct = (overrides = {}) => ({
  id: 'prod-1',
  name: 'Green Tea',
  price: 50,
  quantity: 10,
  sellerId: 'seller-1',
  ...overrides,
});

// ─── DataSource / transaction mock ──────────────────────────────────────────

const buildDataSourceMock = (products: any[], saveOrderResult: any) => {
  // em.getRepository(X) returns a tiny mock with save / createQueryBuilder
  const productRepoMock = {
    createQueryBuilder: jest.fn().mockReturnValue({
      setLock: jest.fn().mockReturnThis(),
      whereInIds: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(products),
    }),
    save: jest.fn().mockImplementation(async (p) => p),
  };

  const orderRepoMock = {
    save: jest.fn().mockResolvedValue(saveOrderResult),
  };

  const emMock = {
    getRepository: jest.fn().mockImplementation((entity) => {
      // Distinguish by entity name
      return entity.name === 'Product' ? productRepoMock : orderRepoMock;
    }),
  };

  return {
    transaction: jest
      .fn()
      .mockImplementation(async (_isolation, cb) => cb(emMock)),
    productRepoMock,
    orderRepoMock,
    emMock,
  };
};

// ─── suite ───────────────────────────────────────────────────────────────────

describe('SellerService', () => {
  let service: SellerService;
  let repository: jest.Mocked<Repository<SellerOrder>>;
  let rabbitMQConsumer: jest.Mocked<RabbitMQConsumer>;
  let rabbitMQProducer: jest.Mocked<RabbitMQProducer>;
  let dataSourceMock: ReturnType<typeof buildDataSourceMock>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockRabbitMQConsumer = {
    acknowledgeOrder: jest.fn(),
    rejectOrder: jest.fn(),
  };

  const mockRabbitMQProducer = {
    publishOrderProcessed: jest.fn().mockResolvedValue(undefined),
  };

  /** Re-creates the module with a fresh DataSource mock each test */
  async function createModule(
    dsOverride?: Partial<ReturnType<typeof buildDataSourceMock>>,
  ) {
    const ds = dsOverride ?? buildDataSourceMock([], {});
    dataSourceMock = ds as ReturnType<typeof buildDataSourceMock>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerService,
        { provide: getRepositoryToken(SellerOrder), useValue: mockRepository },
        { provide: getDataSourceToken(), useValue: ds },
        { provide: RabbitMQConsumer, useValue: mockRabbitMQConsumer },
        { provide: RabbitMQProducer, useValue: mockRabbitMQProducer },
      ],
    }).compile();

    service = module.get<SellerService>(SellerService);
    repository = module.get(getRepositoryToken(SellerOrder));
    rabbitMQConsumer = module.get(RabbitMQConsumer);
    rabbitMQProducer = module.get(RabbitMQProducer);
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    await createModule();
  });

  // ── processOrder ──────────────────────────────────────────────────────────

  describe('processOrder', () => {
    it('saves order with PENDING status and orderItems snapshot', async () => {
      const event = makeEvent();
      const order = makeOrder();

      mockRepository.create.mockReturnValue(order);
      mockRepository.save.mockResolvedValue(order);

      const result = await service.processOrder(event);

      expect(mockRepository.create).toHaveBeenCalledWith({
        orderId: event.orderId,
        status: OrderStatus.PENDING,
        orderItems: event.items,
      });
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(OrderStatus.PENDING);
    });

    it('works with an empty items array', async () => {
      const event = makeEvent({ items: [] });
      const order = makeOrder({ orderItems: [] });

      mockRepository.create.mockReturnValue(order);
      mockRepository.save.mockResolvedValue(order);

      const result = await service.processOrder(event);
      expect(result.orderItems).toEqual([]);
    });
  });

  // ── findAllOrders ─────────────────────────────────────────────────────────

  describe('findAllOrders', () => {
    it('returns all orders sorted DESC', async () => {
      const orders = [makeOrder({ id: '1' }), makeOrder({ id: '2' })];
      mockRepository.find.mockResolvedValue(orders);

      const result = await service.findAllOrders();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(orders);
    });
  });

  // ── findOrderById ─────────────────────────────────────────────────────────

  describe('findOrderById', () => {
    it('returns order when found', async () => {
      const order = makeOrder();
      mockRepository.findOne.mockResolvedValue(order);

      const result = await service.findOrderById(order.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: order.id },
      });
      expect(result).toEqual(order);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOrderById('ghost')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── confirmOrder ──────────────────────────────────────────────────────────

  describe('confirmOrder', () => {
    it('decrements stock, confirms order, and acks the RabbitMQ message', async () => {
      const product = makeProduct({ quantity: 10 });
      const order = makeOrder();
      const confirmedOrder = {
        ...order,
        status: OrderStatus.CONFIRMED,
        processedAt: new Date(),
      };

      // buildDataSourceMock returns product with quantity=10
      await createModule(buildDataSourceMock([product], confirmedOrder));

      mockRepository.findOne.mockResolvedValue(order);
      mockRabbitMQConsumer.acknowledgeOrder.mockResolvedValue(undefined);

      const result = await service.confirmOrder(order.id);

      // transaction was called with SERIALIZABLE isolation
      expect(dataSourceMock.transaction).toHaveBeenCalledWith(
        'SERIALIZABLE',
        expect.any(Function),
      );

      // stock was saved with decremented quantity (10 - 2 = 8)
      expect(dataSourceMock.productRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 8 }),
      );

      // order saved as CONFIRMED inside transaction
      expect(dataSourceMock.orderRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.CONFIRMED }),
      );

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(mockRabbitMQConsumer.acknowledgeOrder).toHaveBeenCalledWith(
        order.orderId,
      );
      expect(mockRabbitMQProducer.publishOrderProcessed).toHaveBeenCalledWith({
        orderId: order.orderId,
        status: OrderStatus.CONFIRMED,
      });
    });

    it('throws BadRequestException if order is already CONFIRMED', async () => {
      const order = makeOrder({ status: OrderStatus.CONFIRMED });
      mockRepository.findOne.mockResolvedValue(order);

      await expect(service.confirmOrder(order.id)).rejects.toThrow(
        BadRequestException,
      );
      expect(dataSourceMock.transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException if order is already REJECTED', async () => {
      const order = makeOrder({ status: OrderStatus.REJECTED });
      mockRepository.findOne.mockResolvedValue(order);

      await expect(service.confirmOrder(order.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when a product is missing from DB', async () => {
      // DataSource returns empty product list → product not found
      await createModule(buildDataSourceMock([], {}));
      mockRepository.findOne.mockResolvedValue(makeOrder());

      await expect(service.confirmOrder('order-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRabbitMQConsumer.acknowledgeOrder).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when stock is insufficient', async () => {
      // Only 1 in stock, order needs 2
      const lowStockProduct = makeProduct({ quantity: 1 });
      await createModule(buildDataSourceMock([lowStockProduct], {}));
      mockRepository.findOne.mockResolvedValue(makeOrder());

      await expect(service.confirmOrder('order-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRabbitMQConsumer.acknowledgeOrder).not.toHaveBeenCalled();
    });

    it('handles multiple items and decrements each product', async () => {
      const productA = makeProduct({ id: 'p-a', name: 'Tea', quantity: 10 });
      const productB = makeProduct({ id: 'p-b', name: 'Honey', quantity: 5 });
      const order = makeOrder({
        orderItems: [
          { productId: 'p-a', quantity: 3, price: 10 },
          { productId: 'p-b', quantity: 2, price: 15 },
        ],
      });
      const confirmedOrder = {
        ...order,
        status: OrderStatus.CONFIRMED,
        processedAt: new Date(),
      };

      await createModule(
        buildDataSourceMock([productA, productB], confirmedOrder),
      );
      mockRepository.findOne.mockResolvedValue(order);
      mockRabbitMQConsumer.acknowledgeOrder.mockResolvedValue(undefined);

      await service.confirmOrder(order.id);

      const saveCalls = dataSourceMock.productRepoMock.save.mock.calls;
      expect(saveCalls).toHaveLength(2);
      expect(saveCalls[0][0]).toMatchObject({ id: 'p-a', quantity: 7 }); // 10 - 3
      expect(saveCalls[1][0]).toMatchObject({ id: 'p-b', quantity: 3 }); // 5 - 2
    });
  });

  // ── rejectOrder ───────────────────────────────────────────────────────────

  describe('rejectOrder', () => {
    it('rejects order and NACKs the RabbitMQ message', async () => {
      const order = makeOrder();
      const rejectedOrder = {
        ...order,
        status: OrderStatus.REJECTED,
        processedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(order);
      mockRepository.save.mockResolvedValue(rejectedOrder);
      mockRabbitMQConsumer.rejectOrder.mockResolvedValue(undefined);

      const result = await service.rejectOrder(order.id);

      expect(result.status).toBe(OrderStatus.REJECTED);
      expect(result.processedAt).toBeDefined();
      expect(mockRabbitMQConsumer.rejectOrder).toHaveBeenCalledWith(
        order.orderId,
      );
      expect(mockRabbitMQProducer.publishOrderProcessed).toHaveBeenCalledWith({
        orderId: order.orderId,
        status: OrderStatus.REJECTED,
      });
      // No transaction needed for reject
      expect(dataSourceMock.transaction).not.toHaveBeenCalled();
    });

    it('throws BadRequestException if order is already CONFIRMED', async () => {
      mockRepository.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.CONFIRMED }),
      );
      await expect(service.rejectOrder('order-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException if order is already REJECTED', async () => {
      mockRepository.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.REJECTED }),
      );
      await expect(service.rejectOrder('order-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
