# GitHub Secrets Configuration

## Required Secrets

Go to: **Repository Settings → Secrets and variables → Actions → New repository secret**

### Server Access

| Secret | Value | How to get |
|--------|-------|------------|
| `SERVER_HOST` | Server IP | Fixed server IP address |
| `SERVER_SSH_KEY` | Private SSH key | `cat ~/.ssh/id_ed25519` |

### GitHub Container Registry

| Secret | Value | How to get |
|--------|-------|------------|
| `GITHUB_TOKEN` | Personal Access Token | GitHub Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new → Scopes: `write:packages`, `read:packages` |

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
| `WATCHTOWER_TOKEN` | Watchtower API token | `openssl rand -hex 32` |
| `BESZEL_AGENT_KEY` | SSH public key | `ssh-keygen -t ed25519 -f beszel-key -N ""` then `cat beszel-key.pub` |

---

## Setup Commands

```bash
# Generate all required secrets
echo "=== DB_PASSWORD ==="
openssl rand -base64 32

echo "=== AUTH_SECRET ==="
openssl rand -base64 32

echo "=== WATCHTOWER_TOKEN ==="
openssl rand -hex 32

echo "=== Beszel Agent Key ==="
ssh-keygen -t ed25519 -f beszel-key -N ""
cat beszel-key.pub
```

---

## Server SSH Setup

1. Generate SSH key pair (if not exists):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_menuvo -N ""
   ```

2. Add public key to server:
   ```bash
   ssh-copy-id -i ~/.ssh/id_ed25519_menuvo.pub deploy@<SERVER_IP>
   ```

3. Add private key to GitHub secrets as `SERVER_SSH_KEY`:
   ```bash
   cat ~/.ssh/id_ed25519_menuvo
   ```

4. Configure SSH to use this key for the server:
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
| `build-push.yml` | Push to main (src/**, infra/Dockerfile.*) | Build & push Docker images to GHCR |
| `deploy.yml` | Push to main (infra/*) | Deploy to production server |

Both workflows run on push to main branch.

---

## Server Directory Structure

```
/home/deploy/menuvo/
├── .env                    # Environment variables (created by deploy workflow)
├── docker-compose.yml      # Production stack
├── Caddyfile               # Reverse proxy config
└── Dockerfile.caddy        # Custom Caddy build
```

---

## Manual Deployment

If you need to deploy manually:

```bash
# SSH to server
ssh deploy@<SERVER_IP>

# Navigate to deployment directory
cd /home/deploy/menuvo

# Pull latest images
docker compose pull platform worker

# Restart services
docker compose up -d platform worker

# Check logs
docker compose logs -f platform worker
```
