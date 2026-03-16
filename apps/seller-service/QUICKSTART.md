# Quick Start Guide - Product Management

## Prerequisites
- Node.js installed
- PostgreSQL running
- RabbitMQ running (for order processing)

## Installation

```bash
cd /var/projects/webstorm/monorepo/apps/seller-service
npm install
```

## Database Setup

The product table will be created automatically by TypeORM when you start the service (if synchronize is enabled).

Or manually create:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_path VARCHAR,
  seller_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Start the Service

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

## Test the API

### Using Swagger UI
Open in browser: `http://localhost:3003/api/docs`

### Using cURL

#### 1. Create a Product with Image
```bash
curl -X POST http://localhost:3003/products \
  -F "name=Dell XPS 13" \
  -F "description=Premium laptop" \
  -F "price=1299.99" \
  -F "image=@/path/to/laptop.png"
```

#### 2. Create a Product without Image
```bash
curl -X POST http://localhost:3003/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wireless Mouse",
    "description": "Ergonomic design",
    "price": 29.99
  }'
```

#### 3. Get All Products
```bash
curl http://localhost:3003/products
```

#### 4. Get Product by ID
```bash
curl http://localhost:3003/products/{product-id}
```

#### 5. Update Product
```bash
curl -X PUT http://localhost:3003/products/{product-id} \
  -F "name=Dell XPS 15" \
  -F "price=1599.99" \
  -F "image=@/path/to/new-image.png"
```

#### 6. Delete Product
```bash
curl -X DELETE http://localhost:3003/products/{product-id}
```

## Run Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm test -- --testPathPattern="spec.ts"
```

### E2E Tests Only
```bash
npm run test:e2e
```

### Specific Test File
```bash
npm test -- product.service.spec
```

### With Coverage
```bash
npm run test:cov
```

## Access Product Images

After uploading, images are accessible at:
```
http://localhost:3003/uploads/products/{uuid}.{ext}
```

Example:
```
http://localhost:3003/uploads/products/550e8400-e29b-41d4-a716-446655440000.png
```

**Note:** Image filenames are automatically generated using UUID v4 format.

## Environment Variables

Create `.env` file:
```env
PORT=3003

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=seller_db

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=order.exchange
RABBITMQ_QUEUE=seller.queue
```

## Docker

### Build Image
```bash
docker build -t seller-service .
```

### Run Container
```bash
docker run -p 3003:3003 \
  -v $(pwd)/uploads:/app/uploads \
  -e DB_HOST=host.docker.internal \
  -e RABBITMQ_URL=amqp://host.docker.internal:5672 \
  seller-service
```

## Troubleshooting

### Port Already in Use
Change PORT in `.env` or:
```bash
PORT=3004 npm run start:dev
```

### Database Connection Failed
- Check PostgreSQL is running
- Verify credentials in `.env`
- Check database exists

### Upload Directory Permission
```bash
chmod 755 uploads
chmod 755 uploads/products
```

### Image Not Found
- Ensure uploads directory exists
- Check file was saved: `ls -la uploads/products/`
- Verify path in database matches file on disk

## API Response Examples

### Create Product Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Dell XPS 13",
  "description": "Premium laptop",
  "price": "1299.99",
  "imagePath": "/uploads/products/1710501234567-laptop.png",
  "sellerId": "00000000-0000-0000-0000-000000000001",
  "createdAt": "2026-03-15T10:30:00.000Z",
  "updatedAt": "2026-03-15T10:30:00.000Z"
}
```

### List Products Response
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Dell XPS 13",
    "description": "Premium laptop",
    "price": "1299.99",
    "imagePath": "/uploads/products/1710501234567-laptop.png",
    "sellerId": "00000000-0000-0000-0000-000000000001",
    "createdAt": "2026-03-15T10:30:00.000Z",
    "updatedAt": "2026-03-15T10:30:00.000Z"
  }
]
```

## Support

For issues or questions:
1. Check logs: Service logs all operations
2. Review Swagger docs: `http://localhost:3003/api/docs`
3. Check implementation docs: `PRODUCT_MANAGEMENT.md`
4. Review technical spec: `requirments.txt`

## Next Steps

1. ✅ Service is ready to use
2. Test all endpoints via Swagger
3. Integrate with frontend
4. Set up production database
5. Configure Docker deployment
6. Set up CI/CD pipeline

