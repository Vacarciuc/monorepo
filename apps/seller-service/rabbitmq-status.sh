#!/bin/bash

# RabbitMQ health check and queue monitoring
# Checks if RabbitMQ is running and displays queue status

set -e

echo "🐰 RabbitMQ Status Check"
echo "========================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if RabbitMQ container is running
echo "1️⃣  Checking RabbitMQ container..."
if docker ps --format '{{.Names}}' | grep -q rabbitmq; then
    echo -e "${GREEN}✅ RabbitMQ is running${NC}"
else
    echo -e "${RED}❌ RabbitMQ is not running${NC}"
    echo "Start with: docker-compose up -d rabbitmq"
    exit 1
fi
echo ""

# Check queue status
echo "2️⃣  Queue Status:"
echo "─────────────────────────────────────────"
docker exec rabbitmq rabbitmqctl list_queues name messages_ready messages_unacknowledged consumers 2>/dev/null | grep -E "seller\.queue|Listing" || echo "Queue not created yet"
echo ""

# Check bindings
echo "3️⃣  Queue Bindings:"
echo "─────────────────────────────────────────"
docker exec rabbitmq rabbitmqctl list_bindings 2>/dev/null | grep seller.queue || echo "No bindings yet"
echo ""

# Check consumers
echo "4️⃣  Active Consumers:"
echo "─────────────────────────────────────────"
CONSUMERS=$(docker exec rabbitmq rabbitmqctl list_consumers 2>/dev/null | grep seller.queue || echo "")
if [ -z "$CONSUMERS" ]; then
    echo -e "${YELLOW}⚠️  No consumers connected${NC}"
    echo "Start seller-service with: ./dev.sh"
else
    echo -e "${GREEN}✅ Consumer connected${NC}"
    echo "$CONSUMERS"
fi
echo ""

# Summary
echo "📊 Summary:"
echo "─────────────────────────────────────────"
echo "• RabbitMQ Management: http://localhost:15672"
echo "  (guest/guest)"
echo "• Exchange: order.exchange (topic)"
echo "• Queue: seller.queue"
echo "• Routing Key: order.created"
echo ""

# Check if service is running
if docker ps --format '{{.Names}}' | grep -q seller-service; then
    echo -e "${GREEN}✅ seller-service is running${NC}"
    echo "Logs: docker logs -f seller-service"
else
    echo -e "${YELLOW}⚠️  seller-service is not running${NC}"
    echo "Start with: ./dev.sh"
fi

