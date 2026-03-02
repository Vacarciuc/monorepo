# Testing Guide - Auth Service

## Overview

This guide provides comprehensive instructions for testing the Auth Service manually and automatically.

## 🧪 Test Types

### 1. Unit Tests

Unit tests verify individual components in isolation.

**Run all unit tests:**
```bash
cd apps/auth-service
npm test
```

**Run specific test file:**
```bash
npm test auth.service.spec
```

**Run with coverage:**
```bash
npm run test:cov
```

**Coverage report location:** `apps/auth-service/coverage/`

### 2. Integration Tests

Integration tests verify the service works with external dependencies (database, etc.).

**Run integration tests:**
```bash
npm run test:e2e
```

### 3. Manual API Testing

#### Setup

1. Start PostgreSQL:
```bash
docker-compose up -d auth-db
```

2. Start Auth Service:
```bash
cd apps/auth-service
npm run start:dev
```

3. Service should be running on `http://localhost:3001`

#### Test Scenarios

##### ✅ Scenario 1: Register a Customer

**Request:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "password123",
    "role": "CUSTOMER"
  }'
```

**Expected Response (201 Created):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "CUSTOMER"
}
```

**Validation:**
- ✅ HTTP 201 status code
- ✅ Valid JWT token returned
- ✅ userId is a valid UUID
- ✅ role matches the requested role

---

##### ✅ Scenario 2: Register a Seller

**Request:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@test.com",
    "password": "password123",
    "role": "SELLER"
  }'
```

**Expected Response (201 Created):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "role": "SELLER"
}
```

---

##### ✅ Scenario 3: Login with Valid Credentials

**Request:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "password123"
  }'
```

**Expected Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "CUSTOMER"
}
```

**Validation:**
- ✅ HTTP 200 status code
- ✅ Valid JWT token returned
- ✅ Same userId as registration

---

##### ❌ Scenario 4: Duplicate Registration

**Request:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "password123",
    "role": "CUSTOMER"
  }'
```

**Expected Response (409 Conflict):**
```json
{
  "statusCode": 409,
  "message": "User with this email already exists"
}
```

---

##### ❌ Scenario 5: Login with Wrong Password

**Request:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "wrongpassword"
  }'
```

**Expected Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

##### ❌ Scenario 6: Invalid Email Format

**Request:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "notanemail",
    "password": "password123",
    "role": "CUSTOMER"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email"
  ],
  "error": "Bad Request"
}
```

---

##### ❌ Scenario 7: Password Too Short

**Request:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "12345",
    "role": "CUSTOMER"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": [
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

---

##### ❌ Scenario 8: Invalid Role

**Request:**
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123",
    "role": "ADMIN"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": [
    "role must be one of the following values: CUSTOMER, SELLER"
  ],
  "error": "Bad Request"
}
```

---

## 🔍 JWT Token Verification

### Decode JWT Token

Use [jwt.io](https://jwt.io) to decode and verify JWT tokens.

**Expected Payload Structure:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "CUSTOMER",
  "iat": 1709251200,
  "exp": 1709337600
}
```

### Using JWT in Protected Endpoints

```bash
curl -X GET http://localhost:3002/protected-endpoint \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📊 Database Verification

### Connect to PostgreSQL

```bash
docker exec -it auth-db psql -U postgres -d auth_db
```

### Verify User Creation

```sql
SELECT id, email, role, created_at FROM users;
```

### Check Password Hashing

```sql
SELECT email, password_hash FROM users WHERE email = 'customer@test.com';
```

Password should be hashed (not plaintext).

## 🧩 Postman Testing

### Import Collection

1. Open Postman
2. Import `postman_collection.json` from the project root
3. Requests are pre-configured with proper headers and body

### Environment Variables

The collection automatically sets these variables:
- `customer_token` - JWT token from customer login
- `customer_id` - Customer user ID
- `seller_token` - JWT token from seller login
- `seller_id` - Seller user ID

### Running Collection

Run all requests in sequence:
1. Register Customer
2. Register Seller
3. Login Customer (saves token)
4. Login Seller (saves token)
5. Test error scenarios

## 🐳 Docker Testing

### Test with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f auth-service

# Test endpoint
curl http://localhost:3001/auth/register -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"password123","role":"CUSTOMER"}'

# Stop services
docker-compose down
```

## 🎯 Test Checklist

Before marking Auth Service as complete:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual API tests successful
- [ ] JWT tokens are valid and verifiable
- [ ] Passwords are properly hashed
- [ ] Validation works correctly
- [ ] Error responses are appropriate
- [ ] Database connections work
- [ ] Docker container runs successfully
- [ ] Postman collection works
- [ ] CI/CD pipeline passes

## 🚨 Common Issues

### Issue: Cannot connect to database

**Solution:**
```bash
# Check if database is running
docker-compose ps

# Restart database
docker-compose restart auth-db

# Check logs
docker-compose logs auth-db
```

### Issue: JWT token invalid

**Solution:**
- Verify `JWT_SECRET` is consistent
- Check token hasn't expired
- Ensure Bearer token format: `Bearer <token>`

### Issue: Tests failing

**Solution:**
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Jest cache
npm test -- --clearCache
```

## 📈 Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test registration endpoint (10 concurrent, 100 total)
ab -n 100 -c 10 -p register.json -T application/json http://localhost:3001/auth/register
```

### Expected Performance

- Response time: < 200ms
- Throughput: > 50 req/sec
- Error rate: 0%

## 🎓 Next Steps

After Auth Service testing is complete:

1. Implement Order Service
2. Test integration between Auth and Order services
3. Implement Seller Service
4. Test end-to-end flow
5. Add performance monitoring
6. Deploy to staging environment

---

**Last Updated:** March 2026
**Service Version:** 0.0.1
**Test Coverage:** Unit tests implemented, E2E pending

