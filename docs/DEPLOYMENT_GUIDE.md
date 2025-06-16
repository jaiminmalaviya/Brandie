# Docker & Deployment Guide

This guide covers Docker setup, deployment strategies, and production configuration for the Brandie Social Media API.

## Table of Contents

1. [Docker Overview](#docker-overview)
2. [Development Setup](#development-setup)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Monitoring & Health Checks](#monitoring--health-checks)
6. [Troubleshooting](#troubleshooting)

## Docker Overview

The project includes multiple Docker configurations:

- **Dockerfile**: Multi-stage production build
- **Dockerfile.dev**: Development environment
- **docker-compose.yml**: Development services
- **docker-compose.prod.yml**: Production services

### Architecture

```
┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Application   │
│ (Load Balancer) │───▶│   (Node.js)     │
│   Port 80/443   │    │   Port 3000     │
└─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Port 5432     │
                       └─────────────────┘
                                │
                       ┌─────────────────┐
                       │     Redis       │
                       │   Port 6379     │
                       └─────────────────┘
```

## Development Setup

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Quick Start

1. **Clone and setup:**

   ```bash
   git clone <repository-url>
   cd brandie
   npm run setup:dev
   ```

2. **Start development:**

   ```bash
   npm run dev
   ```

3. **Using Docker for development:**

   ```bash
   # Start with Docker
   npm run docker:dev

   # Build and start
   npm run docker:dev:build

   # Stop services
   npm run docker:dev:stop
   ```

### Development Services

- **Application**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Prisma Studio**: `npm run db:studio`

## Production Deployment

### Environment Setup

1. **Create production environment file:**

   ```bash
   cp .env.example .env.production
   ```

2. **Update production values:**
   ```bash
   # Required changes in .env.production
   NODE_ENV=production
   JWT_SECRET=your_super_secure_jwt_secret
   DB_PASSWORD=your_secure_password
   CORS_ORIGIN=https://yourdomain.com
   ```

### Deployment Options

#### Option 1: Automated Deployment

```bash
npm run deploy
```

This script will:

- Build Docker images
- Start production services
- Run database migrations
- Perform health checks

#### Option 2: Manual Deployment

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up --build -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Check health
curl http://localhost:3000/health
```

#### Option 3: Step-by-step

```bash
# 1. Build production image
docker build -t brandie-app:latest .

# 2. Start database first
docker-compose -f docker-compose.prod.yml up -d postgres

# 3. Wait for database and start app
docker-compose -f docker-compose.prod.yml up -d app

# 4. Start nginx
docker-compose -f docker-compose.prod.yml up -d nginx
```

## Environment Configuration

### Development Environment

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/brandie_db?schema=public"
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

### Production Environment

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://postgres:secure_password@postgres:5432/brandie_db?schema=public"
JWT_SECRET=super_secure_production_secret
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
TRUSTED_IPS=127.0.0.1,::1
```

### Environment Variables

| Variable       | Description                  | Default               | Required |
| -------------- | ---------------------------- | --------------------- | -------- |
| NODE_ENV       | Environment mode             | development           | No       |
| PORT           | Application port             | 3000                  | No       |
| DATABASE_URL   | PostgreSQL connection string | -                     | Yes      |
| JWT_SECRET     | JWT signing secret           | -                     | Yes      |
| JWT_EXPIRES_IN | JWT expiration time          | 7d                    | No       |
| CORS_ORIGIN    | Allowed CORS origins         | http://localhost:3000 | No       |
| LOG_LEVEL      | Logging level                | debug                 | No       |
| REDIS_URL      | Redis connection string      | -                     | No       |

## Monitoring & Health Checks

### Health Check Endpoints

- **Application Health**: `GET /health`
- **Database Health**: Included in Docker health checks
- **Basic Info**: `GET /`

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

### Docker Health Checks

All services include health checks:

- **Application**: HTTP endpoint check
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping`

### Monitoring Commands

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check health
curl http://localhost:3000/health

# Monitor resources
docker stats
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)

1. **Install Certbot:**

   ```bash
   # Ubuntu/Debian
   sudo apt install certbot

   # macOS
   brew install certbot
   ```

2. **Generate certificates:**

   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```

3. **Update nginx configuration:**

   - Copy certificates to `./nginx/ssl/`
   - Uncomment HTTPS server block in `nginx.conf`
   - Update domain name

4. **Setup auto-renewal:**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Scaling & Load Balancing

### Horizontal Scaling

```yaml
# docker-compose.prod.yml
app:
  scale: 3 # Run 3 instances
  deploy:
    replicas: 3
```

### Load Balancer Configuration

Nginx is configured with:

- Rate limiting
- Health checks
- Gzip compression
- Security headers
- SSL termination

## Backup Strategy

### Database Backups

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres brandie_db > backup.sql

# Automated backup script
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres brandie_db | gzip > "backup_$(date +%Y%m%d_%H%M%S).sql.gz"
```

### Volume Backups

```bash
# Backup volumes
docker run --rm -v brandie_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Check health
docker-compose -f docker-compose.prod.yml exec app curl http://localhost:3000/health
```

#### Database Connection Issues

```bash
# Check database health
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres

# Check connectivity from app
docker-compose -f docker-compose.prod.yml exec app ping postgres
```

#### Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh
```

### Debug Commands

```bash
# Enter application container
docker-compose -f docker-compose.prod.yml exec app sh

# Check environment variables
docker-compose -f docker-compose.prod.yml exec app env

# Test database connection
docker-compose -f docker-compose.prod.yml exec app npx prisma db pull
```

### Log Analysis

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f app

# Database logs
docker-compose -f docker-compose.prod.yml logs -f postgres

# Nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx

# All services
docker-compose -f docker-compose.prod.yml logs -f
```

## Performance Optimization

### Production Optimizations

1. **Multi-stage Docker build** - Reduces image size
2. **Non-root user** - Security best practice
3. **Health checks** - Automatic recovery
4. **Resource limits** - Prevent resource exhaustion
5. **Gzip compression** - Faster response times
6. **Connection pooling** - Better database performance

### Monitoring Tools

Consider integrating:

- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **ELK Stack** - Log aggregation
- **New Relic/DataDog** - APM

## Security Considerations

### Docker Security

- Non-root user in containers
- Multi-stage builds
- Minimal base images (Alpine)
- No secrets in images
- Read-only containers where possible

### Network Security

- Isolated Docker networks
- Rate limiting via Nginx
- CORS configuration
- Security headers
- IP whitelisting

### Production Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure proper CORS
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test disaster recovery
- [ ] Review security headers
- [ ] Enable rate limiting
- [ ] Configure logging
