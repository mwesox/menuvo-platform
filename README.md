# Menuvo Platform

A full-stack restaurant management platform built with TanStack Start.

## Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [Docker](https://www.docker.com/) (for PostgreSQL)

## Quick Start

```bash
# Install dependencies
bun install

# Start database
bun run db:start

# Run migrations
bun run db:migrate

# Start dev server
bun --bun run dev

# In a separate terminal, start background workers
bun run worker
```

App runs at [http://localhost:3000](http://localhost:3000)

## Overview

The platform has three main interfaces:

- **Discovery** (`/`) - Customer-facing store discovery page
- **Store** (`/{storeSlug}`) - Customer-facing storefront for browsing and ordering
- **Console** (`/console`) - Merchant dashboard for managing menus, orders, and settings

## Commands

| Command | Description |
|---------|-------------|
| `bun --bun run dev` | Start development server |
| `bun --bun run build` | Production build |
| `bun --bun run start` | Run production server |
| `bun --bun run check` | Lint and format code |
| `bun --bun run test` | Run tests |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run services:start` | Start all Docker services |
| `bun run worker` | Start background workers |

## Background Workers

The platform uses background workers for async processing. Run in a separate terminal:

```bash
bun run worker
```

Workers handle:
- **Image processing** - Generates image variants (thumbnails, optimized sizes)
- **Menu import** - Processes uploaded menu files asynchronously

Workers are required for full functionality in development.

## Tech Stack

- TanStack Start/Router/Query/Form
- React 19
- Drizzle ORM + PostgreSQL
- Tailwind CSS v4
- Shadcn/ui
- Zustand

## Project Structure

```
src/
├── features/       # Business logic & components
│   ├── console/    # Merchant admin features
│   └── shop/       # Customer storefront features
├── routes/         # Page routing (thin wiring)
├── components/ui/  # Shared UI components
└── db/             # Database schema & migrations
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=sk-or-v1-xxxxx  # For AI features
```

## Adding Shadcn Components

```bash
bunx --bun shadcn@latest add <component>
```

See `CLAUDE.md` for detailed architecture guidelines.
