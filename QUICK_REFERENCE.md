# 🚀 Auth Service - Quick Reference Card

## Start Service (Fastest Way)

```bash
./start-auth-service.sh
```

## Manual Start

```bash
docker-compose up -d auth-db
cd apps/auth-service && npm install && npm run start:dev
```

## Test Endpoints

### Register Customer
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"pass123","role":"CUSTOMER"}'
```

### Register Seller
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"seller@test.com","password":"pass123","role":"SELLER"}'
```

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"pass123"}'
```

## Database Access

```bash
docker exec -it auth-db psql -U postgres -d auth_db
```

```sql
SELECT * FROM users;
```

## Run Tests

```bash
cd apps/auth-service
npm test              # All tests
npm run test:cov      # With coverage
npm run test:watch    # Watch mode
```

## Docker Commands

```bash
docker-compose up -d              # Start all
docker-compose up auth-service    # Start auth only
docker-compose logs -f auth-service  # View logs
docker-compose down               # Stop all
```

## Service Info

- **URL:** http://localhost:3001
- **Database:** auth_db (port 5432)
- **RabbitMQ UI:** http://localhost:15672 (admin/admin)

## File Locations

- **Source:** `/apps/auth-service/src`
- **Tests:** `/apps/auth-service/src/**/*.spec.ts`
- **Config:** `/apps/auth-service/.env`
- **Shared:** `/libs/common/src`

## Common Issues

**Can't connect to DB:**
```bash
docker-compose restart auth-db
```

**Dependencies missing:**
```bash
cd apps/auth-service && npm install
```

**Clear cache:**
```bash
npm test -- --clearCache
```

## Response Examples

**Success (201/200):**
```json
{
  "accessToken": "eyJhbGci...",
  "userId": "uuid",
  "role": "CUSTOMER"
}
```

**Error (400):**
```json
{
  "statusCode": 400,
  "message": ["validation error"],
  "error": "Bad Request"
}
```

**Error (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

**Error (409):**
```json
{
  "statusCode": 409,
  "message": "User with this email already exists"
}
```

## Environment Variables

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=auth_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

## Documentation

- 📖 [Main README](./README.md)
- 📋 [Implementation Details](./AUTH_SERVICE_IMPLEMENTATION.md)
- ✅ [Completion Status](./AUTH_SERVICE_COMPLETE.md)
- 🧪 [Testing Guide](./TESTING_GUIDE.md)
- 📮 [Postman Collection](./postman_collection.json)

## Next Steps

1. ✅ Auth Service - **COMPLETE**
2. ⏳ Order Service - TO DO
3. ⏳ Seller Service - TO DO
4. ⏳ Frontend - TO DO

---

**Save this file for quick reference!**

