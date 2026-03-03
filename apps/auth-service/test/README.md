# Auth Service Testing Guide

This document describes the testing structure and how to run tests for the Auth Service.

## Test Structure

```
test/
├── unit/                          # Unit tests (isolated component testing)
│   ├── auth.service.spec.ts      # Auth service logic tests
│   └── auth.controller.spec.ts   # Auth controller tests
├── integration/                   # Integration tests (with database)
│   ├── auth.integration.spec.ts  # Auth endpoints with real DB
│   └── jest-integration.json     # Integration test config
└── e2e/                          # End-to-end tests (full application)
    ├── auth.e2e.spec.ts          # Complete authentication flows
    └── jest-e2e.json             # E2E test config
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit Tests Only
Unit tests are fast and don't require external dependencies (database, etc.).
```bash
npm test:unit
```

### Integration Tests Only
Integration tests require a PostgreSQL database. Make sure you have a test database configured.
```bash
npm run test:integration
```

### E2E Tests Only
End-to-end tests run against the full application with all dependencies.
```bash
npm run test:e2e
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:cov
```

## Test Database Setup

For integration and e2e tests, you need a test database. The tests use the configuration from `.env.test`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=auth_db_test
```

To create the test database:
```bash
createdb auth_db_test
```

## Test Types Explained

### Unit Tests
- Test individual functions and methods in isolation
- Use mocks for all dependencies
- Fast execution
- No external dependencies required

### Integration Tests
- Test endpoints with real database connections
- Verify database operations work correctly
- Test validation and error handling
- Require test database

### E2E Tests
- Test complete user flows from start to finish
- Test the full application stack
- Verify business logic works end-to-end
- Most comprehensive but slowest

## Best Practices

1. **Run unit tests frequently** during development
2. **Run integration tests** before committing code
3. **Run all tests** before pushing to repository
4. **Keep tests isolated** - each test should clean up after itself
5. **Use descriptive test names** that explain what is being tested

## CI/CD Integration

Tests should be run in the following order in CI/CD:
1. Unit tests (fast feedback)
2. Integration tests (database interaction)
3. E2E tests (full flow validation)

If unit tests fail, skip integration and e2e tests to save time.

