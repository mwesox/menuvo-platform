# Menuvo Platform Infrastructure

Deployment is managed via **Coolify** - a self-hosted PaaS.

## Coolify Dashboard

- **URL**: https://coolify.menuvo.app
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
│  │     Coolify + Traefik (80/443)      │   │
│  └─────────────────────────────────────┘   │
│                    │                        │
│       ┌────────────┼────────────┐          │
│       ▼            ▼            ▼          │
│   ┌───────┐   ┌─────────┐  ┌────────┐     │
│   │  API  │   │ Postgres│  │ Gatus  │     │
│   └───────┘   └─────────┘  └────────┘     │
└─────────────────────────────────────────────┘

SPAs (Cloudflare Pages):
  - menuvo.app (Shop)
  - console.menuvo.app (Console)
  - business.menuvo.app (Business)
```

## Deploying via Coolify

1. Log in to https://coolify.menuvo.app
2. Add this repo as a project source
3. Create services:
   - **API**: Docker build from repo root
   - **Postgres**: Managed database
   - **Gatus**: Docker Compose (see gatus.yaml)
4. Configure environment variables
5. Set up domains in Traefik

## Gatus (Uptime Monitoring)

The `gatus.yaml` file configures uptime monitoring for:
- API health endpoints
- Frontend availability
- Database connectivity

Deploy as a Docker Compose service in Coolify using the config in this folder.

## Environment Variables

Configure these in Coolify for the API service:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Session encryption key |
| `S3_*` | Cloudflare R2 storage config |
| `STRIPE_*` | Stripe payment keys |
| `OPENROUTER_API_KEY` | AI service key |
| `MOLLIE_*` | Mollie payment keys |

## CI/CD

- **CI**: GitHub Actions (`ci.yml`) - runs tests/lint on PRs
- **Pages**: GitHub Actions (`deploy-pages.yml`) - deploys SPAs to Cloudflare
- **API**: Coolify webhook - auto-deploys on push to main
