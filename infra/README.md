# Menuvo Platform Infrastructure

Production infrastructure for the Menuvo Platform running on Hetzner VPS.

## Architecture Overview

```
                                    ┌─────────────────────────────────────────────┐
                                    │              Hetzner VPS (8GB)              │
                                    │                                             │
    ┌──────────────┐                │  ┌─────────────────────────────────────┐   │
    │   Internet   │───────────────────│  Caddy (Reverse Proxy + TLS)        │   │
    └──────────────┘                │  │  - menuvo.app                       │   │
                                    │  │  - console.menuvo.app              │   │
                                    │  │  - monitor.menuvo.app              │   │
                                    │  │  - status.menuvo.app               │   │
                                    │  └──────────────┬──────────────────────┘   │
                                    │                 │                           │
                                    │     ┌───────────┴───────────┐               │
                                    │     │                       │               │
                                    │  ┌──▼──────────┐  ┌─────────▼────────┐     │
                                    │  │ Platform A  │  │  Platform B      │     │
                                    │  │ (Bun)       │  │  (Bun)           │     │
                                    │  └──────┬──────┘  └────────┬─────────┘     │
                                    │         │                  │               │
                                    │     ┌───┴──────────────────┴───┐           │
                                    │     │                          │           │
                                    │  ┌──▼──────────┐  ┌────────────▼──┐       │
                                    │  │ PostgreSQL  │  │    Redis       │       │
                                    │  │ (18-alpine) │  │  (8-alpine)    │       │
                                    │  └─────────────┘  └───────────────┘       │
                                    │                                             │
                                    │  ┌───────────────┐  ┌───────────────┐      │
                                    │  │ Postgres      │  │   Beszel       │      │
                                    │  │ Backups (S3)  │  │ (Monitoring)   │      │
                                    │  └───────────────┘  └───────────────┘      │
                                    │  ┌───────────────┐                        │
                                    │  │   Gatus       │                        │
                                    │  │ (Uptime)      │                        │
                                    │  └───────────────┘                        │
                                    └─────────────────────────────────────────────┘
```

## Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **platform-a** | `ghcr.io/mwesox/menuvo-platform` | 3000 | TanStack Start app (Console + Shop) |
| **platform-b** | `ghcr.io/mwesox/menuvo-platform` | 3000 | Second app instance for rolling deploys |
| **worker-images** | `ghcr.io/mwesox/menuvo-platform` | - | Background jobs (image processing) |
| **worker-imports** | `ghcr.io/mwesox/menuvo-platform` | - | Background jobs (AI menu import) |
| **postgres** | `postgres:18-alpine` | 5432 | Primary database |
| **redis** | `redis:8-alpine` | 6379 | Queue & caching |
| **caddy** | Custom build | 80, 443 | Reverse proxy with rate limiting |
| **postgres-backup** | Custom build | - | Nightly `pg_dump` to S3/R2 |
| **gatus** | `twinproduction/gatus` | 8080 | Uptime monitoring + alerts |
| **beszel** | `henrygd/beszel` | 8090 | Monitoring dashboard |
| **beszel-agent** | `henrygd/beszel-agent` | - | Host metrics collector |

## Deployment Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   Push to   │────▶│  CI Workflow │────▶│  Build & Push   │────▶│  Deploy (Rolling)    │
│    main     │     │  (tests/lint)│     │  Docker Image   │     │  + Health Checks     │
└─────────────┘     └──────────────┘     └─────────────────┘     └──────────────────────┘
```

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **build.yml** | PRs + pushes to main | Tests, build, push image, rolling deploy |

## Files

| File | Purpose |
|------|---------|
| `Dockerfile.platform` | Multi-stage build for platform + worker |
| `Dockerfile.caddy` | Custom Caddy with rate limiting plugin |
| `Dockerfile.backup` | Postgres backup image |
| `Caddyfile` | Reverse proxy configuration |
| `docker-compose.yml` | Production stack definition |
| `backup.sh` | Backup script (pg_dump + upload) |
| `backup-entrypoint.sh` | Cron scheduler for backups |
| `gatus.yaml` | Gatus config (uptime + alerts) |

## Deployment

### Automatic Deployment (Recommended)

Deployment is fully automated via GitHub Actions:

1. **Code changes**: Push to `main` triggers:
   - CI runs tests and linting
   - Builds and pushes Docker image tagged by commit SHA
   - Deploy job updates `.env` with the SHA tag
   - Runs database migrations
   - Rolling update of `platform-a` then `platform-b`

2. **Infrastructure changes**: Push to `main` also:
   - Copies updated infra files to the VPS
   - Rebuilds Caddy and backup image
   - Restarts affected services

Rolling deploys assume backward-compatible migrations (expand/contract).

### Manual Deployment

SSH into the VPS and run:

```bash
# Set VERSION to the desired commit SHA tag in /home/deploy/menuvo/.env

# Pull the desired image tag
cd /home/deploy/menuvo
docker compose pull platform-a platform-b worker-images worker-imports

# Run migrations
docker compose run --rm platform-a bunx drizzle-kit migrate

# Rolling update
docker compose up -d platform-a
docker compose up -d platform-b

# Restart workers and backups
docker compose up -d worker-images worker-imports postgres-backup gatus

# Check logs
docker compose logs -f platform-a
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
cat > .env << 'EOF'
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
BESZEL_AGENT_KEY=your_beszel_key
GATUS_TELEGRAM_TOKEN=123456:abcdef
GATUS_TELEGRAM_CHAT_ID=123456789
BACKUP_S3_BUCKET=menuvo-backups
BACKUP_S3_PREFIX=menuvo
BACKUP_S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
BACKUP_S3_REGION=auto
BACKUP_S3_ACCESS_KEY_ID=xxx
BACKUP_S3_SECRET_ACCESS_KEY=xxx
BACKUP_KEEP_DAYS=7
BACKUP_CRON="0 3 * * *"
VERSION=commit_sha_here
EOF
```

### 5. Copy infrastructure files

```bash
# From local machine
scp infra/docker-compose.yml deploy@vps:/home/deploy/menuvo/
scp infra/Caddyfile deploy@vps:/home/deploy/menuvo/
scp infra/Dockerfile.caddy deploy@vps:/home/deploy/menuvo/
scp infra/Dockerfile.backup deploy@vps:/home/deploy/menuvo/
scp infra/backup.sh deploy@vps:/home/deploy/menuvo/
scp infra/backup-entrypoint.sh deploy@vps:/home/deploy/menuvo/
scp infra/gatus.yaml deploy@vps:/home/deploy/menuvo/
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
# Run migrations using the app image
docker compose run --rm platform-a bunx drizzle-kit migrate
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
| `BESZEL_AGENT_KEY` | Beszel agent authentication key |
| `GATUS_TELEGRAM_TOKEN` | Telegram bot token for alerts |
| `GATUS_TELEGRAM_CHAT_ID` | Telegram chat ID for alerts |
| `BACKUP_S3_BUCKET` | Backup bucket name |
| `BACKUP_S3_PREFIX` | Backup prefix/folder |
| `BACKUP_S3_ENDPOINT` | R2/S3 endpoint |
| `BACKUP_S3_REGION` | R2/S3 region |
| `BACKUP_S3_ACCESS_KEY_ID` | Backup access key |
| `BACKUP_S3_SECRET_ACCESS_KEY` | Backup secret key |
| `BACKUP_KEEP_DAYS` | Local backup retention (days) |
| `BACKUP_CRON` | Backup schedule (cron) |

## Backups

Backups run via the `postgres-backup` service:
- Creates a daily `pg_dump` in custom format
- Uploads to R2/S3
- Keeps local backups for `BACKUP_KEEP_DAYS`

Recommended: set a bucket lifecycle policy for remote retention.

Check backup logs:

```bash
docker compose logs -f postgres-backup
```

## Monitoring

### Beszel Dashboard

Access at `https://monitor.menuvo.app`

Shows:
- CPU, memory, disk usage
- Container status
- Network traffic

### Gatus Status Page

Access at `https://status.menuvo.app`

Monitors:
- `/live` (liveness)
- `/health` (readiness)

### Container Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f platform-a

# Last 100 lines
docker compose logs --tail=100 platform-a
```

### Health Checks

```bash
# Check all containers
docker compose ps

# Platform readiness (via Caddy)
curl -s http://localhost/health

# Liveness (via Caddy)
curl -s http://localhost/live

# Database health
docker compose exec postgres pg_isready -U menuvo

# Redis health
docker compose exec redis redis-cli ping
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs platform-a

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
docker compose exec platform-a sh -c 'echo "SELECT 1" | psql $DATABASE_URL'
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
| platform-a | 1 GB | 1.0 |
| platform-b | 1 GB | 1.0 |
| worker-images | 512 MB | 0.5 |
| worker-imports | 768 MB | 0.75 |
| caddy | 512 MB | 0.5 |
| redis | 256 MB | 0.5 |
| postgres-backup | 128 MB | 0.25 |
| gatus | 128 MB | 0.25 |
| beszel | 128 MB | 0.25 |
| beszel-agent | 64 MB | 0.25 |
| **Total** | ~7.5 GB | ~7.0 |

## Rollback

### Rollback to previous image

```bash
# List available tags
docker images ghcr.io/mwesox/menuvo-platform

# Update .env with specific version
VERSION=commit_sha_here

# Rolling restart
docker compose up -d platform-a
docker compose up -d platform-b
docker compose up -d worker-images worker-imports
```

### Restore database

```bash
# Stop application
docker compose stop platform-a platform-b worker-images worker-imports

# Restore from backup
docker compose exec -T postgres pg_restore -U menuvo -d menuvo < backup.dump

# Restart application
docker compose start platform-a platform-b worker-images worker-imports
```
