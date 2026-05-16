# Arianation CRM E-Commerce Operations Runbook

**Version**: 1.0.0  
**Last Updated**: May 16, 2026  
**Target Audience**: DevOps Engineers, System Administrators, Support Team

## Table of Contents
1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Deployment](#deployment)
5. [Database Management](#database-management)
6. [Monitoring & Logs](#monitoring--logs)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)
9. [Backup & Recovery](#backup--recovery)
10. [Security](#security)

---

## System Overview

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  Next.js Frontend (React 19, TailwindCSS)                   │
│  Ports: 3000 (dev) | 443 (prod)                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                 API Gateway / Load Balancer                  │
│  (Optional: Nginx, Cloudflare, AWS ALB)                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Layer                         │
│  Express.js Server (Node.js 20)                             │
│  Port: 3001 (dev) | 443 (prod)                              │
│  Rate Limiting: express-rate-limit                          │
│  Auth: JWT + HttpOnly Cookies                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  MySQL 8.0 Database (Laragon / Production RDS)              │
│  Database: arianation_db                                    │
│  Migrations: Prisma                                         │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 16.2.4, React 19, TailwindCSS 3.4.1
- **Backend**: Express 5.2.1, Node.js 20+
- **Database**: MySQL 8.0
- **ORM**: Prisma 6.19.3
- **Auth**: JWT + bcryptjs
- **Testing**: Jest 30.3.0
- **CI/CD**: GitHub Actions
- **Package Manager**: npm

---

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ / Windows 10+ / macOS 10.15+
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **MySQL**: 8.0 or higher
- **Disk Space**: 2GB minimum
- **RAM**: 2GB minimum (4GB recommended)

### Required Tools
```bash
# Verify versions
node --version       # v20.x.x
npm --version        # 10.x.x
mysql --version      # 8.0.x
git --version        # 2.30+
```

### Development Tools (Optional)
```bash
# Install globally
npm install -g nodemon     # Auto-restart on file changes
npm install -g prisma      # Database migrations CLI
npm install -g pm2         # Process manager
```

---

## Installation & Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/RidhoHuman/arianation-crm-ecommerce.git
cd arianation-crm-ecommerce
```

### Step 2: Install Dependencies
```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### Step 3: Setup Database

#### Option A: Using Laragon (Windows Development)
1. Start Laragon MySQL service
2. Create database: `CREATE DATABASE arianation_db;`
3. Note credentials: User `root`, Password `{your_password}`

#### Option B: Using Docker
```bash
docker run --name arianation-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=arianation_db \
  -p 3306:3306 \
  -d mysql:8.0
```

#### Option C: Cloud Database (AWS RDS)
```bash
# Create RDS instance with:
# Engine: MySQL 8.0
# Storage: 20GB
# Instance class: db.t3.micro (dev) / db.t3.small (prod)
# Multi-AZ: No (dev) / Yes (prod)
```

### Step 4: Configure Environment Variables

Create `.env` file in root directory:
```env
# Database
DATABASE_URL=mysql://root:password@localhost:3306/arianation_db
DIRECT_DATABASE_URL=mysql://root:password@localhost:3306/arianation_db

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRY=7d

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@arianation.com

# Webhook
XENDIT_WEBHOOK_VERIFY_TOKEN=webhook_secret_token

# File Upload
UPLOAD_DIR=public/uploads
MAX_FILE_SIZE=10485760
```

### Step 5: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npm run prisma:seed
```

### Step 6: Create Admin User

```bash
# Interactive admin setup
node set-admin-role.js

# Or use script with email
node scripts/seedProducts.js
```

### Step 7: Start Services

**Terminal 1 - Backend:**
```bash
npm run dev
# Output: 🚀 Server running on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Output: ▲ Next.js ready on http://localhost:3000
```

Verify both are running:
- Backend: `curl http://localhost:3001/api/health`
- Frontend: Open `http://localhost:3000` in browser

---

## Deployment

### Production Deployment Checklist

```
[ ] Environment variables set on server
[ ] Database backups scheduled
[ ] SSL/TLS certificates installed
[ ] Monitoring and alerting configured
[ ] Error logging setup (e.g., Sentry)
[ ] CDN configured for static assets
[ ] Database connection pooling enabled
[ ] Rate limiting configured
[ ] Secrets rotated and secured
[ ] Load balancer health checks configured
```

### Docker Deployment

#### Create Dockerfile (Root)
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["node", "src/index.js"]
```

#### Create docker-compose.yml
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: mysql://root:${MYSQL_PASSWORD}@mysql:3306/arianation_db
      NODE_ENV: production
    depends_on:
      - mysql
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_DATABASE: arianation_db
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped

volumes:
  mysql_data:
```

#### Build & Deploy
```bash
# Build
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### AWS Deployment (EC2 + RDS)

```bash
# SSH into EC2
ssh -i key.pem ec2-user@instance.ip

# Install dependencies
sudo yum install nodejs npm mysql

# Clone and setup
git clone https://...
cd arianation-crm-ecommerce
npm install
npx prisma migrate deploy

# Start with PM2
pm2 start src/index.js --name "api"
pm2 save
pm2 startup
```

### CI/CD Pipeline (GitHub Actions)

GitHub Actions workflow automatically:
1. Runs tests on push to `main`
2. Checks code quality (ESLint, Prettier)
3. Applies database migrations
4. (Optional) Deploys to production

See `.github/workflows/ci.yml` for configuration.

---

## Database Management

### Backup Database

#### Manual Backup
```bash
# Full database dump
mysqldump -u root -p arianation_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
mysql -u root -p arianation_db < backup_20260516_100000.sql
```

#### Automated Backup (Cron Job)
```bash
# Add to crontab (daily at 2 AM)
0 2 * * * mysqldump -u root -p${MYSQL_PASSWORD} arianation_db > /backups/db_$(date +\%Y\%m\%d).sql

# Cleanup old backups (keep 30 days)
0 3 * * * find /backups -name "db_*.sql" -mtime +30 -delete
```

### Migrations

#### Create New Migration
```bash
# After schema changes
npx prisma migrate dev --name descriptive_name

# Generates migration file in prisma/migrations/
```

#### Apply Migrations
```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

#### Reset Database (Development Only)
```bash
# WARNING: Deletes all data
npx prisma migrate reset
```

### Database Monitoring

#### Check Connection
```bash
mysql -h localhost -u root -p -e "SELECT 1"
```

#### View Database Stats
```sql
SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'arianation_db'
ORDER BY (data_length + index_length) DESC;
```

#### Kill Long Running Queries
```sql
SHOW PROCESSLIST;
KILL query_id;
```

---

## Monitoring & Logs

### Application Logs

#### Backend Logs
```bash
# Development (console output)
npm run dev

# Production with PM2
pm2 logs api

# Docker
docker-compose logs -f api
```

#### Log Format
```
[timestamp] [level] [module] message
2026-05-16T10:30:00Z [ERROR] [orderController] Order not found: ord123...
```

### Performance Monitoring

#### Request Response Time
```bash
# Use CLI timing
time curl http://localhost:3001/api/health

# Monitor with monitoring tool
npm install -g clinic
clinic doctor -- node src/index.js
```

#### Database Query Performance
```bash
# Enable query logging in MySQL
SET GLOBAL log_queries_not_using_indexes = ON;
tail -f /var/log/mysql/queries.log
```

### Uptime Monitoring

#### Health Check Endpoint
```bash
# Backend health
curl http://localhost:3001/api/health

# Expected response
{
  "success": true,
  "message": "Arianation API is running",
  "timestamp": "2026-05-16T10:30:00Z",
  "environment": "production"
}
```

#### Setup Monitoring (Recommended)
- **Uptime Robot**: Free uptime monitoring
- **New Relic**: Application performance monitoring
- **Datadog**: Infrastructure monitoring
- **CloudWatch**: AWS monitoring

---

## Common Tasks

### User Management

#### Create Admin User
```bash
node set-admin-role.js
# Follow interactive prompts
```

#### Reset User Password
```bash
# Via API (user-initiated password reset)
POST /auth/forgot-password
{
  "email": "user@example.com"
}
```

#### Deactivate User Account
```bash
# SQL
UPDATE users SET isActive = FALSE WHERE id = 'user123...';
```

### Order Management

#### Export Orders
```bash
# Via API
GET /admin/orders/export?format=csv&startDate=2026-05-01&endDate=2026-05-31

# Via Database
SELECT * FROM orders WHERE createdAt BETWEEN '2026-05-01' AND '2026-05-31' INTO OUTFILE '/tmp/orders.csv' FIELDS TERMINATED BY ',' ENCLOSED BY '"';
```

#### Bulk Update Order Status
```bash
# Via API (one by one)
PUT /admin/orders/{id}/status

# Via Database (careful!)
UPDATE orders SET status = 'CONFIRMED' WHERE status = 'PENDING' AND paymentStatus = 'COMPLETED';
```

### Product Management

#### Add Inventory
```bash
# Via API
PUT /admin/products/{id}
{
  "stockQuantity": 500
}

# Via Database
UPDATE products SET stockQuantity = stockQuantity + 100 WHERE id = 'prod123...';
```

#### Archive Product
```bash
# Via API
PUT /admin/products/{id}
{
  "isActive": false
}
```

### Testing

#### Run Test Suite
```bash
npm test                    # All tests
npm run test:watch         # Watch mode
npm test -- --coverage     # With coverage report
npm test -- orderFulfillment # Specific test file
```

#### Manual API Testing
```bash
# Using REST client (VSCode extension)
POST http://localhost:3001/api/orders HTTP/1.1
Content-Type: application/json

{
  "items": [...],
  "paymentMethod": "BANK_TRANSFER"
}
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
error: Connection error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check credentials in .env
cat .env | grep DATABASE_URL

# Test connection
mysql -h localhost -u root -p

# Check port
netstat -an | grep 3306

# Restart MySQL
sudo systemctl restart mysql
```

#### 2. Prisma Client Error
```
error: Environment variable not found: DATABASE_URL
```

**Solutions:**
```bash
# Create .env file
cp .env.example .env

# Generate client
npx prisma generate

# Verify
echo $DATABASE_URL
```

#### 3. Port Already in Use
```
listen EADDRINUSE: address already in use :::3001
```

**Solutions:**
```bash
# Linux/Mac
lsof -i :3001
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use different port
PORT=3002 npm run dev
```

#### 4. JWT Token Invalid
```
error: Invalid token
```

**Solutions:**
```bash
# Verify JWT_SECRET matches in .env
# Check token hasn't expired
# Clear cookies and re-authenticate
```

#### 5. CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solutions:**
```bash
# Check FRONTEND_URL in .env matches frontend origin
# Verify CORS configuration in src/app.js
# Check credentials: true in fetch requests
```

### Debug Mode

```bash
# Enable detailed logging
DEBUG=* npm run dev

# Prisma debug
DEBUG=prisma:* npm run dev

# Node debug inspector
node --inspect src/index.js
# Visit chrome://inspect in Chrome DevTools
```

### Performance Issues

#### Slow API Response
```bash
# 1. Check database queries
SELECT * FROM information_schema.processlist WHERE time > 5;

# 2. Check indexes
SELECT * FROM information_schema.statistics WHERE table_schema = 'arianation_db';

# 3. Analyze slow query log
mysqldumpslow -s at /var/log/mysql/slow.log

# 4. Monitor server resources
htop
```

#### High Memory Usage
```bash
# Check Node.js memory
node --max-old-space-size=4096 src/index.js

# Monitor with clinic
npm install -g clinic
clinic doctor -- node src/index.js
```

---

## Backup & Recovery

### Automated Backup Strategy

```bash
#!/bin/bash
# backup.sh - Daily database backup

BACKUP_DIR="/backups/mysql"
DB_NAME="arianation_db"
DB_USER="root"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"

mkdir -p $BACKUP_DIR

# Backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Recovery Procedure

```bash
# 1. Stop services
npm run stop
docker-compose down

# 2. Restore database
mysql -u root -p arianation_db < backup_20260516_100000.sql

# 3. Verify data
mysql -u root -p -e "SELECT COUNT(*) FROM arianation_db.orders;"

# 4. Restart services
npm run dev
docker-compose up -d

# 5. Check logs
npm run logs
```

---

## Security

### Best Practices

#### 1. Environment Variables
```bash
# ✅ DO: Store in .env (gitignored)
DATABASE_URL=mysql://...

# ❌ DON'T: Hardcode in source
const db_url = "mysql://...";
```

#### 2. Authentication
```bash
# ✅ DO: Use strong JWT_SECRET (32+ characters)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long

# ✅ DO: Use HTTPS in production
FRONTEND_URL=https://arianation.com

# ❌ DON'T: Expose tokens in URLs
# ❌ DON'T: Use weak secrets
```

#### 3. Database Security
```bash
# ✅ DO: Use connection pooling
# ✅ DO: Regular backups
# ✅ DO: Enable SSL

# ❌ DON'T: Use default credentials
# ❌ DON'T: Expose database to internet
```

#### 4. Secrets Rotation
```bash
# Rotate secrets quarterly
1. Generate new JWT_SECRET
2. Update .env and GitHub Secrets
3. Redeploy applications
4. Old tokens remain valid for JWT_EXPIRY duration
```

#### 5. API Security
```bash
# Rate limiting configured
# Request validation enabled
# CORS properly configured
# Input sanitization in place
# SQL injection prevention via Prisma
```

### Security Checklist

```
[ ] All credentials in environment variables
[ ] HTTPS enabled in production
[ ] Database backups automated
[ ] Access logs monitored
[ ] Rate limiting active
[ ] CORS properly configured
[ ] Secrets rotated quarterly
[ ] Database updated to latest patch
[ ] Node.js runtime updated
[ ] Dependencies scanned for vulnerabilities
[ ] Admin accounts secured
[ ] API keys stored in Secrets manager
```

---

## Quick Reference

### Common Commands

```bash
# Start development
npm run dev                    # Backend
cd frontend && npm run dev     # Frontend

# Testing
npm test                       # Run tests
npm run test:watch            # Watch mode
npm run format                # Format code
npm run lint                  # Check linting

# Database
npx prisma studio            # GUI for database
npx prisma migrate dev        # Create migration
npx prisma migrate deploy     # Apply migrations

# Production
npm run start                 # Production server
pm2 start src/index.js        # With PM2
```

### Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Backend | `http://localhost:3001` | API server |
| Frontend | `http://localhost:3000` | Web application |
| Prisma Studio | `http://localhost:5555` | Database GUI |
| Health Check | `/api/health` | Service status |

---

## Support & Resources

- **API Docs**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **GitHub Issues**: Report bugs here
- **Discord/Slack**: Team communication
- **Documentation**: [docs/](docs/)

---

**Last Updated**: May 16, 2026  
**Maintained By**: DevOps Team  
**Version**: 1.0.0
