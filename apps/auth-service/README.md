# Auth Service
## Overview
The Authentication Service handles user registration, login, and JWT token generation for the marketplace platform. It supports two user roles: CUSTOMER and SELLER.
## Features
- User registration with role-based access
- Login with JWT token generation
- Password hashing with bcrypt
- PostgreSQL database integration
- Input validation with class-validator
- Comprehensive unit tests
## Technology Stack
- NestJS
- TypeORM
- PostgreSQL
- JWT (jsonwebtoken)
- bcrypt
- class-validator
## Installation
```bash
npm install
```
## Configuration
The `.env` file is already configured with:
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=auth_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```
## Running the Application
```bash
npm run start:dev
```
## API Endpoints
### POST /auth/register
### POST /auth/login
See full documentation in the main README.
