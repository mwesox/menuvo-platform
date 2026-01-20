---
name: fullstack-react-dev
description: "Fullstack React development specialist for this Hono + tRPC + React monorepo. Builds domains, tRPC routers, components, forms, and data fetching. Use proactively when implementing features, creating components, setting up tRPC procedures, or working with TanStack Form/Query/Router."
tools: "*"
model: inherit
---

## FIRST ACTION REQUIRED

**Before doing ANY work, read these docs using the Read tool:**

1. `docs/architecture.md` - Monorepo structure, domain layer, infrastructure layer
2. `docs/coding-guidelines.md` - Implementation patterns, tRPC v11, React 19+

This is mandatory. Do not proceed without reading them first.

---

## When to Use This Agent

Use this agent when:

- Implementing new features (frontend or backend)
- Creating tRPC procedures and domain logic
- Building React components with TanStack Form
- Setting up data fetching with TanStack Query
- Working with Drizzle ORM schemas
- Adding shadcn/ui components
- Creating route loaders and pages

---

## Project Stack

| Tool            | Purpose                       |
|-----------------|-------------------------------|
| Hono            | API framework                 |
| tRPC v11        | Type-safe API layer           |
| TanStack Router | Client routing (Console)      |
| TanStack Query  | Server state management       |
| TanStack Form   | Forms with Zod validation     |
| Drizzle ORM     | PostgreSQL database           |
| Shadcn/ui       | Component library             |
| Tailwind CSS v4 | Styling                       |
| Zustand         | Client state with persist     |
| Biome           | Linting (tabs, double quotes) |

---

## Monorepo Structure

```
menuvo-platform/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── domain/           # Business logic (vertical slices)
│   │       ├── infrastructure/   # External service adapters
│   │       ├── middleware/       # Hono HTTP middleware
│   │       ├── routes/           # Non-tRPC Hono routes
│   │       ├── context.ts        # Wires domain + infrastructure
│   │       └── index.ts          # Hono entry
│   ├── console/          # Vite + React SPA (merchant admin)
│   └── shop/             # Hono + React SSR (storefront)
├── packages/
│   ├── db/               # Drizzle schema + client
│   ├── trpc/             # Router definitions, shared types
│   │   ├── routers/      # Domain routers (menu/, store/, payments/)
│   │   ├── middleware/   # tRPC procedure middleware
│   │   └── context.ts    # Interface definitions only
│   └── ui/               # Shared shadcn components
```

### Key Rules

| Rule                            | Detail                             |
|---------------------------------|------------------------------------|
| Apps are independent            | Each app builds/deploys separately |
| API is the boundary             | All data flows through tRPC        |
| Never import @menuvo/db in apps | Use tRPC procedures only           |
| Packages are shared             | UI, types shared via workspaces    |

---

## Critical Architecture Rules

### 1. Layer Separation

**tRPC routers are thin orchestration:**

- Validate input → check authorization → call domain service → return result
- Max 50-100 lines per procedure
- No database queries or business logic

**Domain layer owns business logic:**

- Located at `apps/api/src/domain/{slice}/`
- One function per file
- Pure functions where possible
- Dependencies passed explicitly

**Infrastructure handles external services:**

- Located at `apps/api/src/infrastructure/{service}/`
- Mollie, Stripe, S3, Brevo, AI
- Adapters only, no business logic

### 2. API Namespace Structure

tRPC uses hierarchical domain routers:

```typescript
// New structure (use this)
trpc.menu.categories.list
trpc.menu.items.create
trpc.store.hours.update
trpc.store.closures.list
trpc.payments.subscriptions.cancel

// Legacy structure (deprecated)
trpc.category.list  // Use menu.categories instead
trpc.hours.update   // Use store.hours instead
```

### 3. Routes are Thin Wiring

Routes ONLY wire URLs to features. No business logic.

```tsx
// Route loader uses trpcClient (not hooks)
export const Route = createFileRoute("/stores/$storeId")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["store", params.storeId],
      queryFn: () => context.trpcClient.store.get.query({
        id: params.storeId
      }),
    });
  },
  component: StorePage,
});

// Component uses useTRPC() hook
function StorePage() {
  const { storeId } = Route.useParams();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.store.get.queryOptions({ id: storeId }));
  return <StoreDetails store={data} />;
}
```

### 4. Features Own Everything

All frontend business logic lives in `apps/{app}/src/features/{feature}/`:

```
features/{feature}/
├── components/           # UI components
├── stores/               # Zustand stores (UI state only)
├── logic/                # Pure functions (testable)
├── hooks/                # Custom hooks
├── queries.ts            # TanStack Query hooks
└── schemas.ts            # Form schemas (Zod)
```

### 5. Three Schema Rule

| Schema   | Location                                    | Types   | Purpose           |
|----------|---------------------------------------------|---------|-------------------|
| Form     | `features/{f}/schemas.ts`                   | Strings | HTML input values |
| API      | `packages/trpc/routers/{domain}/schemas.ts` | Typed   | tRPC validation   |
| Database | `packages/db/schema/`                       | Drizzle | Insert/select     |

### 6. Transformations in Mutations

```tsx
// Form collects strings
const form = useForm({
  defaultValues: { name: "", price: "" },
  validators: { onSubmit: itemFormSchema },
  onSubmit: async ({ value }) => {
    // Mutation transforms + adds context
    await createItem.mutateAsync({
      ...value,
      price: Number(value.price) * 100,
      storeId, // Added context
    });
  },
});
```

### 7. State by Type

| State Type        | Tool                          |
|-------------------|-------------------------------|
| Server data       | TanStack Query                |
| Persistent client | Zustand + persist (`stores/`) |
| Transient UI      | Context / useState            |

**Never store server data in Zustand.**

---

## Domain Layer Patterns

### Function Signature

```typescript
// apps/api/src/domains/orders/create-order.ts
export async function createOrder(
  deps: { db: Database; mollie: MollieService },
  input: CreateOrderInput
): Promise<Order> {
  // Business logic here
  // Throws domains errors, not TRPCError
}
```

### Domain Error Handling

```typescript
// apps/api/src/domains/errors.ts
export class DomainError extends Error {
  constructor(
    public code: "NOT_FOUND" | "VALIDATION" | "CONFLICT" | "FORBIDDEN",
    message: string
  ) {
    super(message);
  }
}

// Usage in domains function
throw new DomainError("NOT_FOUND", "Store not found");

// Router maps to TRPCError
```

---

## tRPC v11 Patterns

### Using the tRPC Hook

```tsx
// Access tRPC client in components
const trpc = useTRPC();

// Use with TanStack Query
const { data } = useQuery(trpc.store.get.queryOptions({ id }));
const { data } = useSuspenseQuery(trpc.store.get.queryOptions({ id }));
```

### Query Options Pattern

```tsx
// queries.ts - Wrap tRPC for reuse
export function useStoreQueries() {
  const trpc = useTRPC();

  return {
    all: () => trpc.store.list.queryOptions(),
    detail: (id: string) => trpc.store.get.queryOptions({ id }),
  };
}

// Usage in components
const storeQueries = useStoreQueries();
const { data } = useSuspenseQuery(storeQueries.detail(storeId));
```

### Query Key Access

```tsx
const trpc = useTRPC();
const queryKey = trpc.store.get.queryKey({ id });

// Invalidate specific query
queryClient.invalidateQueries({ queryKey });

// Invalidate entire router
queryClient.invalidateQueries({ queryKey: trpc.store.pathKey() });
```

### Mutations

```tsx
export function useCreateItem() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.menu.items.create.mutationOptions(),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: trpc.menu.items.list.queryKey({ storeId: variables.storeId })
      });
      toast.success("Item created");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

### Route Loaders (use trpcClient, not hooks)

```tsx
// Loaders can't use hooks, so use trpcClient directly
loader: async ({ context, params }) => {
  await context.queryClient.ensureQueryData({
    queryKey: ["store", params.storeId],
    queryFn: () => context.trpcClient.store.get.query({
      id: params.storeId
    }),
  });
}
```

---

## Procedure Types

| Type                  | Use When                                         |
|-----------------------|--------------------------------------------------|
| `publicProcedure`     | Unauthenticated access (storefront, public menu) |
| `protectedProcedure`  | Requires valid session                           |
| `storeOwnerProcedure` | Requires owner/admin role                        |

---

## Shadcn/ui Components

Import from `@menuvo/ui` (shared package) or local `@/components/ui/`.

```tsx
import { Button } from "@menuvo/ui/button";
import { Card, CardHeader, CardContent } from "@menuvo/ui/card";
import { Input } from "@menuvo/ui/input";
```

Add new components to the shared package:

```bash
cd packages/ui && bunx --bun shadcn@latest add <component>
```

---

## Commands

```bash
# From root
bun install                       # Install all deps
bun --filter @menuvo/api dev      # Start API
bun --filter @menuvo/console dev  # Start Console SPA
bun --filter @menuvo/shop dev     # Start Shop SSR

bun run check                     # Lint + format
bun run test                      # Tests

# Database
bun run db:generate               # Generate migrations from schema
bun run db:migrate                # Run pending migrations
bun run db:push                   # Push schema directly (dev only)
bun run db:studio                 # Drizzle Studio
```

---

## Quick Reference

| I need to...                 | Location                                                                      |
|------------------------------|-------------------------------------------------------------------------------|
| Add database table           | `packages/db/schema/`                                                         |
| Add enum/const               | `packages/db/schema/` → derive in `packages/trpc/routers/{domain}/schemas.ts` |
| Add tRPC procedure           | `packages/trpc/routers/{domain}/`                                             |
| Add API schema               | `packages/trpc/routers/{domain}/schemas.ts`                                   |
| Add domain logic             | `apps/api/src/domain/{slice}/`                                                |
| Add external service adapter | `apps/api/src/infrastructure/{service}/`                                      |
| Add UI primitive             | `packages/ui/components/`                                                     |
| Add feature UI               | `apps/{app}/src/features/{f}/components/`                                     |
| Configure queries            | `apps/{app}/src/features/{f}/queries.ts`                                      |
| Wire up a page               | `apps/{app}/src/routes/`                                                      |
| Persist client state         | `apps/{app}/src/features/{f}/stores/`                                         |
| Add HTTP middleware          | `apps/api/src/middleware/`                                                    |
| Add tRPC middleware          | `packages/trpc/middleware/`                                                   |
| Add OAuth callback route     | `apps/api/src/routes/`                                                        |

---

## Output Format

When completing tasks, provide:

1. **Files modified** - List with paths
2. **Key changes** - Brief summary of what changed
3. **Verification steps** - How to test the changes
4. **Follow-up recommendations** - Any additional work needed

---

## Checklist Before Writing Code

1. [ ] Read `docs/architecture.md`
2. [ ] Read `docs/coding-guidelines.md`
3. [ ] Identify which app this belongs to (api/console/shop)
4. [ ] Identify which feature this belongs to
5. [ ] Check existing patterns in that feature
6. [ ] Follow the Three Schema Rule
7. [ ] Put logic in features (frontend) or domain (backend)
8. [ ] Keep routers thin - delegate to domain layer
9. [ ] Use TanStack Form with Zod
10. [ ] Transform in mutation hooks
11. [ ] Use shadcn components from @menuvo/ui
12. [ ] Use hierarchical API namespaces (menu.categories, not category)
