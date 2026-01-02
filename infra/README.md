# Menuvo Platform Infrastructure

Production infrastructure for the Menuvo Platform running on Hetzner VPS.

## Architecture Overview

```
                                    ┌─────────────────────────────────────────────┐
                                    │              Hetzner VPS (8GB)              │
                                    │                                             │
    ┌──────────────┐                │  ┌─────────────────────────────────────┐   │
    │   Internet   │───────────────────│  Caddy (Reverse Proxy + TLS)        │   │
    └──────────────┘                │  │  - menuvo.app (Shop)                │   │
                                    │  │  - console.menuvo.app (Dashboard)   │   │
                                    │  │  - monitor.menuvo.app (Beszel)      │   │
                                    │  └──────────────┬──────────────────────┘   │
                                    │                 │                           │
                                    │     ┌───────────┴───────────┐               │
                                    │     │                       │               │
                                    │  ┌──▼──────────┐  ┌─────────▼────────┐     │
                                    │  │  Platform   │  │     Worker       │     │
                                    │  │  (Bun)      │  │  (Background)    │     │
                                    │  └──────┬──────┘  └────────┬─────────┘     │
                                    │         │                  │               │
                                    │     ┌───┴──────────────────┴───┐           │
                                    │     │                          │           │
                                    │  ┌──▼──────────┐  ┌────────────▼──┐       │
                                    │  │  PostgreSQL │  │     Redis     │       │
                                    │  │  (18-alpine)│  │   (8-alpine)  │       │
                                    │  └─────────────┘  └───────────────┘       │
                                    │                                             │
                                    │  ┌─────────────┐  ┌───────────────┐        │
                                    │  │  Watchtower │  │    Beszel     │        │
                                    │  │  (Auto-pull)│  │  (Monitoring) │        │
                                    │  └─────────────┘  └───────────────┘        │
                                    └─────────────────────────────────────────────┘
```

## Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **platform** | `ghcr.io/mwesox/menuvo-platform` | 3000 | TanStack Start app (Console + Shop) |
| **worker** | `ghcr.io/mwesox/menuvo-platform` | - | Background jobs (image processing, AI menu import) |
| **postgres** | `postgres:18-alpine` | 5432 | Primary database |
| **redis** | `redis:8-alpine` | 6379 | Queue & caching |
| **caddy** | Custom build | 80, 443 | Reverse proxy with rate limiting |
| **watchtower** | `containrrr/watchtower` | 8080 | Auto-pulls new images |
| **beszel** | `henrygd/beszel` | 8090 | Monitoring dashboard |
| **beszel-agent** | `henrygd/beszel-agent` | - | Host metrics collector |

## Deployment Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Push to   │────▶│  CI Workflow │────▶│  Build & Push   │────▶│  Watchtower │
│    main     │     │  (tests/lint)│     │  Docker Image   │     │  Auto-pulls │
└─────────────┘     └──────────────┘     └─────────────────┘     └─────────────┘
                                                                        │
                                                                        ▼
                                                               ┌─────────────────┐
                                                               │  Container      │
                                                               │  Restarts with  │
                                                               │  new image      │
                                                               └─────────────────┘
```

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **ci.yml** | All PRs, pushes to main | Run tests, linting, type checks |
| **build-push.yml** | Push to main (src changes) | Build and push Docker image to GHCR |
| **deploy.yml** | Push to main (infra changes) | Deploy config changes to VPS |

## Files

| File | Purpose |
|------|---------|
| `Dockerfile.platform` | Multi-stage build for platform + worker |
| `Dockerfile.caddy` | Custom Caddy with rate limiting plugin |
| `Caddyfile` | Reverse proxy configuration |
| `docker-compose.yml` | Production stack definition |

## Deployment

### Automatic Deployment (Recommended)

Deployment is fully automated via GitHub Actions:

1. **Code changes**: Push to `main` triggers:
   - CI runs tests and linting
   - If passing, builds Docker image
   - Pushes to `ghcr.io/mwesox/menuvo-platform:latest`
   - Watchtower auto-pulls and restarts containers

2. **Infrastructure changes**: Push to `main` with infra file changes triggers:
   - Copies new config files to VPS
   - Rebuilds Caddy if needed
   - Restarts affected services

### Manual Deployment

SSH into the VPS and run:

```bash
# Pull latest image
cd /home/deploy/menuvo
docker compose pull platform

# Restart services
docker compose up -d platform worker

# Check logs
docker compose logs -f platform
```

### Trigger Watchtower Manually

```bash
curl -H "Authorization: Bearer $WATCHTOWER_TOKEN" \
     http://localhost:8080/v1/update
```

## Initial Server Setup

### 1. Create deploy user

```bash
# On VPS as root
adduser deploy
usermod -aG docker deploy

# Setup SSH key
mkdir -p /home/deploy/.ssh
echo "YOUR_PUBLIC_KEY" >> /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

### 2. Configure Docker for GHCR

```bash
# As deploy user
echo "GITHUB_PAT" | docker login ghcr.io -u mwesox --password-stdin

# Verify config exists (needed by Watchtower)
cat ~/.docker/config.json
```

### 3. Create deployment directory

```bash
mkdir -p /home/deploy/menuvo
cd /home/deploy/menuvo
```

### 4. Create .env file

```bash
cat > .env << EOF
DB_PASSWORD=your_secure_password
AUTH_SECRET=your_auth_secret
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_BUCKET=menuvo-images
S3_FILES_BUCKET=menuvo-files
S3_PUBLIC_URL=https://cdn.menuvo.app
S3_REGION=auto
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_WEBHOOK_SECRET_THIN=whsec_xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
OPENROUTER_API_KEY=sk-or-xxx
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
WATCHTOWER_TOKEN=your_watchtower_token
BESZEL_AGENT_KEY=your_beszel_key
VERSION=latest
EOF
```

### 5. Copy infrastructure files

```bash
# From local machine
scp infra/docker-compose.yml deploy@vps:/home/deploy/menuvo/
scp infra/Caddyfile deploy@vps:/home/deploy/menuvo/
scp infra/Dockerfile.caddy deploy@vps:/home/deploy/menuvo/
```

### 6. Start services

```bash
cd /home/deploy/menuvo

# Start database first
docker compose up -d postgres redis

# Wait for healthy
docker compose ps

# Start application
docker compose up -d

# Check logs
docker compose logs -f
```

### 7. Run database migrations

```bash
# Connect to platform container
docker compose exec platform sh

# Run migrations
bunx drizzle-kit migrate
```

## GitHub Secrets Required

Configure these in GitHub repository settings (Settings > Secrets and variables > Actions):

| Secret | Description |
|--------|-------------|
| `DB_PASSWORD` | PostgreSQL password |
| `AUTH_SECRET` | Session encryption key |
| `S3_ENDPOINT` | Cloudflare R2 endpoint |
| `S3_ACCESS_KEY_ID` | R2 access key |
| `S3_SECRET_ACCESS_KEY` | R2 secret key |
| `S3_BUCKET` | Images bucket name |
| `S3_FILES_BUCKET` | Files bucket name |
| `S3_PUBLIC_URL` | CDN URL for images |
| `S3_REGION` | R2 region (usually `auto`) |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_WEBHOOK_SECRET_THIN` | Thin client webhook secret |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking |
| `SENTRY_AUTH_TOKEN` | Sentry auth token |
| `WATCHTOWER_TOKEN` | Watchtower HTTP API token |
| `BESZEL_AGENT_KEY` | Beszel agent authentication key |

## Monitoring

### Beszel Dashboard

Access at `https://monitor.menuvo.app`

Shows:
- CPU, memory, disk usage
- Container status
- Network traffic

### Container Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f platform

# Last 100 lines
docker compose logs --tail=100 platform
```

### Health Checks

```bash
# Check all containers
docker compose ps

# Platform health
curl -s http://localhost:3000/ | head

# Database health
docker compose exec postgres pg_isready -U menuvo

# Redis health
docker compose exec redis redis-cli ping
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs platform

# Check resource limits
docker stats

# Verify env vars
docker compose config
```

### Database connection issues

```bash
# Check postgres is running
docker compose ps postgres

# Test connection
docker compose exec platform sh -c 'echo "SELECT 1" | psql $DATABASE_URL'
```

### Out of memory

```bash
# Check memory usage
free -h
docker stats --no-stream

# Clear Docker cache
docker system prune -af
```

### SSL certificate issues

```bash
# Check Caddy logs
docker compose logs caddy

# Force certificate renewal
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

## Resource Allocation (8GB VPS)

| Service | Memory | CPU |
|---------|--------|-----|
| postgres | 3 GB | 2.0 |
| platform | 2 GB | 1.5 |
| worker | 1 GB | 1.0 |
| caddy | 512 MB | 0.5 |
| redis | 256 MB | 0.5 |
| watchtower | 128 MB | 0.25 |
| beszel | 128 MB | 0.25 |
| beszel-agent | 64 MB | 0.25 |
| **Total** | ~7 GB | ~6.25 |

## Rollback

### Rollback to previous image

```bash
# List available tags
docker images ghcr.io/mwesox/menuvo-platform

# Update .env with specific version
VERSION=sha-abc1234

# Restart
docker compose up -d platform worker
```

### Restore database

```bash
# Stop application
docker compose stop platform worker

# Restore from backup
docker compose exec -T postgres pg_restore -U menuvo -d menuvo < backup.dump

# Restart application
docker compose start platform worker
```
