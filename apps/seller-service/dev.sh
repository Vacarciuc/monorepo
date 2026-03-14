#!/bin/bash

# Development startup script
# Starts seller-service in development mode with hot reload

set -e

echo "🚀 Starting Seller Service (Development Mode)"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env created"
    else
        echo "❌ .env.example not found. Please create .env manually."
        exit 1
    fi
    echo ""
fi

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo ""
fi

# Start the service
echo "🔧 Starting service with hot reload..."
echo "Press Ctrl+C to stop"
echo ""

pnpm start:dev

