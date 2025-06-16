#!/bin/bash

# Stop and clean up all services
set -e

echo "🛑 Stopping all services..."

# Stop development services
if [ -f "docker-compose.yml" ]; then
    echo "🔄 Stopping development services..."
    docker-compose down -v
fi

# Stop production services
if [ -f "docker-compose.prod.yml" ]; then
    echo "🔄 Stopping production services..."
    docker-compose -f docker-compose.prod.yml down -v
fi

# Remove unused images and containers
echo "🧹 Cleaning up Docker resources..."
docker system prune -f

# Remove volumes (optional - uncomment if you want to remove all data)
# echo "🗑️  Removing Docker volumes..."
# docker volume prune -f

echo "✅ Cleanup completed!"
