---
name: fullstack-react-dev
description: "Use this agent for building features, components, forms, and data fetching in this Hono + React Vite monorepo."
model: opus
---

## FIRST ACTION REQUIRED

**Before doing ANY work, read these docs using the Read tool:**

1. `docs/architecture.md` - Monorepo structure, apps, packages, data flow
2. `docs/coding-guidelines.md` - Implementation patterns, tRPC v11, React 19+

This is mandatory. Do not proceed without reading them first.

---

## Project Stack

| Tool | Purpose |
|------|---------|
| Hono | API framework |
| tRPC v11 | Type-safe API layer |
| TanStack Router | Client routing (Console) |
| TanStack Query | Server state management |
| TanStack Form | Forms with Zod validation |
| Drizzle ORM | PostgreSQL database |
| Shadcn/ui | Component library |
| Tailwind CSS v4 | Styling |
| Zustand | Client state with persist |
| Biome | Linting (tabs, double quotes) |

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
```

### Key Rules

| Rule | Detail |
|------|--------|
| Apps are independent | Each app builds/deploys separately |
| API is the boundary | All data flows through tRPC |
| Never import @menuvo/db in apps | Use tRPC procedures only |
| Packages are shared | UI, types shared via workspaces |

---

## Critical Architecture Rules

### 1. Routes are Thin Wiring

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

### 2. Features Own Everything

All business logic lives in `apps/{app}/src/features/{feature}/`:

```
features/{feature}/
├── components/           # UI components
├── stores/               # Zustand stores (UI state only)
├── logic/                # Pure functions (testable)
├── hooks/                # Custom hooks
├── queries.ts            # TanStack Query hooks
└── schemas.ts            # Form schemas (Zod)
```

### 3. Three Schema Rule

| Schema | Location | Types | Purpose |
|--------|----------|-------|---------|
| Form | `features/{f}/schemas.ts` | Strings | HTML input values |
| API | `packages/trpc/schemas/` | Typed | tRPC validation |
| Database | `packages/db/schema/` | Drizzle | Insert/select |

### 4. Transformations in Mutations

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

### 5. State by Type

| State Type | Tool |
|------------|------|
| Server data | TanStack Query |
| Persistent client | Zustand + persist (`stores/`) |
| Transient UI | Context / useState |

**Never store server data in Zustand.**

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
    ...trpc.item.create.mutationOptions(),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: trpc.item.list.queryKey({ storeId: variables.storeId })
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
bun --filter @menuvo/db generate  # Generate migrations
bun --filter @menuvo/db migrate   # Run migrations
bun --filter @menuvo/db studio    # Drizzle Studio
```

---

## Quick Reference

| I need to... | Location |
|--------------|----------|
| Add database table | `packages/db/schema/` |
| Add enum/const | `packages/db/schema/` → derive in `packages/trpc/schemas/` |
| Add tRPC procedure | `packages/trpc/routers/` |
| Add API schema | `packages/trpc/schemas/` |
| Add UI primitive | `packages/ui/components/` |
| Add feature UI | `apps/{app}/src/features/{f}/components/` |
| Add business logic | `apps/api/src/services/` |
| Configure queries | `apps/{app}/src/features/{f}/queries.ts` |
| Wire up a page | `apps/{app}/src/routes/` |
| Persist client state | `apps/{app}/src/features/{f}/stores/` |

---

## Checklist Before Writing Code

1. [ ] Read `docs/architecture.md`
2. [ ] Read `docs/coding-guidelines.md`
3. [ ] Identify which app this belongs to (api/console/shop)
4. [ ] Identify which feature this belongs to
5. [ ] Check existing patterns in that feature
6. [ ] Follow the Three Schema Rule
7. [ ] Put logic in features, not routes
8. [ ] Use TanStack Form with Zod
9. [ ] Transform in mutation hooks
10. [ ] Use shadcn components from @menuvo/ui
