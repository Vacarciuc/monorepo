import { Test, TestingModule } from '@nestjs/testing';
import { SellerController } from './seller.controller';
import { SellerService } from './seller.service';
import { SellerOrder, OrderStatus } from '../../database/entities/seller-order.entity';

describe('SellerController', () => {
  let controller: SellerController;
  let service: SellerService;

  const mockSellerService = {
    findAllOrders: jest.fn(),
    findOrderById: jest.fn(),
    confirmOrder: jest.fn(),
    rejectOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerController],
      providers: [
        {
          provide: SellerService,
          useValue: mockSellerService,
        },
      ],
    }).compile();

    controller = module.get<SellerController>(SellerController);
    service = module.get<SellerService>(SellerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllOrders', () => {
    it('should return an array of orders', async () => {
      const mockOrders: SellerOrder[] = [
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

      mockSellerService.findAllOrders.mockResolvedValue(mockOrders);

      const result = await controller.getAllOrders();

      expect(service.findAllOrders).toHaveBeenCalled();
      expect(result).toEqual(mockOrders);
    });
  });

  describe('getOrderById', () => {
    it('should return a specific order', async () => {
      const mockOrder: SellerOrder = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        orderId: 'order-1',
        status: OrderStatus.CONFIRMED,
        processedAt: new Date(),
        createdAt: new Date(),
      };

      mockSellerService.findOrderById.mockResolvedValue(mockOrder);

      const result = await controller.getOrderById(mockOrder.id);

      expect(service.findOrderById).toHaveBeenCalledWith(mockOrder.id);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('confirmOrder', () => {
    it('should confirm an order', async () => {
      const orderId = '123e4567-e89b-12d3-a456-426614174000';
      const mockOrder: SellerOrder = {
        id: orderId,
        orderId: 'order-1',
        status: OrderStatus.CONFIRMED,
        processedAt: new Date(),
        createdAt: new Date(),
      };

      mockSellerService.confirmOrder.mockResolvedValue(mockOrder);

      const result = await controller.confirmOrder(orderId);

      expect(service.confirmOrder).toHaveBeenCalledWith(orderId);
      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });
  });

  describe('rejectOrder', () => {
    it('should reject an order', async () => {
      const orderId = '123e4567-e89b-12d3-a456-426614174000';
      const mockOrder: SellerOrder = {
        id: orderId,
        orderId: 'order-1',
        status: OrderStatus.REJECTED,
        processedAt: new Date(),
        createdAt: new Date(),
      };

      mockSellerService.rejectOrder.mockResolvedValue(mockOrder);

      const result = await controller.rejectOrder(orderId);

      expect(service.rejectOrder).toHaveBeenCalledWith(orderId);
      expect(result.status).toBe(OrderStatus.REJECTED);
    });
  });
});

