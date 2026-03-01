# 🏗️ Auth Service Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MARKETPLACE PLATFORM                            │
│                         (Monorepo)                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Postman / cURL / Frontend                                         │
│       │                                                             │
│       │ HTTP Requests                                              │
│       ▼                                                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │           AUTH SERVICE (Port 3001)                        │    │
│  │                                                           │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  AuthController                                 │    │    │
│  │  │  • POST /auth/register                         │    │    │
│  │  │  • POST /auth/login                            │    │    │
│  │  └──────────────┬──────────────────────────────────┘    │    │
│  │                 │                                        │    │
│  │                 ▼                                        │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  AuthService                                    │    │    │
│  │  │  • register()                                   │    │    │
│  │  │  • login()                                      │    │    │
│  │  │  • validateUser()                               │    │    │
│  │  │  • generateToken()                              │    │    │
│  │  └──────────────┬──────────────────────────────────┘    │    │
│  │                 │                                        │    │
│  │                 ▼                                        │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │  TypeORM Repository                             │    │    │
│  │  │  • User Entity                                  │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    SHARED LIBRARIES                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  @monorepo/common                                                  │
│  ├── DTOs (RegisterDto, LoginDto, AuthResponseDto)                │
│  ├── Enums (UserRole, OrderStatus)                                │
│  ├── Guards (JwtAuthGuard, RolesGuard)                            │
│  └── Decorators (@CurrentUser, @Roles)                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────┐  ┌────────────────────┐                   │
│  │  PostgreSQL        │  │  PostgreSQL        │                   │
│  │  auth_db           │  │  order_db          │                   │
│  │  (Port 5432)       │  │  (Port 5433)       │                   │
│  │                    │  │                    │                   │
│  │  Tables:           │  │  Tables:           │                   │
│  │  • users           │  │  • products        │                   │
│  │                    │  │  • orders          │                   │
│  └────────────────────┘  │  • cart_items      │                   │
│                          │  • order_items     │                   │
│  ┌────────────────────┐  └────────────────────┘                   │
│  │  PostgreSQL        │                                            │
│  │  seller_db         │                                            │
│  │  (Port 5434)       │                                            │
│  │                    │                                            │
│  │  Tables:           │                                            │
│  │  • seller_orders   │                                            │
│  └────────────────────┘                                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    MESSAGE BROKER                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  RabbitMQ (Ports 5672, 15672)                         │        │
│  │                                                        │        │
│  │  Exchanges:                                            │        │
│  │  • order.exchange                                      │        │
│  │                                                        │        │
│  │  Queues:                                               │        │
│  │  • seller.{sellerId}.queue                             │        │
│  │  • order.status.queue                                  │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌──────────┐                                    ┌──────────────┐
│  Client  │                                    │ Auth Service │
└────┬─────┘                                    └──────┬───────┘
     │                                                 │
     │  POST /auth/register                           │
     │  { email, password, role }                     │
     ├────────────────────────────────────────────────►
     │                                                 │
     │                                        ┌────────▼────────┐
     │                                        │ Validate Input  │
     │                                        └────────┬────────┘
     │                                                 │
     │                                        ┌────────▼────────┐
     │                                        │  Hash Password  │
     │                                        └────────┬────────┘
     │                                                 │
     │                                        ┌────────▼────────┐
     │                                        │   Save to DB    │
     │                                        └────────┬────────┘
     │                                                 │
     │                                        ┌────────▼────────┐
     │                                        │ Generate JWT    │
     │                                        └────────┬────────┘
     │                                                 │
     │  { accessToken, userId, role }                 │
     │◄────────────────────────────────────────────────┤
     │                                                 │
     │  Store JWT                                     │
     │                                                 │
     │  POST /auth/login                              │
     │  { email, password }                           │
     ├────────────────────────────────────────────────►
     │                                                 │
     │                                        ┌────────▼────────┐
     │                                        │  Find User      │
     │                                        └────────┬────────┘
     │                                                 │
     │                                        ┌────────▼────────┐
     │                                        │ Verify Password │
     │                                        └────────┬────────┘
     │                                                 │
     │                                        ┌────────▼────────┐
     │                                        │ Generate JWT    │
     │                                        └────────┬────────┘
     │                                                 │
     │  { accessToken, userId, role }                 │
     │◄────────────────────────────────────────────────┤
     │                                                 │
     │  Subsequent requests with JWT                  │
     │  Authorization: Bearer <token>                 │
     ├────────────────────────────────────────────────►
     │                                                 │
     │                                        ┌────────▼────────┐
     │                                        │  Validate JWT   │
     │                                        └────────┬────────┘
     │                                                 │
     │                                        ┌────────▼────────┐
     │                                        │  Check Roles    │
     │                                        └────────┬────────┘
     │                                                 │
     │  Response                                      │
     │◄────────────────────────────────────────────────┤
     │                                                 │
```

---

## Database Schema

```
┌─────────────────────────────────────────┐
│              auth_db                    │
├─────────────────────────────────────────┤
│                                         │
│  users                                  │
│  ┌────────────────────────────────┐    │
│  │ id              UUID PK        │    │
│  │ email           VARCHAR UNIQUE │    │
│  │ password_hash   VARCHAR        │    │
│  │ role            ENUM           │    │
│  │ created_at      TIMESTAMP      │    │
│  └────────────────────────────────┘    │
│                                         │
│  Indexes:                               │
│  • PRIMARY KEY (id)                     │
│  • UNIQUE (email)                       │
│                                         │
└─────────────────────────────────────────┘
```

---

## JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "role": "CUSTOMER",
    "iat": 1709251200,
    "exp": 1709337600
  },
  "signature": "..."
}
```

---

## Project Structure Tree

```
monorepo/
│
├── 📄 Configuration Files
│   ├── docker-compose.yml          # Orchestration
│   ├── .gitignore                  # Git configuration
│   └── start-auth-service.sh       # Quick start
│
├── 📚 Documentation
│   ├── README.md                   # Main overview
│   ├── AUTH_SERVICE_IMPLEMENTATION.md
│   ├── AUTH_SERVICE_COMPLETE.md
│   ├── AUTH_SERVICE_FINAL_SUMMARY.md
│   ├── TESTING_GUIDE.md
│   ├── QUICK_REFERENCE.md
│   └── postman_collection.json
│
├── 🔧 CI/CD
│   └── .github/
│       └── workflows/
│           └── auth-service.yml
│
├── 📦 Shared Libraries
│   └── libs/
│       └── common/
│           ├── package.json
│           ├── tsconfig.json
│           └── src/
│               ├── dto/            # Shared DTOs
│               ├── enums/          # Shared enums
│               ├── guards/         # Auth guards
│               └── decorators/     # Custom decorators
│
└── 🚀 Microservices
    └── apps/
        ├── auth-service/           ✅ COMPLETE
        │   ├── src/
        │   │   ├── main.ts
        │   │   ├── app.module.ts
        │   │   ├── entities/
        │   │   ├── dto/
        │   │   └── auth/
        │   ├── Dockerfile
        │   ├── .env
        │   └── package.json
        │
        ├── order-service/          ⏳ TODO
        ├── seller-service/         ⏳ TODO
        └── frontend/               ⏳ TODO
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                             │
│  React + Vite + TypeScript                             │
└─────────────────────────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  MICROSERVICES                          │
│  NestJS + TypeScript + Express                         │
│  • Auth Service                                         │
│  • Order Service                                        │
│  • Seller Service                                       │
└─────────────────────────────────────────────────────────┘
         │                              │
         │                              │
         ▼                              ▼
┌──────────────────┐         ┌──────────────────┐
│   PostgreSQL     │         │    RabbitMQ      │
│   • auth_db      │         │  Message Broker  │
│   • order_db     │         │                  │
│   • seller_db    │         └──────────────────┘
└──────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE                        │
│  Docker + Docker Compose + GitHub Actions              │
└─────────────────────────────────────────────────────────┘
```

---

**Created:** March 1, 2026  
**Status:** Architecture Complete ✅  
**Next:** Implement Order Service

