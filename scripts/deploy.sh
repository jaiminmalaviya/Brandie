#!/bin/bash

# Deploy script for production
set -e

echo "🚀 Starting deployment process..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if required environment files exist
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found. Please create it first."
    echo "📝 You can copy from .env.example and modify the values."
    exit 1
fi

# Build and start production services
echo "🏗️  Building production Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🗃️  Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker-compose -f docker-compose.prod.yml exec app npx prisma generate

# Check if services are healthy
echo "🏥 Checking service health..."
sleep 5

# Check PostgreSQL
if docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres -d brandie_db; then
    echo "✅ PostgreSQL is healthy"
else
    echo "❌ PostgreSQL health check failed"
fi

# Check application
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Application is healthy"
else
    echo "❌ Application health check failed"
fi

# Show service status
echo "📊 Service status:"
docker-compose -f docker-compose.prod.yml ps

echo "🎉 Deployment completed!"
echo "🌐 Application is available at: http://localhost:3000"
echo "🏥 Health check: http://localhost:3000/health"
echo "📊 View logs: docker-compose -f docker-compose.prod.yml logs -f"
