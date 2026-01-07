# CLAUDE.md

## ⚠️ REQUIRED READING

**Before writing ANY code, read these docs:**

1. **`docs/architecture.md`** - Structure & patterns (routes vs features, schemas, state management)
2. **`docs/coding-guidelines.md`** - Implementation patterns (React 19+ hooks, code conventions)

This file is a quick reference. The docs are the source of truth.

---

## Important
- **Domain is `menuvo.app`** - Always use menuvo.app (not menuvo.de) for all URLs
- **No subdomains for app routes** - Use path-based routing:
  - Discovery: `www.menuvo.app/` (root)
  - Store: `www.menuvo.app/{storeSlug}`
  - Console: `www.menuvo.app/console`
  - Only infrastructure uses subdomains: `status.menuvo.app`, `monitor.menuvo.app`
- Use ShadCN MCP server to review latest docs and APIs and docs about ShadCN Components and the framework.
- Never do git reset commands !!! NEVER !!!
- **Middleware files must not have db imports** - Keep `createMiddleware()` in files without `@/db` imports to prevent server code leaking to client bundle (TanStack Start bug).

## Subagent Instructions

All subagents (Task tool) MUST read `docs/architecture.md` and `docs/coding-guidelines.md` before making code changes. This applies to Plan agents, Explore agents, and any agent writing code.

---

## Critical Rules (from architecture.md)

1. **Routes are thin wiring** - Routes connect URLs to features. No business logic, server functions, or complex components in routes.

2. **Features own everything** - Business logic, server functions, components, queries, validation all live in `src/features/{feature}/`

3. **Three Schema Rule** - Every entity has: Form schema (strings), Server schema (typed), Database schema (Drizzle)

4. **Transformations happen in mutation hooks** - Forms collect strings, mutations transform + add context, server validates

5. **State by type**:
   - Server data → TanStack Query
   - Persistent client → Zustand + persist (`stores/`)
   - Transient UI → Context / useState

6. **Never store server data in Zustand or Context**

7. **Share server data via TanStack Query, not context** - When parent layouts need child route data, use the same query key. The child's loader caches data, parent's `useQuery` gets instant cache hit. Don't use context + useEffect (causes hydration mismatch).

---

## Commands

**USE BUN ONLY!**

```bash
bun --bun run dev          # Dev server on port 3000
bun --bun run build        # Production build
bun --bun run check        # Biome lint + format
bun --bun run test         # Vitest tests

# Database (development)
bun run db:generate        # Generate migrations
bun run db:migrate         # Run migrations
bun run db:push            # Push schema
bun run db:studio          # Drizzle Studio

# Database (test)
bun run db:test:start      # Start test postgres container
bun run db:test:reset      # Reset test DB (drop + push schema)
bun run db:test:push       # Push schema to test DB
```

---

## Tech Stack

- **TanStack Start** - Full-stack React framework
- **TanStack Router** - File-based routing (`src/routes/`)
- **TanStack Query** - Server state with SSR
- **TanStack Form** - Forms with Zod validation
- **Drizzle ORM** - PostgreSQL (`src/db/`)
- **Tailwind CSS v4** - Styling
- **Shadcn/ui** - Components (new-york style, zinc base)
- **Zustand** - Client state with persist middleware
- **Biome** - Linting/formatting (tabs, double quotes)

---

## Project Structure

```
src/
├── features/
│   ├── console/              # Merchant admin
│   │   └── {feature}/
│   │       ├── components/
│   │       ├── server/       # *.functions.ts
│   │       ├── stores/       # Zustand stores
│   │       ├── logic/        # Pure functions
│   │       ├── queries.ts
│   │       ├── schemas.ts
│   │       └── constants.ts
│   └── shop/                 # Customer storefront
├── routes/                   # Thin wiring only
├── components/ui/            # Shadcn primitives
└── db/schema.ts              # Database schema
```

---

## Theming

Three themes via CSS bundle swapping:

| Theme | Route | Style |
|-------|-------|-------|
| Discovery | `/` (root) | Fresh modern neutral, sans-serif, light only |
| Shop | `/{storeSlug}/*` | Editorial neutral, serif headings, light only |
| Console | `/console/*` | Zinc, light only (dark mode deactivated) |

Auto-detected by route in `src/routes/__root.tsx`.

CSS files:
- `src/styles/core.css` - Tailwind + theme mappings
- `src/styles/themes/discovery.css`
- `src/styles/themes/shop.css`
- `src/styles/themes/console.css`

---

## Adding Shadcn Components

```bash
bunx --bun shadcn@latest add <component>
```

---

## Quick Reference

| I need to... | Location |
|--------------|----------|
| Add database entity | `src/db/schema.ts` |
| Add server function | `features/{f}/server/*.functions.ts` |
| Add business logic | `features/{f}/logic/*.ts` |
| Configure queries | `features/{f}/queries.ts` |
| Define schemas | `features/{f}/schemas.ts` |
| Define constants | `features/{f}/constants.ts` |
| Build UI component | `features/{f}/components/` |
| Persist client state | `features/{f}/stores/*.ts` |
| Wire up a page | `src/routes/` (thin wiring only) |

---

## Environment Variables

| File | Purpose |
|------|---------|
| `.env.local` | Local dev (git-ignored) |
| `.env.production` | Non-secret prod configs (committed) |
| GitHub Secrets | All secrets |

Validate new vars in `src/env.ts`.
