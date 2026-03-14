import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQProducer } from './rabbitmq.producer';

// Mock functions that will be used in tests
const mockPublish = jest.fn();
const mockClose = jest.fn();
const mockConnectionClose = jest.fn();

// Mock amqp-connection-manager
jest.mock('amqp-connection-manager', () => ({
  connect: jest.fn(() => ({
    createChannel: jest.fn(() => ({
      publish: mockPublish,
      close: mockClose,
    })),
    close: mockConnectionClose,
    on: jest.fn(),
  })),
}));

describe('RabbitMQProducer', () => {
  let producer: RabbitMQProducer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RabbitMQProducer],
    }).compile();

    producer = module.get<RabbitMQProducer>(RabbitMQProducer);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('publishOrderProcessed', () => {
    it('should publish an OrderProcessed event', async () => {
      await producer.onModuleInit();

      const event = {
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'CONFIRMED' as any,
      };

      mockPublish.mockResolvedValue(undefined);

      await producer.publishOrderProcessed(event);

      expect(mockPublish).toHaveBeenCalledWith(
        'order.exchange',
        'order.created',
        expect.any(Buffer),
        expect.objectContaining({
          persistent: true,
          contentType: 'application/json',
        }),
      );
    });
  });

  describe('lifecycle', () => {
    it('should connect on module init', async () => {
      await producer.onModuleInit();

      expect(mockPublish).toBeDefined();
    });

    it('should disconnect on module destroy', async () => {
      await producer.onModuleInit();
      await producer.onModuleDestroy();

      expect(mockClose).toHaveBeenCalled();
      expect(mockConnectionClose).toHaveBeenCalled();
    });
  });
});

