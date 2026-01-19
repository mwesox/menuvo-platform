# Menuvo Platform Infrastructure

Deployment is managed via **Dokploy** - a self-hosted PaaS.

## Dokploy Dashboard

- **URL**: https://admin.menuvo.app
- **VPS**: Hetzner (91.99.96.224)

## Architecture

```
Cloudflare (DNS + CDN)
         │
         ▼
┌─────────────────────────────────────────────┐
│              Hetzner VPS                    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │     Dokploy + Traefik (80/443)      │   │
│  └─────────────────────────────────────┘   │
│                    │                        │
│       ┌────────────┼────────────┐          │
│       ▼            ▼            ▼          │
│   ┌───────┐   ┌─────────┐  ┌────────┐     │
│   │  API  │   │Postgres │  │ Gatus  │     │
│   └───────┘   └─────────┘  └────────┘     │
└─────────────────────────────────────────────┘

SPAs (Cloudflare Pages):
  - menuvo.app (Shop)
  - console.menuvo.app (Console)
  - business.menuvo.app (Business)
```

## Deploying via Dokploy

1. Log in to https://admin.menuvo.app
2. Navigate to Projects → menuvo
3. Services:
    - **menuvo-api**: Docker build from repo root (api.menuvo.app)
    - **menuvo-db**: PostgreSQL 17 database
4. Configure environment variables in the application settings
5. Domains are managed via Traefik with Let's Encrypt SSL

## Environment Variables

Configure these in Dokploy for the API service:

| Variable             | Description                        |
|----------------------|------------------------------------|
| `DATABASE_URL`       | Postgres connection string         |
| `AUTH_SECRET`        | Session encryption key             |
| `ENCRYPTION_KEY`     | OAuth token encryption (32+ chars) |
| `S3_*`               | Cloudflare R2 storage config       |
| `OPENROUTER_API_KEY` | AI service key                     |
| `MOLLIE_*`           | Mollie payment keys                |

## CI/CD

- **CI**: GitHub Actions (`ci.yml`) - runs tests/lint on PRs
- **Pages**: GitHub Actions (`deploy-pages.yml`) - deploys SPAs to Cloudflare
- **API**: Dokploy webhook - auto-deploys on push to main

## Database Migrations

After deploying, run migrations:

```bash
ssh root@91.99.96.224
docker exec $(docker ps -q -f name=menuvo-api) bun run db:migrate
```
