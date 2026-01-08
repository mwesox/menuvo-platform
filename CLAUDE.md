# CLAUDE.md

## Required Reading

**Before writing ANY code, read these docs:**

1. **`docs/architecture.md`** - Monorepo structure, apps, packages, data flow
2. **`docs/coding-guidelines.md`** - Implementation patterns, tRPC, React 19+

This file is a quick reference. The docs are the source of truth.

---

## Important

- **Domain is `menuvo.app`** - Always use menuvo.app (not menuvo.de) for all URLs
- **Use ShadCN MCP server** - Review latest docs and APIs for shadcn components
- **Never do git reset commands** - NEVER
- **API is the boundary** - Apps never import `@menuvo/db` directly, use tRPC

## Subagent Instructions

All subagents (Task tool) MUST read `docs/architecture.md` and `docs/coding-guidelines.md` before making code changes.

---

## Critical Rules

1. **Apps are independent** - Each app builds and deploys separately

2. **API is the boundary** - All data flows through tRPC. Apps never import `@menuvo/db`

3. **Three Schema Rule** - Form schema (strings), API schema (typed), Database schema (Drizzle)

4. **tRPC v11 patterns**:
   - Use `useTRPC()` hook in components
   - Use `trpcClient` in route loaders
   - Use `queryOptions()` and `mutationOptions()` factories

5. **State by type**:
   - Server data → TanStack Query
   - Persistent client → Zustand + persist
   - Transient UI → Context / useState

6. **Never store server data in Zustand or Context**

---

## Commands

**USE BUN ONLY!**

```bash
# Root commands
bun install                    # Install all workspace deps

# App-specific (from root)
bun --filter @menuvo/api dev   # Start API server
bun --filter @menuvo/console dev  # Start Console SPA
bun --filter @menuvo/shop dev  # Start Shop SSR

# Or from app directory
cd apps/api && bun run dev
cd apps/console && bun run dev
cd apps/shop && bun run dev

# Build
bun run build                  # Build all apps
bun --filter @menuvo/api build # Build specific app

# Quality
bun run check                  # Biome lint + format
bun run test                   # Vitest tests

# Database
bun --filter @menuvo/db generate  # Generate migrations
bun --filter @menuvo/db migrate   # Run migrations
bun --filter @menuvo/db push      # Push schema
bun --filter @menuvo/db studio    # Drizzle Studio
```

---

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

---

## Monorepo Structure

```
menuvo-platform/
├── apps/
│   ├── api/              # Hono + tRPC backend
│   ├── console/          # Vite + React SPA (merchant admin)
│   └── shop/             # Hono + React SSR (storefront)
├── packages/
│   ├── db/               # Drizzle schema + client
│   ├── trpc/             # Router definitions, shared types
│   └── ui/               # Shared shadcn components
└── docs/                 # Documentation
```

### App Structure

```
apps/{app}/src/
├── routes/               # TanStack Router (console) or Hono (shop/api)
├── features/             # Feature modules
│   └── {feature}/
│       ├── components/   # Feature UI
│       ├── hooks/        # Custom hooks
│       ├── stores/       # Zustand stores
│       ├── logic/        # Pure functions
│       ├── queries.ts    # TanStack Query hooks
│       └── schemas.ts    # Form schemas
├── components/           # App-specific components
└── lib/                  # Utilities, trpc client
```

---

## Quick Reference

| I need to... | Location |
|--------------|----------|
| Add database table | `packages/db/schema/` |
| Add tRPC procedure | `packages/trpc/routers/` |
| Add API schema | `packages/trpc/schemas/` |
| Add UI primitive | `packages/ui/components/` |
| Add feature UI | `apps/{app}/src/features/{f}/components/` |
| Add business logic | `apps/api/src/services/` |
| Configure queries | `apps/{app}/src/features/{f}/queries.ts` |
| Wire up a page | `apps/{app}/src/routes/` |
| Persist client state | `apps/{app}/src/features/{f}/stores/` |

---

## Theming

Three visual contexts:

| Context | App | Style |
|---------|-----|-------|
| Discovery | shop | Fresh modern, sans-serif |
| Shop | shop | Editorial, serif headings |
| Console | console | Zinc, professional |

All themes: Light mode only.

---

## Adding Shadcn Components

```bash
# From packages/ui directory
cd packages/ui && bunx --bun shadcn@latest add <component>
```

---

## Environment Variables

| File | Purpose |
|------|---------|
| `.env.local` | Local dev (git-ignored) |
| `.env.production` | Non-secret prod configs |
| GitHub Secrets | All secrets |
