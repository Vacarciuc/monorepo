import { Test, TestingModule } from '@nestjs/testing';
import { SellerService } from './seller.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SellerOrder, OrderStatus } from '../../database/entities/seller-order.entity';
import { OrderCreatedEvent } from '../../dto/order-created.event';
import { NotFoundException } from '@nestjs/common';
import { RabbitMQConsumer } from '../../messaging/rabbitmq.consumer';

describe('SellerService', () => {
  let service: SellerService;
  let repository: Repository<SellerOrder>;
  let rabbitMQConsumer: RabbitMQConsumer;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerService,
        {
          provide: getRepositoryToken(SellerOrder),
          useValue: mockRepository,
        },
        {
          provide: RabbitMQConsumer,
          useValue: mockRabbitMQConsumer,
        },
      ],
    }).compile();

    service = module.get<SellerService>(SellerService);
    repository = module.get<Repository<SellerOrder>>(
      getRepositoryToken(SellerOrder),
    );
    rabbitMQConsumer = module.get<RabbitMQConsumer>(RabbitMQConsumer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processOrder', () => {
    it('should process an order and save it with PENDING status', async () => {
      const mockEvent: OrderCreatedEvent = {
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        sellerId: '123e4567-e89b-12d3-a456-426614174001',
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174002',
            quantity: 2,
            price: 50,
          },
        ],
        totalPrice: 100,
      };

      const mockOrder = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        orderId: mockEvent.orderId,
        status: OrderStatus.PENDING,
        processedAt: null,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockOrder);
      mockRepository.save.mockResolvedValueOnce(mockOrder);

      const result = await service.processOrder(mockEvent);

      expect(mockRepository.create).toHaveBeenCalledWith({
        orderId: mockEvent.orderId,
        status: OrderStatus.PENDING,
      });
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(OrderStatus.PENDING);
      expect(result.processedAt).toBeNull();
    });

    it('should save order with PENDING status only', async () => {
      const mockEvent: OrderCreatedEvent = {
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        sellerId: '123e4567-e89b-12d3-a456-426614174001',
        items: [],
        totalPrice: 100,
      };

      const mockOrder = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        orderId: mockEvent.orderId,
        status: OrderStatus.PENDING,
        processedAt: null,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockOrder);
      mockRepository.save.mockResolvedValue(mockOrder);

      await service.processOrder(mockEvent);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedOrder = mockRepository.save.mock.calls[0][0];
      expect(savedOrder.status).toBe(OrderStatus.PENDING);
    });
  });

  describe('findAllOrders', () => {
    it('should return all orders sorted by createdAt DESC', async () => {
      const mockOrders = [
        {
          id: '1',
          orderId: 'order-1',
          status: OrderStatus.CONFIRMED,
          processedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: '2',
          orderId: 'order-2',
          status: OrderStatus.PENDING,
          processedAt: null,
          createdAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockOrders);

      const result = await service.findAllOrders();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockOrders);
    });
  });

  describe('findOrderById', () => {
    it('should return an order when found', async () => {
      const mockOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        orderId: 'order-1',
        status: OrderStatus.CONFIRMED,
        processedAt: new Date(),
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOrderById(mockOrder.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOrderById('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmOrder', () => {
    it('should confirm an order and acknowledge RabbitMQ message', async () => {
      const mockOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        orderId: 'order-1',
        status: OrderStatus.PENDING,
        processedAt: null,
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockOrder);
      mockRepository.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
        processedAt: new Date(),
      });
      mockRabbitMQConsumer.acknowledgeOrder.mockResolvedValue(undefined);

      const result = await service.confirmOrder(mockOrder.id);

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(result.processedAt).toBeDefined();
      expect(mockRabbitMQConsumer.acknowledgeOrder).toHaveBeenCalledWith(mockOrder.orderId);
    });
  });

  describe('rejectOrder', () => {
    it('should reject an order and NACK RabbitMQ message', async () => {
      const mockOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        orderId: 'order-1',
        status: OrderStatus.PENDING,
        processedAt: null,
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockOrder);
      mockRepository.save.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REJECTED,
        processedAt: new Date(),
      });
      mockRabbitMQConsumer.rejectOrder.mockResolvedValue(undefined);

      const result = await service.rejectOrder(mockOrder.id);

      expect(result.status).toBe(OrderStatus.REJECTED);
      expect(result.processedAt).toBeDefined();
      expect(mockRabbitMQConsumer.rejectOrder).toHaveBeenCalledWith(mockOrder.orderId);
    });
  });
});

