# Seller Service - Installation Instructions

## Prerequisites

Make sure you have the following installed:
- Node.js 18+
- pnpm (or npm/yarn)
- PostgreSQL
- RabbitMQ

## Installation

1. Install pnpm globally (if not already installed):
```bash
npm install -g pnpm
```

2. Install dependencies from monorepo root:
```bash
cd /var/projects/webstorm/monorepo
pnpm install
```

3. Or install dependencies only for seller-service:
```bash
cd /var/projects/webstorm/monorepo/apps/seller-service
pnpm install
```

## Setup Database

Create a PostgreSQL database:
```bash
createdb seller_service
```

Or using psql:
```sql
CREATE DATABASE seller_service;
```

## Setup Environment Variables

Copy the example env file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3002
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=seller_service

RABBITMQ_URL=amqp://localhost:5672
```

## Run the Service

Development mode:
```bash
pnpm start:dev
```

Production mode:
```bash
pnpm build
pnpm start:prod
```

## Run Tests

Unit tests:
```bash
pnpm test
```

E2E tests (requires database):
```bash
pnpm test:e2e
```

Coverage:
```bash
pnpm test:cov
```

## Verify Installation

1. Check if server is running:
```bash
curl http://localhost:3002
```

2. Check Swagger documentation:
```bash
open http://localhost:3002/api/docs
```

## Troubleshooting

### Dependencies not installed
If you see module errors, make sure to run `pnpm install` from the monorepo root.

### Database connection error
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database exists: `psql -l | grep seller_service`
- Verify credentials in `.env` file

### RabbitMQ connection error
- Verify RabbitMQ is running: `sudo systemctl status rabbitmq-server`
- Check RabbitMQ management UI: http://localhost:15672
- Verify RABBITMQ_URL in `.env` file

## API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:3002/api/docs
- API Base URL: http://localhost:3002

## Quick Test

Create a seller:
```bash
curl -X POST http://localhost:3002/sellers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "companyName": "Acme Inc."
  }'
```

Get all sellers:
```bash
curl http://localhost:3002/sellers
```

