# Product Management Feature

## Overview

The Seller Service now includes comprehensive product management functionality with image upload capabilities.

## Features Implemented

### 1. Product Entity
- **Location**: `src/database/entities/product.entity.ts`
- **Fields**:
  - `id` (UUID) - Primary key
  - `name` (VARCHAR) - Product name
  - `description` (TEXT) - Product description
  - `price` (DECIMAL) - Product price
  - `imagePath` (VARCHAR) - Path to uploaded image
  - `sellerId` (UUID) - Reference to seller
  - `createdAt` (TIMESTAMP) - Creation timestamp
  - `updatedAt` (TIMESTAMP) - Last update timestamp

### 2. Product Module
- **Location**: `src/modules/products/`
- **Components**:
  - `product.controller.ts` - REST API endpoints
  - `product.service.ts` - Business logic
  - `product.module.ts` - Module configuration

### 3. DTOs (Data Transfer Objects)
- **Location**: `src/dto/`
- **Files**:
  - `create-product.dto.ts` - For creating products
  - `update-product.dto.ts` - For updating products

### 4. REST API Endpoints

#### Create Product
```
POST /products
Content-Type: multipart/form-data

Fields:
- name (required): string
- description (optional): string
- price (required): number
- sellerId (optional): UUID (defaults to default seller)
- image (optional): file (jpg, jpeg, png, gif, webp, max 5MB)

Response: 201 Created
```

#### Get All Products
```
GET /products

Response: 200 OK
Returns: Array of products (sorted by newest first)
```

#### Get Product by ID
```
GET /products/:id

Response: 200 OK | 404 Not Found
```

#### Update Product
```
PUT /products/:id
Content-Type: multipart/form-data

Fields (all optional):
- name: string
- description: string
- price: number
- image: file

Response: 200 OK | 404 Not Found
Note: Old image is automatically deleted when uploading new one
```

#### Delete Product
```
DELETE /products/:id

Response: 204 No Content | 404 Not Found
Note: Product image is automatically deleted from disk
```

## Image Upload System

### Configuration
- **Upload Directory**: `uploads/products/`
- **Allowed Formats**: jpg, jpeg, png, gif, webp
- **Max File Size**: 10MB
- **Naming Convention**: `{uuid}.{ext}` (UUID v4 format)

### Storage
- Images are stored physically on disk
- Path is saved in database: `/uploads/products/{uuid}.{ext}`
- Images are served as static files at: `http://localhost:3003/uploads/products/{uuid}.{ext}`

### Automatic Cleanup
- When a product is deleted, its image is removed from disk
- When a product image is updated, the old image is removed

## Static File Serving

Images are served through NestJS static file serving:
```typescript
app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads',
});
```

Access images at: `http://localhost:3003/uploads/products/{filename}`

## Testing

### Unit Tests
- **Location**: `src/modules/products/*.spec.ts`
- **Coverage**:
  - Product service tests
  - Product controller tests
  - All CRUD operations
  - Error handling

### E2E Tests
- **Location**: `test/product.e2e.spec.ts`
- **Scenarios**:
  - Create product with image
  - Create product without image
  - Get all products
  - Get product by ID
  - Update product
  - Delete product
  - Error cases (invalid UUID, not found, invalid data)

### Running Tests
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Specific test file
npm test -- product.service.spec
```

## Database Migration

To create the products table, ensure your database connection is configured and run:

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

Or let TypeORM handle it automatically with `synchronize: true` in development.

## Environment Variables

No additional environment variables needed beyond existing database configuration.

## Swagger Documentation

All endpoints are fully documented with Swagger:
- Visit: `http://localhost:3003/api/docs`
- Interactive API testing available
- Complete request/response schemas
- Example values provided

## Example Usage

### Create Product with cURL
```bash
curl -X POST http://localhost:3003/products \
  -F "name=Laptop Dell XPS 13" \
  -F "description=High-performance laptop" \
  -F "price=1299.99" \
  -F "image=@/path/to/image.png"
```

### Get All Products
```bash
curl http://localhost:3003/products
```

### Update Product
```bash
curl -X PUT http://localhost:3003/products/{id} \
  -F "name=Updated Product Name" \
  -F "price=1499.99"
```

### Delete Product
```bash
curl -X DELETE http://localhost:3003/products/{id}
```

## Architecture Notes

### Multi-Seller Support
The current implementation uses a default seller ID (`00000000-0000-0000-0000-000000000001`), but the architecture is ready for multi-seller support:
- `sellerId` field exists in product entity
- Can be overridden during product creation
- Future versions can add seller authentication and filtering

### Image Management Strategy
- Physical storage on disk for performance
- No database bloat from binary data
- Easy backup with volume mounts
- CDN integration ready

### Validation
- DTO validation using class-validator
- File type validation in multer config
- UUID validation in routes
- Price validation (min: 0)

## Git Ignore

The uploads folder is configured to ignore uploaded files but keep the directory structure:
```
uploads/products/*
!uploads/products/.gitkeep
```

## Docker Volume

When running in Docker, mount the uploads directory:
```yaml
volumes:
  - ./uploads:/app/uploads
```

## Future Enhancements

Potential improvements for future versions:
- Multiple image upload per product
- Image resizing/optimization
- Cloud storage integration (S3, etc.)
- Product categories
- Inventory management
- Product search and filtering
- Product reviews

