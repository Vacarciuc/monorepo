# Seller Service - Architecture Documentation

## Overview

Seller Service procesează comenzi primite prin RabbitMQ folosind o **singură coadă** și **manual acknowledgment**.

```
┌─────────────────────────────────────────────────────────────┐
│                      Order Service                           │
│                 (Publică order.created)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   RabbitMQ Exchange                          │
│                   (order.exchange)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (routing key: order.created)
┌─────────────────────────────────────────────────────────────┐
│                      seller.queue                            │
│                    (single queue)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  RabbitMQ Consumer                           │
│                  (Seller Service)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│    Process Order         │  │    Send ACK              │
│    Save to Database      │  │    (RabbitMQ deletes)    │
└──────────────────────────┘  └──────────────────────────┘
```

## Architecture Layers

## Architecture Layers

### 1. Messaging Layer (`messaging/`)

**RabbitMQ Consumer** - Consumes order events
- `rabbitmq.consumer.ts` - Connects, binds queue, consumes messages, handles ACK/NACK
- `rabbitmq.producer.ts` - Publisher (not currently used)

**Key Features**:
- Single queue: `seller.queue`
- Routing key: `order.created`
- Manual acknowledgment (noAck: false)
- Automatic message deletion after ACK

### 2. Business Logic (`modules/seller/`)

**Seller Service** - Order processing
- `seller.service.ts` - Order processing logic (PENDING → CONFIRMED)
- `seller.controller.ts` - REST API endpoints
- `seller.module.ts` - NestJS module configuration

### 3. Data Layer (`database/`)

**Entities** - TypeORM models
- `seller-order.entity.ts` - Order entity with status tracking

### 4. Configuration (`config/`)

**RabbitMQ Config**
- `rabbitmq.config.ts` - Connection URL, exchange, queue, routing key

### 5. DTOs (`dto/`)

**Event Structures**
- `order-created.event.ts` - Incoming event from Order Service
- `order-processed.event.ts` - Outgoing event (not used currently)

## Data Flow

### Order Processing Flow

```
1. Order Service publishes event
   ↓ (routing key: order.created)
2. RabbitMQ routes to seller.queue
   ↓
3. RabbitMQConsumer receives message
   ↓
4. Parse & validate event (class-validator)
   ↓
5. SellerService.processOrder()
   ├─→ Save with PENDING status
   ├─→ Simulate processing (1-3 sec delay)
   └─→ Update to CONFIRMED status
   ↓
6. Send ACK to RabbitMQ
   ↓
7. RabbitMQ deletes message ✅
```

### Error Handling Flow

```
Invalid Data:
  Parse → Validate FAILS
    ↓
  channel.nack(msg, false, false)  # Don't requeue
    ↓
  Message deleted from queue

Transient Error:
  Process FAILS (DB error, etc)
    ↓
  channel.nack(msg, false, true)  # Requeue
    ↓
  Message returned to queue for retry
```

## Database Schema

```sql
-- Seller Orders table
CREATE TABLE seller_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED')),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_seller_orders_order_id ON seller_orders(order_id);
CREATE INDEX idx_seller_orders_status ON seller_orders(status);
CREATE INDEX idx_seller_orders_created_at ON seller_orders(created_at DESC);
```

**Status Flow**:
```
PENDING → CONFIRMED (auto after 1-3 seconds)
PENDING → REJECTED (manual via API)
```

## Design Patterns

### Consumer Pattern
Message consumer with manual acknowledgment for reliability.

```typescript
// Consumer handles message lifecycle
class RabbitMQConsumer {
    async handleMessage(msg: ConsumeMessage, channel: ConfirmChannel) {
        try {
            const event = await this.validate(msg);
            await this.sellerService.processOrder(event);
            channel.ack(msg); // Success → delete message
        } catch (error) {
            if (this.isValidationError(error)) {
                channel.nack(msg, false, false); // Invalid → delete
            } else {
                channel.nack(msg, false, true); // Transient → requeue
            }
        }
    }
}
```

### Repository Pattern
Abstracts data access logic from business logic.

```typescript
// Repository handles all database operations
@InjectRepository(SellerOrder)
private readonly repository: Repository<SellerOrder>;

// Service uses repository without knowing implementation
async processOrder(event: OrderCreatedEvent) {
    const order = this.repository.create({ orderId: event.orderId });
    await this.repository.save(order);
}
```

### Dependency Injection
NestJS automatically resolves and injects dependencies.

```typescript
@Injectable()
class SellerService {
    constructor(
        @InjectRepository(SellerOrder)
        private repository: Repository<SellerOrder>,
    ) {}
}
```

## Error Handling

### RabbitMQ Message Errors
Consumer handles different error types appropriately:

```typescript
// Invalid data → Don't requeue
if (validationErrors.length > 0) {
    channel.nack(msg, false, false); // Message deleted
    return;
}

// Transient error → Requeue for retry
catch (error) {
    channel.nack(msg, false, true); // Message requeued
}
```

### HTTP Exceptions
Controllers automatically convert exceptions to HTTP responses:

```typescript
// NotFoundException → 404
throw new NotFoundException('Order not found');

// BadRequestException → 400
throw new BadRequestException('Invalid data');
```

### Validation
Global validation pipe validates all DTOs:

```typescript
app.useGlobalPipes(
    new ValidationPipe({
        whitelist: true,           // Strip unknown properties
        forbidNonWhitelisted: true, // Throw error on unknown props
        transform: true,            // Auto-transform types
    })
);
```

## Testing Strategy

### Unit Tests
Test business logic in isolation with mocks:
- Services (`.service.spec.ts`)
- Controllers (`.controller.spec.ts`)
- Messaging (`.consumer.spec.ts`, `.producer.spec.ts`)

### Integration Tests (E2E)
Test complete flows with real dependencies:
- Order processing flow
- Database operations
- RabbitMQ message handling

### Test Structure
```typescript
describe('SellerService', () => {
    let service: SellerService;
    let mockRepository: jest.Mocked<Repository<SellerOrder>>;
    
    beforeEach(async () => {
        // Setup mocks and module
    });
    
    it('should process order and update status', async () => {
        // Arrange
        const event = { orderId: '123', ... };
        
        // Act
        const result = await service.processOrder(event);
        
        // Assert
        expect(result.status).toBe(OrderStatus.CONFIRMED);
    });
});
```

**Current Status**: ✅ 20/20 tests passing

## Configuration

### Environment Variables
All configuration via `.env`:
- Database connection
- RabbitMQ URL
- Server port
- Node environment

### TypeORM Configuration
Auto-sync in development, migrations in production:

```typescript
{
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
}
```

## Performance Considerations

### Database
- UUID primary keys for distributed systems
- Indexed columns for faster queries
- Efficient status tracking

### RabbitMQ
- Persistent messages (survive broker restart)
- Durable queues and exchanges
- Manual acknowledgment for reliability
- Connection pooling via amqp-connection-manager
- Automatic reconnection on failures

### API
- Validation at entry point
- Early returns on errors
- Efficient queries
- Swagger for documentation

## Scripts

### Development
```bash
./dev.sh              # Start in development mode with hot reload
./test.sh             # Run all tests
./test.sh --unit      # Run unit tests only
./test.sh --e2e       # Run e2e tests only
./test.sh --cov       # Run with coverage
./test.sh --watch     # Run in watch mode
./rabbitmq-status.sh  # Check RabbitMQ status and queues
```

## Future Enhancements

### Possible Improvements
1. **Dead Letter Queue** - Handle failed messages after N retries
2. **Metrics** - Prometheus for monitoring processing times
3. **Rate Limiting** - Prevent queue flooding
4. **Batch Processing** - Process multiple orders at once
5. **Caching** - Redis for frequently accessed data
6. **Authentication** - Secure REST endpoints
7. **Logging** - Structured logging with correlation IDs

### Scaling
- Horizontal scaling (multiple consumer instances)
- Database read replicas
- RabbitMQ clustering
- Load balancer

## References

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [RabbitMQ Best Practices](https://www.rabbitmq.com/best-practices.html)

