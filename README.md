# Event-Driven Marketplace Platform

A distributed microservices-based marketplace application using NestJS, RabbitMQ, PostgreSQL, and React.

## 🏗️ Architecture

This is a **monorepo** containing multiple microservices that communicate asynchronously through RabbitMQ:

- **Auth Service** (Port 3001) - User authentication and JWT token management
- **Order Service** (Port 3002) - Product catalog, shopping cart, and order management
- **Seller Service** (Port 3003) - Order processing and confirmation
- **Frontend** (Port 5173) - React-based user interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- RabbitMQ 3.12+

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up auth-service

# Stop all services
docker-compose down
```

### Manual Setup

```bash
# Install dependencies for auth service
cd apps/auth-service
npm install

# Start the service
npm run start:dev
```

## 📦 Services Overview

### Auth Service ✅ IMPLEMENTED

**Responsibilities:**
- User registration (Customer/Seller)
- User authentication with JWT
- Role-based access control

**Endpoints:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

**Database:** `auth_db`

**Status:** ✅ Fully implemented and tested

[See detailed documentation](./AUTH_SERVICE_IMPLEMENTATION.md)

### Order Service 🔄 TO BE IMPLEMENTED

**Responsibilities:**
- Product CRUD operations
- Shopping cart management
- Order creation and validation
- Stock verification
- Event publishing (OrderCreated)
- Order status updates

**Endpoints:**
- `GET /products` - List all products
- `POST /cart` - Add item to cart
- `GET /cart` - View cart
- `POST /orders` - Create order
- `GET /orders/:id` - Get order details

**Database:** `order_db`

### Seller Service 🔄 TO BE IMPLEMENTED

**Responsibilities:**
- Consume OrderCreated events from RabbitMQ
- Order confirmation/rejection
- Publish OrderProcessed events

**Endpoints:**
- `POST /seller/orders/:id/confirm` - Confirm order
- `POST /seller/orders/:id/reject` - Reject order

**Database:** `seller_db`

### Frontend 🔄 TO BE IMPLEMENTED

**Features:**
- User authentication
- Product browsing
- Shopping cart
- Order placement
- Order status tracking

**Technology:** React + Vite

## 🔐 Authentication Flow

1. User registers via `POST /auth/register`
2. User receives JWT token with `userId` and `role`
3. JWT token is included in subsequent requests as Bearer token
4. Services validate token using `JwtAuthGuard`
5. Role-based access is enforced using `RolesGuard`

## 📊 Database Schema

### Auth DB

**users**
- id (UUID)
- email (unique)
- password_hash
- role (CUSTOMER | SELLER)
- created_at

### Order DB (Planned)

**products**
- id, name, price, stock, seller_id

**cart_items**
- id, user_id, product_id, quantity

**orders**
- id, user_id, seller_id, total_price, status

**order_items**
- id, order_id, product_id, quantity, price

### Seller DB (Planned)

**seller_orders**
- id, order_id, status, processed_at

## 🔄 Event-Driven Flow

```
1. Customer adds products to cart
2. Customer places order (POST /orders)
3. Order Service:
   - Validates stock
   - Creates order (status: PENDING)
   - Publishes OrderCreatedEvent to RabbitMQ
4. Seller Service:
   - Consumes OrderCreatedEvent
   - Seller confirms/rejects order
   - Publishes OrderProcessedEvent
5. Order Service:
   - Consumes OrderProcessedEvent
   - Updates order status (CONFIRMED/REJECTED)
6. Customer checks order status
```

## 🧪 Testing

### Unit Tests

```bash
cd apps/auth-service
npm test
```

### Integration Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

## 🐳 Docker Configuration

Each service has its own Dockerfile with multi-stage builds for optimization.

**Services in docker-compose.yml:**
- auth-db (PostgreSQL on port 5432)
- order-db (PostgreSQL on port 5433)
- seller-db (PostgreSQL on port 5434)
- rabbitmq (Ports 5672, 15672 for management UI)
- auth-service (Port 3001)
- order-service (Port 3002) - To be added
- seller-service (Port 3003) - To be added
- frontend (Port 5173) - To be added

## 🔧 Environment Variables

### Auth Service

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=auth_db
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

## 📡 API Testing

A Postman collection is provided in `postman_collection.json`:

1. Import the collection into Postman
2. Start the auth service
3. Run the requests in order:
   - Register Customer
   - Register Seller
   - Login Customer (saves token to environment)
   - Login Seller (saves token to environment)

## 🚀 CI/CD

GitHub Actions workflows are configured for:

- **Continuous Integration:**
  - Linting
  - Unit tests
  - Integration tests
  - Build verification

- **Continuous Deployment:**
  - Docker image building
  - Pushing to Docker Hub
  - Deployment notifications

[See workflow](./.github/workflows/auth-service.yml)

## 📚 Shared Libraries

### @monorepo/common

Located in `libs/common`, this shared library contains:

- **DTOs:** RegisterDto, LoginDto, AuthResponseDto
- **Enums:** UserRole, OrderStatus
- **Guards:** JwtAuthGuard, RolesGuard
- **Decorators:** @CurrentUser(), @Roles()

## 🛠️ Development

### Project Structure

```
monorepo/
├── apps/
│   ├── auth-service/       ✅ Complete
│   ├── order-service/      🔄 Planned
│   ├── seller-service/     🔄 Planned
│   └── frontend/           🔄 Planned
├── libs/
│   └── common/             ✅ Complete
├── docker-compose.yml      ✅ Complete
└── .github/
    └── workflows/          ✅ Complete
```

### Adding New Services

1. Create service directory under `apps/`
2. Install dependencies
3. Configure database connection
4. Add to docker-compose.yml
5. Create CI/CD workflow
6. Update this README

## 🎯 Next Steps

- [ ] Implement Order Service
- [ ] Implement Seller Service
- [ ] Implement Frontend
- [ ] Add E2E tests
- [ ] Add API Gateway
- [ ] Add monitoring (Prometheus/Grafana)
- [ ] Add logging (ELK Stack)
- [ ] Deploy to cloud (AWS/Azure/GCP)

## 📖 Documentation

- [Auth Service Implementation](./AUTH_SERVICE_IMPLEMENTATION.md)
- [Task Specification](./tz.txt)
- [Postman Collection](./postman_collection.json)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📄 License

UNLICENSED - Private project

## 🎓 Project Status

This project is part of a distributed systems assignment demonstrating:
- Microservices architecture
- Event-driven communication
- Asynchronous processing
- JWT authentication
- Docker containerization
- CI/CD pipelines
- Monorepo management

**Current Progress:** 25% (Auth Service complete)
