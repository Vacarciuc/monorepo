# Seller Service - Architecture Documentation

## Overview

Seller Service follows **Clean Architecture** principles with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         Controllers                          │
│                    (HTTP Entry Points)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Use Cases                            │
│                    (Business Logic)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│      Repositories         │  │   RabbitMQ Publisher     │
│   (Data Access Layer)     │  │  (Event Publishing)      │
└──────────────────────────┘  └──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│    TypeORM Entities      │
│      (Database)          │
└──────────────────────────┘
```

## Layers

### 1. Infrastructure Layer (`infrastructure/`)

**Controllers** - HTTP endpoints that handle requests/responses
- `seller.controller.ts` - Seller CRUD operations
- `product.controller.ts` - Product management
- `cart.controller.ts` - Cart operations

**Config** - Configuration files
- `typeorm.config.ts` - Database configuration
- `swagger.config.ts` - API documentation setup

### 2. Application Layer (`application/`)

**Use Cases** - Business logic and orchestration
- `seller.usecase.ts` - Seller business rules
- `product.usecase.ts` - Product operations + event publishing
- `cart.usecase.ts` - Cart management + event publishing

Each use case:
- Validates business rules
- Coordinates between repositories
- Publishes events to RabbitMQ
- Returns DTOs

### 3. Domain Layer (`domain/`)

**Entities** - Database models with TypeORM decorators
- `seller.entity.ts` - Seller model
- `product.entity.ts` - Product model with FK to Seller
- `cart.entity.ts` - Cart model with JSONB items

**Repositories** - Data access abstraction
- `seller.repository.ts` - Seller CRUD operations
- `product.repository.ts` - Product CRUD operations
- `cart.repository.ts` - Cart operations with auto-create

### 4. Messaging Layer (`messaging/`)

**RabbitMQ** - Event-driven communication
- `publisher.ts` - Event publishing with automatic exchange setup
- `event.types.ts` - Type definitions for events
- `rabbitmq.module.ts` - NestJS module configuration

### 5. DTOs (`dto/`)

Data Transfer Objects for validation and documentation
- `seller.dto.ts` - Seller request/response DTOs
- `product.dto.ts` - Product request/response DTOs
- `cart.dto.ts` - Cart request/response DTOs

All DTOs include:
- Validation decorators (`class-validator`)
- Swagger decorators (`@nestjs/swagger`)
- Type safety

## Data Flow

### Creating a Product

```
1. POST /products
   ↓
2. ProductController.createProduct()
   ↓
3. ProductUseCases.createProduct()
   ├─→ Validate seller exists (SellerRepository)
   ├─→ Create product (ProductRepository)
   ├─→ Get/Create cart (CartRepository)
   └─→ Publish event (RabbitMQPublisher)
   ↓
4. Return ProductResponseDto
```

### RabbitMQ Event Context

Every event includes context for traceability:

```typescript
{
  "event": "product.created",
  "context": {
    "sellerId": "uuid",    // Identifies the seller
    "cartId": "uuid"       // Identifies the cart
  },
  "data": { ... },
  "timestamp": "2026-03-10T10:00:00Z"
}
```

This allows consumers to:
- Track which seller triggered the event
- Associate events with specific carts
- Maintain audit trails

## Database Schema

```sql
-- Sellers table
CREATE TABLE sellers (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Carts table
CREATE TABLE carts (
    id UUID PRIMARY KEY,
    seller_id UUID UNIQUE NOT NULL,
    items JSONB DEFAULT '[]'
);

-- Cart items structure (JSONB)
[
    {
        "productId": "uuid",
        "quantity": 2
    }
]
```

## Design Patterns

### Repository Pattern
Abstracts data access logic from business logic.

```typescript
// Repository handles all database operations
class ProductRepository {
    create(product: Partial<Product>): Promise<Product>
    findById(id: string): Promise<Product | null>
    // ...
}

// Use case uses repository without knowing implementation
class ProductUseCases {
    constructor(private repository: ProductRepository) {}
    
    async createProduct(dto: CreateProductDto) {
        return this.repository.create(dto);
    }
}
```

### Dependency Injection
NestJS automatically resolves and injects dependencies.

```typescript
@Injectable()
class ProductUseCases {
    constructor(
        private productRepo: ProductRepository,
        private sellerRepo: SellerRepository,
        private publisher: RabbitMQPublisher
    ) {}
}
```

### Event-Driven Architecture
Loosely coupled services communicate via events.

```typescript
// Service publishes event
await publisher.publish({
    event: 'product.created',
    context: { sellerId, cartId },
    data: { productId, name, price }
});

// Other services can subscribe to this event
```

## Error Handling

### HTTP Exceptions
Controllers automatically convert exceptions to HTTP responses:

```typescript
// NotFoundException → 404
throw new NotFoundException('Seller not found');

// ConflictException → 409
throw new ConflictException('Email already exists');

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
- Use cases (`.usecase.spec.ts`)
- Repositories (when needed)

### Integration Tests (E2E)
Test complete flows with real database:
- API endpoints
- Database operations
- Full request/response cycle

### Test Structure
```typescript
describe('ProductUseCases', () => {
    let useCases: ProductUseCases;
    let mockRepository: jest.Mocked<ProductRepository>;
    
    beforeEach(async () => {
        // Setup mocks and module
    });
    
    it('should create product and publish event', async () => {
        // Arrange
        // Act
        // Assert
    });
});
```

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
- Indexed foreign keys (automatic)
- JSONB for flexible cart structure
- CASCADE delete for data integrity

### RabbitMQ
- Persistent messages
- Topic exchange for routing
- Connection pooling via amqp-connection-manager
- Automatic reconnection

### API
- Validation at entry point
- Early returns on errors
- Efficient queries (no N+1)
- Swagger for documentation caching

## Future Enhancements

### Possible Improvements
1. **Caching** - Redis for frequently accessed data
2. **Pagination** - For large lists of sellers/products
3. **Search** - ElasticSearch for full-text search
4. **Authentication** - JWT tokens, role-based access
5. **Rate Limiting** - Prevent abuse
6. **Monitoring** - Prometheus + Grafana
7. **Logging** - Structured logging with Winston
8. **Migrations** - TypeORM migrations for production

### Scaling
- Horizontal scaling (multiple instances)
- Database read replicas
- RabbitMQ clustering
- Load balancer (Nginx/HAProxy)

## References

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [RabbitMQ Best Practices](https://www.rabbitmq.com/best-practices.html)

