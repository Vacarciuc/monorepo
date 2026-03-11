#!/bin/bash

# Seller Service - Quick Start Script
# This script helps you get started quickly with the Seller Service

set -e

echo "🚀 Seller Service - Quick Start"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check Prerequisites
echo -e "${BLUE}[1/7] Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✓ Node.js installed: $(node --version)${NC}"

if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠ pnpm is not installed${NC}"
    echo "Installing pnpm globally..."
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm installed: $(pnpm --version)${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠ Docker is not installed${NC}"
    echo "You'll need to install PostgreSQL and RabbitMQ manually"
else
    echo -e "${GREEN}✓ Docker installed: $(docker --version)${NC}"
fi

# Step 2: Install Dependencies
echo ""
echo -e "${BLUE}[2/7] Installing dependencies...${NC}"
cd "$(dirname "$0")"
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Setup Environment
echo ""
echo -e "${BLUE}[3/7] Setting up environment...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}📝 Please edit .env file with your configuration${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Step 4: Start Database & RabbitMQ
echo ""
echo -e "${BLUE}[4/7] Starting database and RabbitMQ...${NC}"
if command -v docker &> /dev/null; then
    if docker-compose up -d 2>/dev/null; then
        echo -e "${GREEN}✓ PostgreSQL and RabbitMQ started${NC}"
        echo -e "  PostgreSQL: localhost:5433"
        echo -e "  RabbitMQ: localhost:5673"
        echo -e "  RabbitMQ Management: http://localhost:15673"
    else
        echo -e "${YELLOW}⚠ Could not start Docker containers${NC}"
        echo -e "Please start PostgreSQL and RabbitMQ manually"
    fi
else
    echo -e "${YELLOW}⚠ Docker not available${NC}"
    echo -e "Please ensure PostgreSQL and RabbitMQ are running"
fi

# Step 5: Wait for services
echo ""
echo -e "${BLUE}[5/7] Waiting for services to be ready...${NC}"
echo -e "Waiting 5 seconds for database..."
sleep 5
echo -e "${GREEN}✓ Services should be ready${NC}"

# Step 6: Build the project
echo ""
echo -e "${BLUE}[6/7] Building the project...${NC}"
if pnpm build 2>/dev/null; then
    echo -e "${GREEN}✓ Project built successfully${NC}"
else
    echo -e "${YELLOW}⚠ Build had some issues, but continuing...${NC}"
fi

# Step 7: Start the service
echo ""
echo -e "${BLUE}[7/7] Starting Seller Service...${NC}"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${YELLOW}To start the service in development mode:${NC}"
echo -e "  ${BLUE}pnpm start:dev${NC}"
echo ""
echo -e "${YELLOW}Once started, access:${NC}"
echo -e "  API: ${BLUE}http://localhost:3002${NC}"
echo -e "  Swagger: ${BLUE}http://localhost:3002/api/docs${NC}"
echo ""
echo -e "${YELLOW}To run tests:${NC}"
echo -e "  Unit tests: ${BLUE}pnpm test${NC}"
echo -e "  E2E tests: ${BLUE}pnpm test:e2e${NC}"
echo -e "  Coverage: ${BLUE}pnpm test:cov${NC}"
echo ""
echo -e "${YELLOW}To test the API manually:${NC}"
echo -e "  ${BLUE}./test-api.sh${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"

