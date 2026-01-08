# Menuvo Platform Monorepo

Turborepo-based monorepo for the Menuvo platform.

## Structure

```
monorepo/
├── apps/
│   ├── api/              # @menuvo/api - Hono + tRPC backend
│   ├── console/          # @menuvo/console - Merchant admin (Vite + React SPA)
│   ├── shop/             # @menuvo/shop - Customer storefront (Vite + React)
│   └── business/         # @menuvo/business - Marketing site (Vite + React)
├── packages/
│   ├── db/               # @menuvo/db - Drizzle schema + client
│   ├── trpc/             # @menuvo/trpc - tRPC routers + shared types
│   └── ui/               # @menuvo/ui - Shared shadcn components
└── docs/                 # Documentation (in parent directory)
```

## Tech Stack

| Concern | Tool |
|---------|------|
| Runtime | Bun |
| API Framework | Hono |
| Type-safe API | tRPC v11 |
| Client Routing | TanStack Router |
| Server State | TanStack Query |
| Client State | Zustand |
| Forms | TanStack Form + Zod |
| Database | Drizzle ORM + PostgreSQL |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Linting | Biome |

## Commands

```bash
# Install dependencies
bun install

# Development
bun run dev                          # Run all apps
bun run dev --filter=@menuvo/api     # Run specific app

# Build
bun run build                        # Build all apps
bun run build --filter=@menuvo/api   # Build specific app

# Quality
bun run check                        # Biome lint + format
bun run check-types                  # TypeScript check

# Database (from packages/db)
bun run generate                     # Generate migrations
bun run migrate                      # Run migrations
bun run push                         # Push schema
bun run studio                       # Drizzle Studio
```

## Architecture

See `../docs/architecture.md` for full documentation.

### Data Flow

```
Console/Shop (React SPA) → tRPC Client → API (Hono + tRPC) → PostgreSQL
```

### Key Principles

1. **Apps are independent** - Each app builds and deploys separately
2. **API is the boundary** - All data flows through tRPC, never direct DB access
3. **Packages are shared** - UI, DB, types shared via Bun workspaces
4. **Type safety end-to-end** - tRPC + Zod + Drizzle
