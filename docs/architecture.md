# Architecture

Pragmatic structure focused on clear boundaries, vertical slices, and testability.

---

## Guiding Principles

1. **tRPC = API contracts only** - Routers orchestrate, don't implement
2. **Domain-first organization** - Vertical slices by business capability
3. **Infrastructure is pluggable** - External services behind interfaces
4. **Classes with interfaces** - Service facades with explicit contracts
5. **Explicit dependencies** - Constructor injection, no hidden globals

---

## Layer Overview

| Layer               | Location                       | Purpose                                               |
|---------------------|--------------------------------|-------------------------------------------------------|
| **tRPC primitives** | `apps/api/src/trpc/`           | initTRPC, procedures, middleware                      |
| **Domain**          | `apps/api/src/domains/`        | Vertical slices: service + router + types per feature |
| **Infrastructure**  | `apps/api/src/infrastructure/` | Cross-functional adapters (Brevo, S3, AI)             |
| **Routes**          | `apps/api/src/routes/`         | Non-tRPC HTTP endpoints (OAuth callbacks, health)     |

---

## tRPC Layer

**Purpose:** Define API contracts and orchestrate domain services.

**Structure:** Routers live within their domain folders (vertical slice). The main `appRouter` merges all domain
routers.

**Simple domain routers:**

- Single `router.ts` file in `domains/{domain}/router.ts`
- Contains all procedures for that domain
- Example: `domains/auth/router.ts` → `trpc.auth.*`

**Complex domain routers:**

- Parent router in `domains/{domain}/router.ts` merges feature routers
- Feature routers in `domains/{domain}/{feature}/router.ts`
- Parent router exposes features as namespaces
- Example: `domains/menu/router.ts` merges `categories/`, `items/`, `options/` → `trpc.menu.categories.*`,
  `trpc.menu.items.*`, etc.

| File        | Location                               | Purpose                                                                |
|-------------|----------------------------------------|------------------------------------------------------------------------|
| `router.ts` | `domains/{domain}/router.ts`           | Domain-specific procedures (simple) or feature router merger (complex) |
| `router.ts` | `domains/{domain}/{feature}/router.ts` | Feature-specific procedures (complex domains only)                     |
| `appRouter` | `apps/api/src/domains/router.ts`       | Merges all domain routers                                              |

**Router rules:**

- Max 50-100 lines per procedure
- No database queries - call services only
- No business logic calculations
- Pattern: `.input(schema)` → auth check → `ctx.services.{domain}.{method}()` → catch errors → map to TRPCError
- Never access `ctx.db` in routers - use services only
- Use `.output()` for public APIs only
- Routers catch domain errors and map to TRPCError codes

**Procedure types:**

| Procedure             | Use When                                  |
|-----------------------|-------------------------------------------|
| `publicProcedure`     | Unauthenticated (storefront, public menu) |
| `protectedProcedure`  | Requires valid session                    |
| `storeOwnerProcedure` | Requires owner/admin role                 |

**API namespaces:** `trpc.stores.list`, `trpc.menu.categories.create`, `trpc.orders.updateStatus`

---

## Domain Layer

**Purpose:** All business logic. Each domain is a vertical slice containing service, router, and types.

### Domain Structure Patterns

Domains follow one of two patterns depending on complexity:

**Simple Domain Structure** (for straightforward domains):

- Files directly in `domains/{domain}/`: `service.ts`, `router.ts`, `types.ts`, `schemas.ts`, `interface.ts`, `index.ts`
- Examples: `auth/`, `images/`, `merchants/`, `orders/`, `payments/`
- Use when: Domain has a single cohesive responsibility

**Complex Domain Structure** (for domains with multiple features):

- Parent domain folder: `domains/{domain}/` contains `router.ts` (merges feature routers) and optional shared files
- Feature subdirectories: `domains/{domain}/{feature}/` each contain: `service.ts`, `router.ts`, `types.ts`,
  `schemas.ts`, `interface.ts`, `index.ts`
- Examples: `menu/` with features `categories/`, `items/`, `options/`, `translations/`, `import/`
- Examples: `stores/` with features `closures/`, `hours/`, `service-points/`
- Use when: Domain has multiple distinct sub-features that benefit from separation

**When to use each pattern:**

- Use **simple domain** when the domain has a single cohesive responsibility
- Use **complex domain** when the domain has multiple distinct sub-features that benefit from separation

### Service Facade Pattern

**Required structure:**

- All services MUST have interface in `interface.ts` (e.g., `IStoreService`)
- Service class in `service.ts` implements the interface (e.g., `StoreService implements IStoreService`)
- Constructor receives dependencies (typically `db`)
- `DomainServices` class aggregates all services and handles wiring

**Service aggregation:**

- Simple domains: Service exposed directly (e.g., `ctx.services.auth`, `ctx.services.orders`)
- Complex domains: Feature services exposed individually (e.g., `ctx.services.categories`, `ctx.services.items`,
  `ctx.services.closures`, `ctx.services.hours`)
- Parent domain services: Some complex domains also have a parent service (e.g., `ctx.services.stores` for store CRUD)

**Domain services:**

| Service       | Type             | Interface               | Responsibility                              |
|---------------|------------------|-------------------------|---------------------------------------------|
| auth          | Simple           | `IAuthService`          | Session management, auth cookies            |
| images        | Simple           | `IImagesService`        | Upload, delete, variants                    |
| merchants     | Simple           | `IMerchantsService`     | Merchant settings, languages                |
| orders        | Simple           | `IOrderService`         | Order lifecycle, totals, status transitions |
| payments      | Simple           | `IPaymentService`       | Mollie payments, merchant onboarding        |
| stores        | Simple           | `IStoreService`         | Store CRUD, slug management, active toggle  |
| categories    | Feature (menu)   | `ICategoriesService`    | Menu category operations                    |
| items         | Feature (menu)   | `IItemsService`         | Menu item operations                        |
| menuImport    | Feature (menu)   | `IMenuImportService`    | Menu import and processing                  |
| closures      | Feature (stores) | `IClosuresService`      | Store closure period management             |
| hours         | Feature (stores) | `IHoursService`         | Store opening hours management              |
| servicePoints | Feature (stores) | `IServicePointsService` | Service point operations                    |

### Dependency Injection Flow

1. `DomainServices` class receives `db` in constructor
2. Instantiates all service classes (both simple domain services and feature services), passing `db` and other services
   as needed
3. Services can receive other services as dependencies (not just `db`)
4. Exposes services as public readonly properties
5. API context creates single `DomainServices` instance
6. Routers access via `ctx.services.{service}.{method}()` (e.g., `ctx.services.stores.list()`,
   `ctx.services.categories.create()`)

### Domain Function Rules

- One function per file (or closely related functions)
- Explicit dependencies as first parameter
- Returns domain types, not raw DB types
- Throws domain errors (NotFoundError, ValidationError), not TRPCError

### Service Composition

Services MAY depend on other services via constructor injection:

- Reuse existing service methods instead of reimplementing database operations
- Example: `OrderService` can use `StoreService` to validate store status
- `DomainServices` class handles wiring - services receive other services as dependencies
- Keep dependency direction clear: avoid circular dependencies

---

## Error Handling

**Error handling boundary:**

- Domain services throw domain errors (not TRPCError)
- Routers catch domain errors and map to TRPCError codes
- Domain layer throws, router layer maps

**Domain layer throws:**

- `NotFoundError` - Resource doesn't exist
- `ValidationError` - Invalid input data
- `ConflictError` - Duplicate or conflicting state
- `ForbiddenError` - Not authorized

**Router layer:** Maps domain errors to TRPCError codes

---

## Infrastructure Layer

**Purpose:** Cross-functional external adapters used by multiple domains.

| Service | Provider | Used By                     |
|---------|----------|-----------------------------|
| Storage | S3/R2    | images, menu-import         |
| Email   | Brevo    | auth, orders, notifications |
| AI      | OpenAI   | menu-import                 |

**Rules:**

- Only cross-functional services belong here
- Domain-specific adapters live with their domain (e.g., Mollie → `domains/payments/`)
- Configuration via environment variables

**Domain-specific adapters (NOT in infrastructure):**

| Adapter | Location            | Reason                       |
|---------|---------------------|------------------------------|
| Mollie  | `domains/payments/` | Only used by payments domain |

---

## Context Wiring

Context creation is simplified via `DomainServices` class.

**Context (`apps/api/src/context.ts`):**

- Creates single `DomainServices` instance with `db`
- Extracts session from request
- Passes `services` to tRPC procedures
- No manual service wiring needed in routers

**Context structure:**

| Property     | Description                    |
|--------------|--------------------------------|
| `session`    | Extracted from request cookies |
| `services`   | `DomainServices` instance      |
| `resHeaders` | Response headers for cookies   |
| `serverUrl`  | Base URL for OAuth callbacks   |

**Rules:**

- `db` is NOT exposed on context - routers access data through services only
- Routers use `ctx.services.{service}.{method}()` only

---

## File Naming Conventions

**Simple domains:**

- Files directly in `domains/{domain}/`: `service.ts`, `router.ts`, `types.ts`, `schemas.ts`, `interface.ts`, `index.ts`
- Examples: `domains/auth/service.ts`, `domains/orders/router.ts`

**Complex domains:**

- Parent domain: `domains/{domain}/router.ts` (merges feature routers), optional shared files
- Feature subdirectories: `domains/{domain}/{feature}/` with `service.ts`, `router.ts`, `types.ts`, `schemas.ts`,
  `interface.ts`, `index.ts`
- Examples: `domains/menu/categories/service.ts`, `domains/stores/hours/router.ts`

| Type           | Pattern                    | Example (Simple)                      | Example (Complex)                    |
|----------------|----------------------------|---------------------------------------|--------------------------------------|
| Service class  | `service.ts`               | `domains/auth/service.ts`             | `domains/menu/categories/service.ts` |
| Router         | `router.ts`                | `domains/orders/router.ts`            | `domains/stores/hours/router.ts`     |
| Domain types   | `types.ts`                 | `domains/images/types.ts`             | `domains/menu/items/types.ts`        |
| Schemas        | `schemas.ts`               | `domains/payments/schemas.ts`         | `domains/stores/closures/schemas.ts` |
| Interface      | `interface.ts`             | `domains/merchants/interface.ts`      | `domains/menu/options/interface.ts`  |
| Infrastructure | `{name}.ts` or `client.ts` | `infrastructure/storage/s3-client.ts` |

---

## Query Patterns

**Frontend data fetching:**

- Prefer direct `trpc.{router}.{procedure}.queryOptions()` in components
- Only create query helpers (`use{Entity}Queries()`) if query used in 3+ components
- Mutation hooks acceptable for side effects (toast, cache invalidation)
- Avoid wrapping `useQuery(trpc.x.queryOptions())` in hooks - use directly
- Route loaders: use `trpcClient` (no hooks), components: use `useTRPC()`

---

## Anti-Patterns to Avoid

| Don't                                               | Do Instead                              |
|-----------------------------------------------------|-----------------------------------------|
| Business logic in routers                           | Extract to domain service classes       |
| Direct DB queries in routers                        | Call `ctx.services.{domain}.{method}()` |
| `ctx.db` access in routers                          | Use `ctx.services.{service}.{method}()` |
| Manual service wiring in context                    | Use `DomainServices` class              |
| Service classes without interfaces                  | Always define `I{Service}` interface    |
| Monolithic service classes                          | Split into sub-services if > 500 lines  |
| Wrapping `useQuery(trpc.x.queryOptions())` in hooks | Use queryOptions directly               |
| Throwing TRPCError from domain services             | Domain services throw domain errors     |
| Creating hooks for queries used once                | Use queryOptions directly in component  |

---

## Quick Reference

| I need to...                                | Location                                             |
|---------------------------------------------|------------------------------------------------------|
| Add business logic (simple domain)          | `apps/api/src/domains/{domain}/service.ts`           |
| Add business logic (complex domain feature) | `apps/api/src/domains/{domain}/{feature}/service.ts` |
| Add tRPC procedure (simple domain)          | `apps/api/src/domains/{domain}/router.ts`            |
| Add tRPC procedure (complex domain feature) | `apps/api/src/domains/{domain}/{feature}/router.ts`  |
| Merge feature routers (complex domain)      | `apps/api/src/domains/{domain}/router.ts`            |
| Add domain-specific adapter                 | `apps/api/src/domains/{domain}/` (with the domain)   |
| Add cross-functional adapter                | `apps/api/src/infrastructure/{service}/`             |
| Add database table                          | `packages/db/schema/`                                |
| Add HTTP endpoint                           | `apps/api/src/routes/`                               |

**When to create a feature subdirectory:**

- Domain has multiple distinct sub-features (e.g., menu has categories, items, options)
- Feature has its own service, router, and types
- Feature benefits from separation for maintainability

---

## Summary

- **Domain** → Vertical slices: simple domains (flat) or complex domains (feature subdirectories)
- **Simple domains** → Files directly in `domains/{domain}/`: service + router + types
- **Complex domains** → Feature subdirectories `domains/{domain}/{feature}/` with parent router merging feature routers
- **tRPC** → Routers live within domains, thin orchestration, no DB access
- **Infrastructure** → Cross-functional adapters only (Email, Storage, AI)
- **Context** → `DomainServices` class aggregates all services (both simple domain and feature services)
