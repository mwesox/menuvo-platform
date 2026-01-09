# Menuvo Platform Infrastructure

Production infrastructure for the Menuvo Platform - a multi-app monorepo with distributed deployment.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              Cloudflare (CDN + DNS)                                 │
│                                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                     │
│  │  menuvo.app     │  │ console.menuvo  │  │ business.menuvo │                     │
│  │  (Shop SPA)     │  │    .app         │  │     .app        │                     │
│  │                 │  │  (Console SPA)  │  │ (Business SPA)  │                     │
│  │ Cloudflare      │  │                 │  │                 │                     │
│  │ Pages           │  │ Cloudflare      │  │ Cloudflare      │                     │
│  └────────┬────────┘  │ Pages           │  │ Pages           │                     │
│           │           └────────┬────────┘  └────────┬────────┘                     │
│           │                    │                    │                               │
│           └────────────────────┼────────────────────┘                               │
│                                │                                                    │
│                                ▼                                                    │
│                    ┌───────────────────────┐                                        │
│                    │   api.menuvo.app      │                                        │
│                    │   (proxied to VPS)    │                                        │
│                    └───────────┬───────────┘                                        │
└────────────────────────────────┼────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                           Hetzner VPS (8GB RAM)                                    │
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                    Caddy (Reverse Proxy + TLS)                             │   │
│  │  - api.menuvo.app      → API instances (load balanced)                     │   │
│  │  - status.menuvo.app   → Gatus                                             │   │
│  │  - monitor.menuvo.app  → Beszel                                            │   │
│  └───────────────────────────────┬────────────────────────────────────────────┘   │
│                                  │                                                 │
│                    ┌─────────────┴─────────────┐                                   │
│                    │                           │                                   │
│               ┌────▼─────┐              ┌──────▼────┐                              │
│               │  API-A   │              │   API-B   │                              │
│               │  (Hono)  │              │  (Hono)   │                              │
│               └────┬─────┘              └─────┬─────┘                              │
│                    │                          │                                    │
│               ┌────┴──────────────────────────┴────┐                               │
│               │                                    │                               │
│          ┌────▼─────┐                      ┌───────▼───────┐                       │
│          │PostgreSQL│                      │    Redis      │                       │
│          │(18-alpine)│                      │  (8-alpine)   │                       │
│          └──────────┘                      └───────────────┘                       │
│                                                                                    │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                          │
│  │ Postgres      │  │   Gatus       │  │   Beszel      │                          │
│  │ Backups (R2)  │  │ (Uptime)      │  │ (Monitoring)  │                          │
│  └───────────────┘  └───────────────┘  └───────────────┘                          │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## Services

### Cloudflare Pages (SPAs)

| App | Domain | Pages Project | Description |
|-----|--------|---------------|-------------|
| **Shop** | `menuvo.app` | `menuvo-shop` | Customer storefront |
| **Console** | `console.menuvo.app` | `menuvo-console` | Merchant dashboard |
| **Business** | `business.menuvo.app` | `menuvo-business-site` | Landing/marketing |

### Hetzner VPS (API + Infrastructure)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| **api-a** | `ghcr.io/mwesox/menuvo-api` | 3000 | Hono + tRPC API |
| **api-b** | `ghcr.io/mwesox/menuvo-api` | 3000 | API instance for rolling deploys |
| **postgres** | `postgres:18-alpine` | 5432 | Primary database |
| **redis** | `redis:8-alpine` | 6379 | Caching & queues |
| **caddy** | Custom build | 80, 443 | Reverse proxy with rate limiting |
| **postgres-backup** | Custom build | - | Nightly backups to R2 |
| **gatus** | `twinproduction/gatus` | 8080 | Uptime monitoring |
| **beszel** | `henrygd/beszel` | 8090 | Host monitoring |
| **beszel-agent** | `henrygd/beszel-agent` | - | Metrics collector |

## Deployment Flow

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│                              GitHub Actions Workflows                              │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  Push to main                                                                      │
│       │                                                                            │
│       ├───────────────────────────────────────────────────────────────┐            │
│       │                                                               │            │
│       ▼                                                               ▼            │
│  ┌─────────────┐                                            ┌─────────────────┐   │
│  │   ci.yml    │                                            │ deploy-pages.yml│   │
│  │ (all pushes)│                                            │ (SPA changes)   │   │
│  └──────┬──────┘                                            └────────┬────────┘   │
│         │                                                            │            │
│         ▼                                                            ▼            │
│  ┌─────────────┐                                            ┌─────────────────┐   │
│  │    Lint     │                                            │  Build Console  │   │
│  │  TypeCheck  │                                            │  Build Shop     │   │
│  │   Tests     │                                            │  Build Business │   │
│  └─────────────┘                                            └────────┬────────┘   │
│                                                                      │            │
│  Push to main (API changes)                                          ▼            │
│       │                                                     ┌─────────────────┐   │
│       ▼                                                     │ Deploy to       │   │
│  ┌───────────────┐                                          │ Cloudflare      │   │
│  │deploy-api.yml │                                          │ Pages           │   │
│  └───────┬───────┘                                          └─────────────────┘   │
│          │                                                                        │
│          ▼                                                                        │
│  ┌─────────────────┐     ┌──────────────────┐     ┌────────────────────────────┐ │
│  │  Build & Push   │────▶│  Run Migrations  │────▶│  Rolling Deploy (API)     │ │
│  │  Docker Image   │     │                  │     │  api-a → api-b            │ │
│  └─────────────────┘     └──────────────────┘     └────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **ci.yml** | All PRs + pushes | Lint, typecheck, tests |
| **deploy-api.yml** | Push to main (API/infra changes) | Build API image, deploy to VPS |
| **deploy-pages.yml** | Push to main (SPA changes) | Build and deploy to Cloudflare Pages |

## Files

| File | Purpose |
|------|---------|
| `Dockerfile.api` | API server image (Hono + tRPC) |
| `Dockerfile.caddy` | Custom Caddy with rate limiting |
| `Dockerfile.backup` | Postgres backup image |
| `Caddyfile` | Reverse proxy configuration |
| `docker-compose.yml` | Production stack |
| `backup.sh` | Backup script |
| `backup-entrypoint.sh` | Cron scheduler |
| `gatus.yaml` | Uptime monitoring config |

## Cloudflare Pages Setup

### Prerequisites

1. Cloudflare account with Pages enabled
2. API token with Pages permissions
3. Pages projects created (see names above)

### Wrangler Configuration

Each SPA has a `wrangler.toml` in its directory:

```
apps/
├── console/wrangler.toml  → menuvo-console
├── shop/wrangler.toml     → menuvo-shop
└── business/wrangler.toml → menuvo-business-site
```

### Manual Deployment

```bash
# Deploy specific app
cd apps/console
bun run build
wrangler pages deploy dist --project-name=menuvo-console

# Or deploy all
bun run --filter @menuvo/console build
bun run --filter @menuvo/shop build
bun run --filter @menuvo/business build
```

### Custom Domains

Configure in Cloudflare Dashboard → Pages → Project → Custom domains:

| Project | Custom Domain |
|---------|---------------|
| menuvo-shop | menuvo.app |
| menuvo-console | console.menuvo.app |
| menuvo-business-site | business.menuvo.app |

## VPS Deployment

### Automatic Deployment (Recommended)

Deployment is automated via GitHub Actions when pushing to `main`:

1. **API changes** (`apps/api/**`, `packages/db/**`, `packages/trpc/**`, `infra/**`):
   - Builds and pushes Docker image
   - Runs database migrations
   - Rolling update of `api-a` then `api-b`

2. **Infrastructure changes**: Copies updated files and restarts services

### Manual Deployment

```bash
# SSH into VPS
ssh deploy@vps

# Update .env with VERSION
cd /home/deploy/menuvo
nano .env  # Set VERSION=<commit_sha>

# Pull and deploy
docker compose pull api-a api-b
docker compose run --rm api-a bunx drizzle-kit migrate
docker compose up -d api-a
docker compose up -d api-b
```

## Initial Server Setup

### 1. Create deploy user

```bash
adduser deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
echo "YOUR_PUBLIC_KEY" >> /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

### 2. Configure Docker for GHCR

```bash
echo "GITHUB_PAT" | docker login ghcr.io -u mwesox --password-stdin
```

### 3. Create .env file

```bash
mkdir -p /home/deploy/menuvo
cd /home/deploy/menuvo

cat > .env << 'EOF'
DB_PASSWORD=your_secure_password
AUTH_SECRET=your_auth_secret
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_BUCKET=menuvo-images
S3_FILES_BUCKET=menuvo-files
S3_BASE_URL=https://cdn.menuvo.app
S3_REGION=auto
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_WEBHOOK_SECRET_THIN=whsec_xxx
OPENROUTER_API_KEY=sk-or-xxx
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
MOLLIE_API_KEY=xxx
MOLLIE_TEST_MODE=false
VERSION=latest
EOF
```

### 4. Copy infrastructure files

```bash
scp infra/docker-compose.yml deploy@vps:/home/deploy/menuvo/
scp infra/Caddyfile deploy@vps:/home/deploy/menuvo/
scp infra/Dockerfile.* deploy@vps:/home/deploy/menuvo/
scp infra/backup*.sh deploy@vps:/home/deploy/menuvo/
scp infra/gatus.yaml deploy@vps:/home/deploy/menuvo/
```

### 5. Start services

```bash
cd /home/deploy/menuvo
docker compose up -d postgres redis
docker compose run --rm api-a bunx drizzle-kit migrate
docker compose up -d
```

## GitHub Secrets Required

### For VPS Deployment (deploy-api.yml)

| Secret | Description |
|--------|-------------|
| `DB_PASSWORD` | PostgreSQL password |
| `AUTH_SECRET` | Session encryption key |
| `S3_ENDPOINT` | Cloudflare R2 endpoint |
| `S3_ACCESS_KEY_ID` | R2 access key |
| `S3_SECRET_ACCESS_KEY` | R2 secret key |
| `S3_BUCKET` | Images bucket name |
| `S3_FILES_BUCKET` | Files bucket name |
| `S3_BASE_URL` | CDN URL for images |
| `S3_REGION` | R2 region (usually `auto`) |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_WEBHOOK_SECRET_THIN` | Thin client webhook secret |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI |
| `BESZEL_AGENT_KEY` | Beszel agent key |
| `GATUS_TELEGRAM_TOKEN` | Telegram bot token |
| `GATUS_TELEGRAM_CHAT_ID` | Telegram chat ID |
| `BACKUP_S3_*` | Backup configuration |
| `MOLLIE_API_KEY` | Mollie API key |
| `MOLLIE_TEST_MODE` | Mollie test mode flag |

### For Cloudflare Pages (deploy-pages.yml)

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages write |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key |
| `VITE_SENTRY_DSN` | Sentry DSN |

## Monitoring

### Gatus Status Page

Access at `https://status.menuvo.app`

Monitors:
- API health (`api.menuvo.app/health`)
- API liveness (`api.menuvo.app/live`)
- Shop availability (`menuvo.app`)
- Console availability (`console.menuvo.app`)
- Business availability (`business.menuvo.app`)
- Internal services (Postgres, Redis, Caddy)

### Beszel Dashboard

Access at `https://monitor.menuvo.app`

Shows:
- CPU, memory, disk usage
- Container status
- Network traffic

### Container Logs

```bash
docker compose logs -f api-a
docker compose logs --tail=100 api-a
```

## Resource Allocation (8GB VPS)

| Service | Memory | CPU |
|---------|--------|-----|
| postgres | 3 GB | 2.0 |
| api-a | 1 GB | 1.0 |
| api-b | 1 GB | 1.0 |
| redis | 256 MB | 0.5 |
| caddy | 512 MB | 0.5 |
| postgres-backup | 128 MB | 0.25 |
| gatus | 128 MB | 0.25 |
| beszel | 128 MB | 0.25 |
| beszel-agent | 64 MB | 0.25 |
| **Total** | ~6.2 GB | ~5.75 |

## Rollback

### API Rollback

```bash
# Update .env with previous version
VERSION=previous_commit_sha

# Rolling restart
docker compose up -d api-a
docker compose up -d api-b
```

### Database Rollback

```bash
docker compose stop api-a api-b
docker compose exec -T postgres pg_restore -U menuvo -d menuvo < backup.dump
docker compose start api-a api-b
```

### Pages Rollback

Use Cloudflare Dashboard → Pages → Deployments → Roll back to previous deployment.

## Troubleshooting

### API won't start

```bash
docker compose logs api-a
docker stats
docker compose config
```

### Database connection issues

```bash
docker compose ps postgres
docker compose exec api-a sh -c 'echo "SELECT 1" | psql $DATABASE_URL'
```

### CORS errors

Check that `ORIGIN` environment variable in docker-compose.yml matches your frontend domains.

### Pages deployment fails

```bash
# Check wrangler auth
wrangler whoami

# Manual deploy for debugging
cd apps/console
bun run build
wrangler pages deploy dist --project-name=menuvo-console
```
