#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Auth Service Quick Start Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Starting PostgreSQL database...${NC}"
docker-compose up -d auth-db

echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 5

echo -e "${YELLOW}📥 Installing dependencies...${NC}"
cd apps/auth-service
npm install

echo -e "${YELLOW}🚀 Starting Auth Service...${NC}"
echo ""
echo -e "${GREEN}✅ Auth Service will start on http://localhost:3001${NC}"
echo -e "${GREEN}📚 API Documentation:${NC}"
echo -e "   - POST http://localhost:3001/auth/register"
echo -e "   - POST http://localhost:3001/auth/login"
echo ""
echo -e "${GREEN}🔧 PostgreSQL Admin:${NC}"
echo -e "   Host: localhost"
echo -e "   Port: 5432"
echo -e "   Database: auth_db"
echo -e "   User: postgres"
echo -e "   Password: postgres"
echo ""

npm run start:dev

