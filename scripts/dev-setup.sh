#!/bin/bash

# Development setup script
set -e

echo "🚀 Starting development setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists, if not copy from example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📝 Creating .env file from .env.example..."
        cp .env.example .env
        echo "✅ .env file created. Please review and modify the values if needed."
    else
        echo "❌ .env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start development services
echo "🏗️  Starting development services..."
docker-compose up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Run database migrations
echo "📊 Running database migrations..."
npm run db:migrate

# Seed the database
echo "🌱 Seeding database..."
npm run db:seed

# Check if services are healthy
echo "🏥 Checking service health..."
if docker-compose exec postgres pg_isready -U postgres -d brandie_db; then
    echo "✅ PostgreSQL is healthy"
else
    echo "❌ PostgreSQL health check failed"
fi

echo "🎉 Development setup completed!"
echo "🚀 Start development server: npm run dev"
echo "🏠 Application will be available at: http://localhost:3000"
echo "🗃️  Database studio: npm run db:studio"
echo "🧪 Run tests: npm test"
