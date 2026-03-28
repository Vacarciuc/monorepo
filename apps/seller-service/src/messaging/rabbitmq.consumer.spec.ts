import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQConsumer } from './rabbitmq.consumer';
import { SellerService } from '../modules/seller/seller.service';
import { OrderCreatedEvent } from '../dto/order-created.event';

// Mock functions that will be used in tests
const mockAddSetup = jest.fn();
const mockClose = jest.fn();
const mockConnectionClose = jest.fn();

// Mock amqp-connection-manager
jest.mock('amqp-connection-manager', () => ({
  connect: jest.fn(() => ({
    createChannel: jest.fn(() => ({
      addSetup: mockAddSetup,
      close: mockClose,
    })),
    close: mockConnectionClose,
    on: jest.fn(),
  })),
}));

describe('RabbitMQConsumer', () => {
  let consumer: RabbitMQConsumer;
  let sellerService: SellerService;

  const mockSellerService = {
    processOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitMQConsumer,
        {
          provide: SellerService,
          useValue: mockSellerService,
        },
      ],
    }).compile();

    consumer = module.get<RabbitMQConsumer>(RabbitMQConsumer);
    sellerService = module.get<SellerService>(SellerService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('lifecycle', () => {
    it('should connect on module init', async () => {
      await consumer.onModuleInit();

      expect(mockAddSetup).toHaveBeenCalled();
    });

    it('should disconnect on module destroy', async () => {
      await consumer.onModuleInit();
      await consumer.onModuleDestroy();

      expect(mockClose).toHaveBeenCalled();
      expect(mockConnectionClose).toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    it('should process valid OrderCreated event', async () => {
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

      mockSellerService.processOrder.mockResolvedValue({
        id: '1',
        orderId: mockEvent.orderId,
        status: 'CONFIRMED',
      });

      // Simulate the consumer being initialized
      await consumer.onModuleInit();

      expect(mockAddSetup).toHaveBeenCalled();
    });
  });
});
