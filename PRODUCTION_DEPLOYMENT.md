# InvestNaija Production Deployment Guide

This guide covers the complete process of deploying InvestNaija to a production environment with proper security, scalability, and monitoring.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Security Configuration](#security-configuration)
6. [Deployment Process](#deployment-process)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup and Recovery](#backup-and-recovery)
9. [Performance Optimization](#performance-optimization)
10. [Compliance and Legal](#compliance-and-legal)

## Pre-Deployment Checklist

### Business Requirements

- [ ] CBN approval for financial services (if required)
- [ ] Business registration with CAC
- [ ] Professional indemnity insurance
- [ ] Legal compliance review
- [ ] Security audit completed
- [ ] Penetration testing completed

### Technical Requirements

- [ ] All API integrations tested and verified
- [ ] Load testing completed
- [ ] Security vulnerabilities addressed
- [ ] Database migrations tested
- [ ] Backup and recovery procedures tested
- [ ] Monitoring and alerting configured
- [ ] SSL certificates obtained
- [ ] Domain name configured

### API Integrations

- [ ] Paystack live keys configured and tested
- [ ] Flutterwave live keys configured and tested
- [ ] YouVerify production account activated
- [ ] Termii sender ID approved
- [ ] CoinGecko API limits confirmed
- [ ] Webhook endpoints secured and tested

## Infrastructure Setup

### Recommended Architecture

```
Internet → Load Balancer → Application Servers → Database
                      ↓
                   Redis Cache
                      ↓
               Background Jobs Queue
```

### Cloud Provider Options

#### Option 1: AWS Setup

1. **EC2 Instances**

   ```bash
   # Application servers (minimum 2 for redundancy)
   Instance Type: t3.medium (2 vCPU, 4GB RAM)
   OS: Ubuntu 22.04 LTS
   Storage: 20GB SSD
   Security Groups: HTTP(80), HTTPS(443), SSH(22)
   ```

2. **RDS Database**

   ```bash
   Engine: PostgreSQL 15
   Instance Class: db.t3.micro (for small scale) or db.t3.small
   Storage: 20GB SSD with auto-scaling
   Multi-AZ: Enabled for production
   Backup: 7-day retention
   ```

3. **ElastiCache Redis**

   ```bash
   Node Type: cache.t3.micro
   Redis Version: 7.x
   Cluster Mode: Disabled (for simplicity)
   ```

4. **Application Load Balancer**
   ```bash
   Type: Application Load Balancer
   Scheme: Internet-facing
   SSL Certificate: AWS Certificate Manager
   Health Check: /health endpoint
   ```

#### Option 2: Digital Ocean Setup

1. **Droplets**

   ```bash
   # Application servers
   Size: 2GB RAM, 1 vCPU, 50GB SSD
   OS: Ubuntu 22.04 LTS
   Quantity: 2 (for redundancy)
   ```

2. **Managed Database**

   ```bash
   Engine: PostgreSQL 15
   Size: 1GB RAM, 1 vCPU, 10GB Storage
   Standby: Enabled
   ```

3. **Load Balancer**
   ```bash
   Type: Application Load Balancer
   SSL Certificate: Let's Encrypt
   Health Check: Enabled
   ```

### Domain and DNS Setup

1. **Domain Configuration**

   ```bash
   Primary: investnaija.com
   API: api.investnaija.com
   Admin: admin.investnaija.com
   ```

2. **DNS Records**
   ```bash
   A Record: @ → Load Balancer IP
   A Record: api → Load Balancer IP
   A Record: admin → Load Balancer IP
   CNAME: www → investnaija.com
   ```

## Environment Configuration

### Production Environment Variables

Create `/home/ubuntu/investnaija/.env`:

```bash
# Application Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://investnaija.com
API_URL=https://api.investnaija.com

# Security
JWT_SECRET=your-production-jwt-secret-minimum-32-characters-required
ENCRYPTION_KEY=your-production-encryption-key-minimum-32-characters-required
SESSION_SECRET=your-production-session-secret-minimum-32-characters-required

# Database
DATABASE_URL=postgresql://username:password@rds-endpoint:5432/investnaija_prod

# Redis
REDIS_URL=redis://elasticache-endpoint:6379

# Paystack (Live Keys)
PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key
PAYSTACK_WEBHOOK_SECRET=your_production_webhook_secret

# Flutterwave (Live Keys)
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_live_public_key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_live_secret_key
FLUTTERWAVE_WEBHOOK_SECRET=your_production_webhook_secret

# YouVerify (Production)
YOUVERIFY_API_KEY=your_production_youverify_key
YOUVERIFY_BASE_URL=https://api.youverify.co/v2

# Termii (Production)
TERMII_API_KEY=your_production_termii_key
TERMII_SENDER_ID=InvestNaija

# CoinGecko
COINGECKO_API_KEY=your_production_coingecko_key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Email
SENDGRID_API_KEY=your_production_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@investnaija.com

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Feature Flags
ENABLE_SIGNUP=true
ENABLE_KYC=true
ENABLE_INVESTMENTS=true
ENABLE_BILL_PAYMENTS=true

# Limits
MAX_DAILY_TRANSACTIONS=100
MAX_UNVERIFIED_WALLET_BALANCE=50000
MAX_INVESTMENT_AMOUNT=10000000
```

### SSL Certificate Setup

#### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d investnaija.com -d www.investnaija.com -d api.investnaija.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Database Setup

### PostgreSQL Production Setup

1. **Create Production Database**

   ```sql
   CREATE DATABASE investnaija_prod;
   CREATE USER investnaija_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE investnaija_prod TO investnaija_user;
   ```

2. **Run Migrations**

   ```bash
   # Connect to production database
   NODE_ENV=production npm run migrate

   # Seed initial data
   NODE_ENV=production npm run seed
   ```

3. **Database Security**

   ```sql
   -- Enable SSL
   ALTER SYSTEM SET ssl = on;
   SELECT pg_reload_conf();

   -- Configure connection limits
   ALTER USER investnaija_user CONNECTION LIMIT 50;

   -- Enable logging
   ALTER SYSTEM SET log_statement = 'all';
   ALTER SYSTEM SET log_duration = on;
   ```

### Backup Configuration

```bash
# Create backup script
cat > /home/ubuntu/backup_db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
DB_NAME="investnaija_prod"

mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql s3://your-backup-bucket/database/
EOF

chmod +x /home/ubuntu/backup_db.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup_db.sh
```

## Security Configuration

### Firewall Setup

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Application-specific rules
sudo ufw allow from 10.0.0.0/8 to any port 3000  # Internal app port
sudo ufw allow from load_balancer_ip to any port 3000
```

### Nginx Configuration

Create `/etc/nginx/sites-available/investnaija`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

server {
    listen 80;
    server_name investnaija.com www.investnaija.com api.investnaija.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name investnaija.com www.investnaija.com;

    ssl_certificate /etc/letsencrypt/live/investnaija.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/investnaija.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.paystack.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";

    # Static files
    location / {
        root /home/ubuntu/investnaija/dist/spa;
        try_files $uri $uri/ /index.html;
    }

    # API proxy with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Auth endpoints with stricter rate limiting
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Process Management with PM2

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'investnaija-api',
    script: 'dist/server/node-build.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/ubuntu/logs/pm2-error.log',
    out_file: '/home/ubuntu/logs/pm2-out.log',
    log_file: '/home/ubuntu/logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## Deployment Process

### Automated Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting InvestNaija deployment..."

# Configuration
REPO_URL="https://github.com/your-org/investnaija.git"
APP_DIR="/home/ubuntu/investnaija"
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup
echo "📦 Creating backup..."
mkdir -p $BACKUP_DIR
cp -r $APP_DIR $BACKUP_DIR/backup_$TIMESTAMP || true

# Pull latest code
echo "📥 Pulling latest code..."
cd $APP_DIR
git fetch origin
git reset --hard origin/main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
NODE_ENV=production npm run migrate

# Restart services
echo "🔄 Restarting services..."
pm2 reload ecosystem.config.js --env production

# Health check
echo "🏥 Performing health check..."
sleep 10
curl -f http://localhost:3000/health || {
    echo "❌ Health check failed, rolling back..."
    pm2 stop all
    rm -rf $APP_DIR
    cp -r $BACKUP_DIR/backup_$TIMESTAMP $APP_DIR
    pm2 start ecosystem.config.js --env production
    exit 1
}

# Cleanup old backups
find $BACKUP_DIR -name "backup_*" -mtime +7 -exec rm -rf {} \;

echo "✅ Deployment completed successfully!"
```

### CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm test
      - run: npm run typecheck

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /home/ubuntu/investnaija
            ./deploy.sh
```

## Monitoring and Logging

### Application Monitoring

1. **Sentry Setup**

   ```bash
   npm install @sentry/node @sentry/profiling-node
   ```

2. **Custom Health Checks**

   ```typescript
   // Add to server/routes/health.ts
   export const healthCheck = async (req: Request, res: Response) => {
     const checks = {
       database: await checkDatabase(),
       redis: await checkRedis(),
       paystack: await checkPaystack(),
       flutterwave: await checkFlutterwave(),
       youverify: await checkYouVerify(),
       termii: await checkTermii(),
     };

     const allHealthy = Object.values(checks).every(
       (check) => check.status === "ok",
     );

     res.status(allHealthy ? 200 : 503).json({
       status: allHealthy ? "healthy" : "unhealthy",
       timestamp: new Date().toISOString(),
       checks,
     });
   };
   ```

3. **Log Aggregation**

   ```bash
   # Install log aggregation
   npm install winston winston-daily-rotate-file

   # Configure log rotation
   mkdir -p /home/ubuntu/logs
   chown ubuntu:ubuntu /home/ubuntu/logs
   ```

### Infrastructure Monitoring

1. **Server Monitoring**

   ```bash
   # Install monitoring tools
   sudo apt install htop iotop nethogs

   # Setup log monitoring
   sudo apt install logwatch
   ```

2. **Database Monitoring**
   ```sql
   -- Enable query logging
   ALTER SYSTEM SET log_min_duration_statement = 1000;
   ALTER SYSTEM SET log_checkpoints = on;
   SELECT pg_reload_conf();
   ```

## Backup and Recovery

### Automated Backup Strategy

1. **Database Backups**

   - Daily full backups
   - Hourly WAL shipping
   - 30-day retention policy
   - Geographic redundancy

2. **Application Backups**

   - Code repository (Git)
   - Configuration files
   - SSL certificates
   - Log files

3. **Recovery Procedures**

   ```bash
   # Database recovery
   psql $DATABASE_URL < backup_file.sql

   # Application recovery
   cp -r /home/ubuntu/backups/backup_TIMESTAMP /home/ubuntu/investnaija
   cd /home/ubuntu/investnaija
   pm2 restart all
   ```

## Performance Optimization

### Application Performance

1. **Enable Gzip Compression**

   ```nginx
   gzip on;
   gzip_vary on;
   gzip_min_length 1024;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   ```

2. **Database Optimization**

   ```sql
   -- Create indexes for common queries
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_transactions_user_id_created_at ON transactions(user_id, created_at);
   CREATE INDEX idx_wallets_user_id ON wallets(user_id);

   -- Analyze and vacuum
   ANALYZE;
   VACUUM;
   ```

3. **Redis Caching**

   ```typescript
   // Cache frequently accessed data
   const cacheKey = `user:${userId}:wallet`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);

   const wallet = await getUserWallet(userId);
   await redis.setex(cacheKey, 300, JSON.stringify(wallet)); // 5 min cache
   return wallet;
   ```

### CDN Configuration

```javascript
// Use CDN for static assets
const CDN_URL = "https://cdn.investnaija.com";

// Configure in build process
module.exports = {
  build: {
    publicPath: process.env.NODE_ENV === "production" ? CDN_URL : "/",
  },
};
```

## Compliance and Legal

### Data Protection (NDPR)

1. **Data Encryption**

   - Encrypt sensitive data at rest
   - Use TLS 1.3 for data in transit
   - Implement field-level encryption for PII

2. **Access Controls**

   - Role-based access control (RBAC)
   - Multi-factor authentication for admin accounts
   - Audit logging for data access

3. **Data Retention**
   - Implement data retention policies
   - Automated data purging
   - User data export/deletion capabilities

### Financial Regulations (CBN)

1. **Transaction Monitoring**

   - Implement AML monitoring
   - Suspicious transaction reporting
   - Transaction limits and controls

2. **Audit Trail**
   - Complete transaction history
   - Immutable audit logs
   - Regular compliance reporting

### Security Compliance

1. **Regular Security Audits**

   - Quarterly penetration testing
   - Code security reviews
   - Dependency vulnerability scans

2. **Incident Response**
   - 24/7 monitoring and alerting
   - Incident response procedures
   - Communication protocols

## Maintenance and Updates

### Regular Maintenance Tasks

1. **Weekly Tasks**

   - Security updates
   - Log review
   - Performance monitoring
   - Backup verification

2. **Monthly Tasks**

   - Database maintenance
   - SSL certificate renewal check
   - Security audit
   - Performance optimization

3. **Quarterly Tasks**
   - Full security audit
   - Disaster recovery testing
   - Infrastructure review
   - Compliance audit

### Update Procedures

1. **Security Updates**

   - Immediate deployment for critical security patches
   - Scheduled deployment for regular updates
   - Rollback procedures in place

2. **Feature Updates**
   - Staged deployment (staging → production)
   - Feature flags for gradual rollout
   - A/B testing for new features

---

This deployment guide ensures a secure, scalable, and compliant production environment for InvestNaija. Regular review and updates of these procedures are essential as the platform grows and regulatory requirements evolve.
