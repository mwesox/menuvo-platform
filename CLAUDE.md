# CLAUDE.md

## ⚠️ REQUIRED READING

**Before writing ANY code, read these docs:**

1. **`docs/architecture.md`** - Structure & patterns (routes vs features, schemas, state management)
2. **`docs/coding-guidelines.md`** - Implementation patterns (React 19+ hooks, code conventions)

This file is a quick reference. The docs are the source of truth.

---

## Important 
- Use ShadCN MCP server to review latest docs and APIs and docs about ShadCN Components and the framework.


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
│   │       └── validation.ts
│   └── shop/                 # Customer storefront
├── routes/                   # Thin wiring only
├── components/ui/            # Shadcn primitives
└── db/schema.ts              # Database schema
```

---

## Theming

Two themes via `data-theme` attribute:

| Theme | Attribute | Style |
|-------|-----------|-------|
| Console | `data-theme="console"` | Zinc, dark mode support |
| Shop | `data-theme="shop"` | Warm brown/cream, light only |

Auto-detected by hostname/path in `src/lib/theme.ts`.

CSS files:
- `src/styles/base.css` - Tailwind + theme mappings
- `src/styles/themes/console.css`
- `src/styles/themes/shop.css`

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
| Define validation | `features/{f}/validation.ts` |
| Build UI component | `features/{f}/components/` |
| Persist client state | `features/{f}/stores/*.ts` |
| Wire up a page | `src/routes/` (thin wiring only) |
