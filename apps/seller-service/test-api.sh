#!/bin/bash

# Seller Service Test Script

echo "🧪 Testing Seller Service..."

BASE_URL="http://localhost:3002"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4

    echo -e "\n${YELLOW}Testing: $method $endpoint${NC}"

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✓ Success (Status: $http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Failed (Expected: $expected_status, Got: $http_code)${NC}"
        echo "$body"
    fi
}

# Check if service is running
echo "Checking if service is running..."
if ! curl -s "$BASE_URL" > /dev/null; then
    echo -e "${RED}Service is not running at $BASE_URL${NC}"
    echo "Please start the service with: pnpm start:dev"
    exit 1
fi

echo -e "${GREEN}Service is running!${NC}"

# Test Sellers
echo -e "\n${YELLOW}=== Testing Sellers ===${NC}"

test_endpoint "POST" "/sellers" '{
    "name": "Test Seller",
    "email": "test@example.com",
    "companyName": "Test Company"
}' "201"

test_endpoint "GET" "/sellers" "" "200"

# Save seller ID for later use
SELLER_ID=$(curl -s -X POST "$BASE_URL/sellers" \
    -H "Content-Type: application/json" \
    -d '{"name":"Product Test Seller","email":"product@example.com","companyName":"Product Co"}' \
    | jq -r '.id')

echo -e "\n${YELLOW}Created Seller ID: $SELLER_ID${NC}"

test_endpoint "GET" "/sellers/$SELLER_ID" "" "200"

test_endpoint "PUT" "/sellers/$SELLER_ID" '{
    "name": "Updated Seller Name"
}' "200"

# Test Products
echo -e "\n${YELLOW}=== Testing Products ===${NC}"

test_endpoint "POST" "/products" "{
    \"sellerId\": \"$SELLER_ID\",
    \"name\": \"Test Laptop\",
    \"description\": \"Gaming laptop\",
    \"price\": 1299.99,
    \"stock\": 10,
    \"currency\": \"USD\"
}" "201"

# Save product ID
PRODUCT_ID=$(curl -s -X POST "$BASE_URL/products" \
    -H "Content-Type: application/json" \
    -d "{\"sellerId\":\"$SELLER_ID\",\"name\":\"Cart Test Product\",\"price\":99.99,\"stock\":5}" \
    | jq -r '.id')

echo -e "\n${YELLOW}Created Product ID: $PRODUCT_ID${NC}"

test_endpoint "GET" "/products/$PRODUCT_ID" "" "200"

test_endpoint "GET" "/sellers/$SELLER_ID/products" "" "200"

test_endpoint "PUT" "/products/$PRODUCT_ID" '{
    "price": 89.99,
    "stock": 15
}' "200"

# Test Cart
echo -e "\n${YELLOW}=== Testing Cart ===${NC}"

test_endpoint "GET" "/sellers/$SELLER_ID/cart" "" "200"

test_endpoint "POST" "/sellers/$SELLER_ID/cart/items" "{
    \"productId\": \"$PRODUCT_ID\",
    \"quantity\": 3
}" "201"

test_endpoint "PUT" "/sellers/$SELLER_ID/cart/items" "{
    \"productId\": \"$PRODUCT_ID\",
    \"quantity\": 5
}" "200"

test_endpoint "DELETE" "/sellers/$SELLER_ID/cart/items/$PRODUCT_ID" "" "200"

# Clean up
echo -e "\n${YELLOW}=== Cleaning up ===${NC}"

test_endpoint "DELETE" "/products/$PRODUCT_ID" "" "204"
test_endpoint "DELETE" "/sellers/$SELLER_ID" "" "204"

echo -e "\n${GREEN}✅ All tests completed!${NC}"
echo -e "\n${YELLOW}Check Swagger documentation at: $BASE_URL/api/docs${NC}"

