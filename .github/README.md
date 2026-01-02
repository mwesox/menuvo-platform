# Menuvo Platform

## Local Development

### Prerequisites

- Bun runtime
- Docker (for databases)

### Setup

```bash
# Install dependencies
bun install

# Start development database
bun run db:start
bun run db:push

# Start dev server
bun --bun run dev
```

### Testing

```bash
# Start test database
bun run db:test:start

# Reset test database (required before first run or after schema changes)
bun run db:test:reset

# Run tests
bun --bun run test
```

---

# GitHub Secrets Configuration

## Required Secrets

Go to: **Repository Settings → Secrets and variables → Actions → New repository secret**

### GitHub Container Registry

Uses the built-in `GITHUB_TOKEN` from GitHub Actions for GHCR pushes.

**Image**: `ghcr.io/mwesox/menuvo-platform`

Note: Both platform (web server) and worker (background jobs) use the same image with different commands.

### Database

| Secret | Value | How to get |
|--------|-------|------------|
| `DB_PASSWORD` | Secure password | `openssl rand -base64 32` |

### Auth

| Secret | Value | How to get |
|--------|-------|------------|
| `AUTH_SECRET` | Auth secret | `openssl rand -base64 32` |

### S3/R2 Storage (Cloudflare R2)

| Secret | Value | How to get |
|--------|-------|------------|
| `S3_ENDPOINT` | R2 endpoint URL | Cloudflare Dashboard → R2 → Your bucket → Settings |
| `S3_ACCESS_KEY_ID` | R2 API token | Cloudflare Dashboard → R2 → Manage R2 API tokens |
| `S3_SECRET_ACCESS_KEY` | R2 API secret | Same as above |
| `S3_BUCKET` | Public bucket name | e.g., `menuvo-images` |
| `S3_FILES_BUCKET` | Internal bucket name | e.g., `menuvo-files` |
| `S3_PUBLIC_URL` | Public URL prefix | e.g., `https://images.menuvo.app` |
| `S3_REGION` | Region | `auto` for R2 |

### Stripe

| Secret | Value | How to get |
|--------|-------|------------|
| `STRIPE_SECRET_KEY` | Live secret key | Stripe Dashboard → Developers → API keys |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Live publishable key | Same as above |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe Dashboard → Developers → Webhooks → Your endpoint |
| `STRIPE_WEBHOOK_SECRET_THIN` | Thin webhook secret | (optional) For lightweight webhook handler |

### AI (OpenRouter)

| Secret | Value | How to get |
|--------|-------|------------|
| `OPENROUTER_API_KEY` | API key | OpenRouter Dashboard → API Keys |

### Sentry (Optional)

| Secret | Value | How to get |
|--------|-------|------------|
| `VITE_SENTRY_DSN` | Sentry DSN | Sentry Dashboard → Project Settings → Client Keys |
| `SENTRY_AUTH_TOKEN` | Auth token | Sentry Dashboard → Settings → Auth Tokens |

### Infrastructure

| Secret | Value | How to get |
|--------|-------|------------|
| `BESZEL_AGENT_KEY` | SSH public key | `ssh-keygen -t ed25519 -f beszel-key -N ""` then `cat beszel-key.pub` |
| `GATUS_BASIC_USER` | Gatus basic auth username | e.g., `menuvo` |
| `GATUS_BASIC_PASS_BCRYPT_BASE64` | Gatus basic auth password (bcrypt + base64) | Use `htpasswd` and base64 the hash |
| `GATUS_TELEGRAM_TOKEN` | Telegram bot token | BotFather |
| `GATUS_TELEGRAM_CHAT_ID` | Telegram chat ID | Use your chat ID |
| `BACKUP_S3_BUCKET` | Backup bucket name | e.g., `menuvo-backups` |
| `BACKUP_S3_PREFIX` | Backup prefix/folder | e.g., `menuvo` |
| `BACKUP_S3_ENDPOINT` | R2/S3 endpoint | Cloudflare R2 endpoint URL |
| `BACKUP_S3_REGION` | Region | `auto` for R2 |
| `BACKUP_S3_ACCESS_KEY_ID` | Backup access key | Cloudflare R2 API token |
| `BACKUP_S3_SECRET_ACCESS_KEY` | Backup secret key | Cloudflare R2 API secret |
| `BACKUP_KEEP_DAYS` | Local retention (days) | e.g., `7` |
| `BACKUP_CRON` | Backup schedule | e.g., `0 3 * * *` |

---

## Setup Commands

```bash
# Generate all required secrets
echo "=== DB_PASSWORD ==="
openssl rand -base64 32

echo "=== AUTH_SECRET ==="
openssl rand -base64 32

echo "=== GATUS_BASIC_PASS_BCRYPT_BASE64 ==="
htpasswd -bnBC 9 "" "your_password" | cut -d: -f2 | base64 | tr -d '\n'

echo "=== Beszel Agent Key ==="
ssh-keygen -t ed25519 -f beszel-key -N ""
cat beszel-key.pub
```

---

## Server SSH Setup (Manual Access)

1. Generate SSH key pair (if not exists):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_menuvo -N ""
   ```

2. Add public key to server:
   ```bash
   ssh-copy-id -i ~/.ssh/id_ed25519_menuvo.pub deploy@<SERVER_IP>
   ```

3. Configure SSH to use this key for the server:
   ```bash
   cat >> ~/.ssh/config << 'EOF'
   Host menuvo-production
       HostName <SERVER_IP>
       User deploy
       IdentityFile ~/.ssh/id_ed25519_menuvo
       IdentitiesOnly yes
   EOF
   ```

---

## GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `build.yml` | PRs + pushes to main | Tests, build, push image, rolling deploy |

Deploys are handled by the same workflow after a successful build on main.

---

## Server Directory Structure

```
/home/deploy/menuvo/
├── .env                    # Environment variables (created by deploy workflow)
├── docker-compose.yml      # Production stack
├── Caddyfile               # Reverse proxy config
├── Dockerfile.caddy        # Custom Caddy build
├── Dockerfile.backup       # Postgres backup image
├── backup.sh               # Backup script
├── backup-entrypoint.sh    # Backup cron entrypoint
└── gatus.yaml              # Uptime checks config
```

---

## Manual Deployment

If you need to deploy manually:

```bash
# SSH to server
ssh deploy@<SERVER_IP>

# Navigate to deployment directory
cd /home/deploy/menuvo

# Ensure VERSION is set to the desired commit SHA tag in .env

# Pull latest images
docker compose pull platform-a platform-b worker-images worker-imports

# Restart services
docker compose up -d platform-a platform-b worker-images worker-imports postgres-backup gatus

# Check logs
docker compose logs -f platform-a worker-images
```
