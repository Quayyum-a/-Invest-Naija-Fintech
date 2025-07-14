# InvestNaija Production Deployment Guide

This guide covers deploying InvestNaija to production using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured (investnaija.com)
- SSL certificates
- Production API keys for:
  - Paystack (payments)
  - SendGrid (emails)
  - Termii (SMS)
  - VerifyMe/Smile Identity (KYC)

## Quick Start

1. **Clone and Configure**

   ```bash
   git clone <repository>
   cd investnaija
   cp .env.production.template .env.production
   ```

2. **Edit Environment Variables**

   ```bash
   nano .env.production
   # Fill in all required values
   ```

3. **Build and Deploy**

   ```bash
   # For production with all services
   docker-compose --profile prod up -d --build

   # For development
   docker-compose --profile dev up --build
   ```

## Environment Configuration

### Required Environment Variables

| Variable              | Description                    | Example                        |
| --------------------- | ------------------------------ | ------------------------------ |
| `JWT_SECRET`          | JWT signing secret (32+ chars) | `your-super-secure-jwt-secret` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key            | `sk_live_...`                  |
| `SENDGRID_API_KEY`    | SendGrid API key               | `SG.abc123...`                 |
| `TERMII_API_KEY`      | Termii SMS API key             | `TL...`                        |

### Optional but Recommended

| Variable       | Description             | Default                      |
| -------------- | ----------------------- | ---------------------------- |
| `REDIS_URL`    | Redis connection string | `redis://redis:6379`         |
| `SENTRY_DSN`   | Error monitoring        | None                         |
| `DATABASE_URL` | Database connection     | `file:./data/investnaija.db` |

## SSL Configuration

1. **Obtain SSL Certificates**

   ```bash
   # Using Let's Encrypt (recommended)
   certbot certonly --webroot -w /var/www/html -d investnaija.com -d www.investnaija.com

   # Copy certificates
   mkdir ssl
   cp /etc/letsencrypt/live/investnaija.com/fullchain.pem ssl/cert.pem
   cp /etc/letsencrypt/live/investnaija.com/privkey.pem ssl/key.pem
   ```

2. **Configure Auto-renewal**
   ```bash
   # Add to crontab
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Production Services

The production stack includes:

- **InvestNaija API** - Main application server
- **Nginx** - Reverse proxy with SSL termination
- **Redis** - Caching and rate limiting
- **SQLite** - Database (upgrade to PostgreSQL for scale)

## Monitoring and Health Checks

### Health Endpoints

- `/health` - Application health status
- `/ready` - Readiness check (Kubernetes)
- `/live` - Liveness check (Kubernetes)
- `/metrics` - Performance metrics

### Docker Health Checks

```bash
# Check container health
docker-compose ps

# View health check logs
docker logs investnaija-investnaija-prod-1
```

## Scaling and Performance

### Horizontal Scaling

```yaml
# docker-compose.yml
investnaija-prod:
  deploy:
    replicas: 3
    resources:
      limits:
        memory: 512M
        cpus: "0.5"
```

### Database Scaling

For high traffic, migrate from SQLite to PostgreSQL:

```yaml
# Add to docker-compose.yml
postgres:
  image: postgres:15
  environment:
    POSTGRES_DB: investnaija
    POSTGRES_USER: investnaija
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  volumes:
    - postgres-data:/var/lib/postgresql/data
```

## Security Considerations

### Network Security

- All traffic encrypted (HTTPS only)
- Rate limiting at Nginx level
- Application-level rate limiting
- Fraud detection middleware

### Data Security

- JWT tokens with secure secrets
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection protection

### API Security

- Helmet.js security headers
- CORS configuration
- Request size limits
- Authentication required for sensitive endpoints

## Backup and Recovery

### Database Backup

```bash
# SQLite backup
docker exec investnaija-investnaija-prod-1 sqlite3 /app/data/investnaija.db ".backup /app/data/backup.db"

# Copy backup
docker cp investnaija-investnaija-prod-1:/app/data/backup.db ./backup-$(date +%Y%m%d).db
```

### Automated Backups

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker exec investnaija-investnaija-prod-1 sqlite3 /app/data/investnaija.db ".backup /app/data/backup_$DATE.db"
docker cp investnaija-investnaija-prod-1:/app/data/backup_$DATE.db ./backups/
```

## Troubleshooting

### Common Issues

1. **Container Won't Start**

   ```bash
   docker-compose logs investnaija-prod
   ```

2. **SSL Certificate Issues**

   ```bash
   # Check certificate validity
   openssl x509 -in ssl/cert.pem -text -noout
   ```

3. **Database Connection Issues**
   ```bash
   # Check database file permissions
   docker exec investnaija-investnaija-prod-1 ls -la /app/data/
   ```

### Performance Issues

1. **High Memory Usage**

   ```bash
   # Check memory usage
   docker stats

   # Restart containers
   docker-compose restart
   ```

2. **Slow API Responses**
   ```bash
   # Check metrics endpoint
   curl https://investnaija.com/metrics
   ```

## Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Paystack webhook configured
- [ ] Email templates tested
- [ ] SMS provider tested
- [ ] KYC provider tested
- [ ] Backup system configured
- [ ] Monitoring alerts configured
- [ ] Security scan completed

## Support

For production support:

- Check logs: `docker-compose logs`
- Monitor health: `curl https://investnaija.com/health`
- Review metrics: `curl https://investnaija.com/metrics`

## Update Deployment

```bash
# Pull latest changes
git pull origin main

# Rebuild and deploy
docker-compose --profile prod up -d --build

# Check status
docker-compose ps
```
