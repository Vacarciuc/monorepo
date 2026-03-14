#!/bin/bash

# Test script - runs all tests with coverage
# Usage: ./test.sh [options]
#   --watch    Run tests in watch mode
#   --e2e      Run only e2e tests
#   --unit     Run only unit tests
#   --cov      Run with coverage report

set -e

echo "🧪 Seller Service - Test Runner"
echo "================================"
echo ""

# Parse arguments
MODE="all"
WATCH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --watch)
            WATCH=true
            shift
            ;;
        --e2e)
            MODE="e2e"
            shift
            ;;
        --unit)
            MODE="unit"
            shift
            ;;
        --cov)
            MODE="coverage"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./test.sh [--watch|--e2e|--unit|--cov]"
            exit 1
            ;;
    esac
done

# Run tests based on mode
case $MODE in
    "e2e")
        echo "📋 Running E2E tests..."
        pnpm test:e2e
        ;;
    "unit")
        echo "📋 Running unit tests..."
        if [ "$WATCH" = true ]; then
            pnpm test:watch
        else
            pnpm test
        fi
        ;;
    "coverage")
        echo "📋 Running tests with coverage..."
        pnpm test:cov
        ;;
    "all")
        echo "📋 Running all tests..."
        if [ "$WATCH" = true ]; then
            pnpm test:watch
        else
            echo "Unit tests:"
            pnpm test
            echo ""
            echo "E2E tests:"
            pnpm test:e2e
        fi
        ;;
esac

echo ""
echo "✅ Tests completed!"

