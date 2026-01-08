# Architecture Guide

Structural patterns for the Menuvo monorepo.

---

## Core Principles

1. **Apps are independent** - Each app builds and deploys separately
2. **API is the boundary** - All data flows through tRPC, never direct DB access from apps
3. **Packages are shared** - UI, DB, types shared via Bun workspaces
4. **Type safety end-to-end** - tRPC + Zod + Drizzle
5. **SSR only where needed** - Shop for SEO, Console is pure SPA

---

## Monorepo Structure

```
menuvo-platform/
├── apps/
│   ├── api/              # Hono + tRPC backend
│   ├── console/          # Vite + React SPA (merchant admin)
│   └── shop/             # Hono + React SSR (storefront + discovery)
├── packages/
│   ├── db/               # Drizzle schema + client
│   ├── trpc/             # Router definitions, shared types
│   └── ui/               # Shared shadcn components
└── docs/                 # Documentation
```

---

## Apps

### API (`apps/api`)

Backend server. All business logic lives here.

```
apps/api/
├── src/
│   ├── index.ts              # Entry point, Hono app setup
│   ├── context.ts            # tRPC context creation
│   ├── routers/              # tRPC router mounting
│   │   └── index.ts          # Root router (merges all routers)
│   ├── services/             # Business logic
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   └── session.ts
│   │   ├── payments/
│   │   │   ├── stripe.service.ts
│   │   │   └── mollie.service.ts
│   │   └── storage/
│   │       └── s3.service.ts
│   ├── middleware/           # Hono middleware
│   │   ├── auth.ts           # JWT/session validation
│   │   ├── cors.ts
│   │   └── logging.ts
│   └── lib/                  # Shared utilities
│       └── errors.ts         # Custom error classes
├── package.json
└── tsconfig.json
```

**Responsibilities:**
- Database access (via `@menuvo/db`)
- Authentication & authorization
- File uploads (presigned URLs)
- WebSocket subscriptions
- External service integrations

**Never:** UI components, client-side code

---

### Console (`apps/console`)

Merchant admin dashboard. Pure SPA.

```
apps/console/
├── src/
│   ├── main.tsx              # Entry point
│   ├── router.tsx            # TanStack Router setup
│   ├── routes/               # File-based routes (thin wiring)
│   │   ├── __root.tsx        # Root layout
│   │   ├── index.tsx         # Dashboard
│   │   ├── stores/
│   │   │   ├── index.tsx     # Store list
│   │   │   └── $storeId/
│   │   │       ├── index.tsx
│   │   │       ├── menu.tsx
│   │   │       └── orders.tsx
│   │   └── settings.tsx
│   ├── features/             # Feature modules
│   │   ├── stores/
│   │   ├── menu/
│   │   ├── orders/
│   │   └── settings/
│   ├── components/           # App-specific shared components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── page-container.tsx
│   │   └── common/
│   │       └── data-table.tsx
│   ├── lib/                  # Utilities
│   │   ├── trpc.ts           # tRPC client setup
│   │   └── utils.ts
│   └── styles/
│       └── console.css       # Console theme
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**Responsibilities:**
- Merchant UI for managing stores, menus, orders
- Client-side routing
- Local state management

**Never:** Direct database access, server-side logic

---

### Shop (`apps/shop`)

Customer-facing storefront with SSR for SEO.

```
apps/shop/
├── src/
│   ├── index.ts              # Hono entry point
│   ├── routes/               # Hono routes (SSR)
│   │   ├── index.tsx         # Discovery page
│   │   ├── store.tsx         # /:slug route
│   │   └── checkout.tsx      # Checkout flow
│   ├── pages/                # React page components
│   │   ├── discovery/
│   │   │   └── discovery-page.tsx
│   │   ├── store/
│   │   │   ├── store-page.tsx
│   │   │   ├── menu-page.tsx
│   │   │   └── cart-page.tsx
│   │   └── checkout/
│   │       └── checkout-page.tsx
│   ├── components/           # Shop-specific components
│   │   ├── layout/
│   │   │   ├── store-header.tsx
│   │   │   └── store-footer.tsx
│   │   ├── menu/
│   │   │   ├── menu-item-card.tsx
│   │   │   └── category-nav.tsx
│   │   └── cart/
│   │       ├── cart-drawer.tsx
│   │       └── cart-item.tsx
│   ├── features/             # Client-side features
│   │   └── cart/
│   │       ├── stores/
│   │       │   └── cart.store.ts
│   │       └── hooks/
│   │           └── use-cart.ts
│   ├── lib/
│   │   ├── trpc.ts
│   │   └── hydration.tsx     # React hydration setup
│   └── styles/
│       ├── discovery.css
│       └── shop.css
├── package.json
└── tsconfig.json
```

**Responsibilities:**
- Store pages, menus, ordering flow
- Discovery/landing pages
- SEO optimization via SSR
- Hydration for interactivity

**Never:** Admin functionality, direct database access

---

## Packages

### DB (`packages/db`)

Database schema and client. Single source of truth.

```
packages/db/
├── src/
│   ├── index.ts              # Main exports
│   ├── client.ts             # Database connection
│   ├── schema/               # Drizzle table definitions
│   │   ├── index.ts          # Re-exports all schemas
│   │   ├── auth.ts           # users, sessions
│   │   ├── merchants.ts      # merchants, stores
│   │   ├── menu.ts           # categories, items, modifiers
│   │   ├── orders.ts         # orders, order_items
│   │   └── payments.ts       # transactions, refunds
│   ├── relations.ts          # Drizzle relations
│   └── types.ts              # Exported types
├── drizzle/                  # Migrations
│   └── 0001_initial.sql
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

**Exports:** `db`, `schema`, type helpers

**Used by:** API only (never import in console or shop)

---

### tRPC (`packages/trpc`)

Router definitions and shared types.

```
packages/trpc/
├── src/
│   ├── index.ts              # Main exports (AppRouter type, schemas)
│   ├── trpc.ts               # tRPC init, procedures
│   ├── context.ts            # Context type definition
│   ├── routers/              # Domain routers
│   │   ├── index.ts          # Merged app router
│   │   ├── store.router.ts
│   │   ├── menu.router.ts
│   │   ├── order.router.ts
│   │   └── auth.router.ts
│   ├── schemas/              # Zod schemas for inputs/outputs
│   │   ├── store.schema.ts
│   │   ├── menu.schema.ts
│   │   └── order.schema.ts
│   └── client.ts             # Client factory for apps
├── package.json
└── tsconfig.json
```

**Exports:** `AppRouter` type, input/output schemas, `createTRPCClient`

**Used by:** All apps

---

### UI (`packages/ui`)

Shared shadcn components.

```
packages/ui/
├── src/
│   ├── index.ts              # Main exports
│   ├── components/           # shadcn primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ...
│   └── lib/
│       ├── utils.ts          # cn() helper
│       └── icons.tsx         # Lucide icon re-exports
├── components.json           # shadcn config
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

**Rule:** No business logic. Pure presentational components.

---

## Tech Stack

| Concern | Tool |
|---------|------|
| Runtime | Bun |
| Package Manager | Bun |
| API Framework | Hono |
| Type-safe API | tRPC |
| Client Routing | TanStack Router |
| Server State | TanStack Query |
| Client State | Zustand |
| Forms | TanStack Form + Zod |
| Database | Drizzle ORM + PostgreSQL |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Linting | Biome |
| Testing | Vitest |

---

## Data Flow

```
┌─────────────┐     ┌─────────────┐
│   Console   │     │    Shop     │
│  (Vite SPA) │     │ (Hono SSR)  │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │    tRPC Client    │
       └─────────┬─────────┘
                 │
          ┌──────▼──────┐
          │     API     │
          │ (Hono+tRPC) │
          └──────┬──────┘
                 │
          ┌──────▼──────┐
          │  PostgreSQL │
          └─────────────┘
```

### Request Flow

1. **App** calls tRPC procedure via TanStack Query
2. **tRPC client** sends HTTP request to API
3. **API** validates input with Zod schema
4. **API** executes business logic, queries database
5. **API** returns typed response
6. **App** receives data, updates UI

---

## Feature Structure

Features own their domain. Organized by business capability.

```
apps/console/src/features/menu/
├── components/                 # Feature UI components
│   ├── category-list.tsx
│   ├── category-form.tsx
│   ├── item-card.tsx
│   ├── item-form.tsx
│   ├── item-drawer.tsx
│   └── modifier-group-form.tsx
├── hooks/                      # Custom React hooks
│   ├── use-menu-page-state.ts
│   └── use-drag-reorder.ts
├── stores/                     # Zustand stores (client state)
│   └── menu-editor.store.ts
├── logic/                      # Pure functions (testable)
│   ├── calculate-total.ts
│   ├── validate-modifiers.ts
│   └── sort-categories.ts
├── schemas.ts                  # Form schemas (Zod)
├── queries.ts                  # TanStack Query hooks
├── constants.ts                # Static data
└── types.ts                    # Feature-specific types
```

### File Purposes

| File | Purpose |
|------|---------|
| `components/*.tsx` | Feature UI (forms, lists, cards, drawers) |
| `hooks/*.ts` | UI logic (state machines, drag handling) |
| `stores/*.ts` | Persistent client state (editor state, preferences) |
| `logic/*.ts` | Pure business logic (calculations, validations) |
| `schemas.ts` | Form validation schemas |
| `queries.ts` | Data fetching hooks |
| `constants.ts` | Static values |
| `types.ts` | Feature-specific types |

### Feature Rules

| Rule | Guideline |
|------|-----------|
| One feature per domain | `menu`, `orders`, `stores`, `settings` |
| Components compose `@menuvo/ui` | Don't reimplement primitives |
| Stores for UI state only | Never store server data |
| Logic is pure | No hooks, no side effects |
| Queries wrap tRPC | All data fetching in `queries.ts` |

---

## State Management

| State Type | Tool | Location |
|------------|------|----------|
| Server data | TanStack Query | `queries.ts` |
| Persistent client | Zustand + persist | `stores/` |
| Transient UI | React Context | `contexts/` |
| Component-local | `useState` | Component |

**Rules:**
- Never store server data in Zustand or Context
- Server data sharing = same query key (TanStack Query cache)
- Zustand for cart, preferences, UI state that persists

---

## Schema Separation

Three schema types, three purposes:

| Schema | Location | Types | Purpose |
|--------|----------|-------|---------|
| Form | `features/{f}/schemas.ts` | Strings | HTML input validation |
| API | `packages/trpc/schemas/` | Real types | tRPC input validation |
| Database | `packages/db/schema/` | Column types | Drizzle schema |

### Transformation Flow

```
Form (strings) → Mutation Hook (transforms) → tRPC (validates) → Database
```

| Layer | Responsibility |
|-------|----------------|
| Form | Collect raw input (all strings from HTML) |
| Mutation hook | Transform types, add context IDs |
| tRPC procedure | Validate with Zod, execute business logic |

---

## Route Patterns

### Console (SPA)

Routes are thin wiring. Connect URLs to features.

**Rules:**
- Loaders use `trpcClient` (can't use hooks)
- Components use `useTRPC()` hook
- Match query keys between loader and component
- No business logic in routes

### Shop (SSR)

Hono routes render React to HTML, then hydrate on client.

**Rules:**
- Fetch data server-side before render
- Pass data as props to page components
- Hydrate for client-side interactivity

---

## Theming

Three visual contexts, one theme system.

| Context | Route | Style |
|---------|-------|-------|
| Discovery | `/` | Fresh modern, sans-serif |
| Shop | `/{storeSlug}/*` | Editorial, serif headings |
| Console | `/console/*` | Zinc, professional |

All themes: Light mode only (dark mode deactivated).

---

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Import `@menuvo/db` in apps | Use tRPC procedures |
| Store server data in Zustand | Use TanStack Query |
| Business logic in routes | Extract to features |
| Direct fetch calls | Use tRPC client |
| Inline Zod schemas | Define in schemas.ts or packages/trpc |
| Cross-app imports | Share via packages |

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

## Deployment

Each app deploys independently:

| App | Target | URL |
|-----|--------|-----|
| API | Container/Serverless | `api.menuvo.app` |
| Console | Static CDN | `www.menuvo.app/console` |
| Shop | Edge/Container | `www.menuvo.app/{slug}` |

---

## See Also

- [Coding Guidelines](./coding-guidelines.md) - Implementation patterns with code examples
