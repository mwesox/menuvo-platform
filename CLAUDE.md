# CLAUDE.md

## Required Reading

Before writing code, read: `docs/architecture.md` and `docs/coding-guidelines.md`

## Rules

- **Domain**: `menuvo.app` (not menuvo.de)
- **Apps never import `@menuvo/db`** - use tRPC
- **Never `git reset`**
- **Use ShadCN MCP** for component docs
- **Subagents must read docs/** before code changes

## Commands

```bash
bun install                      # Install deps
bun run dev                      # All apps (turbo)
bun run check                    # Biome lint + format
bun run test                     # Vitest

# Single app
bun --filter @menuvo/api dev
bun --filter @menuvo/console dev
bun --filter @menuvo/shop dev
bun --filter @menuvo/business dev

# Database
bun run db:generate              # Generate migrations
bun run db:migrate               # Run migrations
bun run db:push                  # Push schema
bun run db:studio                # Drizzle Studio

# Shadcn
cd packages/ui && bunx --bun shadcn@latest add <component>
```

## Structure

```
apps/
  api/        # Hono + tRPC backend
  console/    # Vite SPA - merchant admin
  shop/       # Hono SSR - storefront
  business/   # Vite SPA - landing/marketing
packages/
  db/         # Drizzle schema (API only)
  trpc/       # Routers, schemas (all apps)
  ui/         # shadcn components
```

## Where to Add Things

| Need | Location |
|------|----------|
| DB table/enum | `packages/db/schema/` |
| tRPC procedure | `packages/trpc/routers/` |
| API schema | `packages/trpc/schemas/` |
| UI primitive | `packages/ui/components/` |
| Feature code | `apps/{app}/src/features/{f}/` |
| Business logic | `apps/api/src/services/` |

## Tech

Bun, Hono, tRPC v11, TanStack (Router/Query/Form), Zustand, Drizzle, Tailwind v4, shadcn, Biome, Zod v4

## State

- Server data: TanStack Query
- Persistent client: Zustand + persist
- Transient UI: Context/useState
- Never store server data in Zustand/Context
