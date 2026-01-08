# Console Migration Guide

Quick reference for completing the console app migration to the monorepo.

## Query File Migration Pattern

### Before (TanStack Start)
```typescript
import { queryOptions, useMutation } from "@tanstack/react-query";
import { getStore, createStore } from "./server/stores.functions";

export const storeQueries = {
  detail: (id: string) => queryOptions({
    queryKey: ["stores", id],
    queryFn: () => getStore({ data: { id } }),
  }),
};

export function useCreateStore() {
  return useMutation({
    mutationFn: (input) => createStore({ data: input }),
  });
}
```

### After (tRPC Monorepo)
```typescript
import { queryOptions, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

export function useStoreQueries() {
  const trpc = useTRPC();

  return {
    detail: (id: string) => trpc.store.getById.queryOptions({ id }),
  };
}

export function useCreateStore() {
  const trpc = useTRPC();

  return useMutation({
    ...trpc.store.create.mutationOptions(),
    mutationFn: (input) => trpc.store.create.mutate(input),
  });
}
```

## Component Import Updates

### Find and Replace Patterns

**UI Components:**
```bash
# Find
import { Button } from "@/components/ui/button"
import { Card } from "~/components/ui/card"

# Replace with
import { Button } from "@menuvo/ui"
import { Card } from "@menuvo/ui"
```

**Server Functions:**
```bash
# Find
import { ... } from "./server/...functions"

# Remove entirely - use tRPC hooks instead
```

**App Paths:**
```bash
# Find
import { ... } from "@/db"
import { ... } from "~/db"

# Replace with (if needed in types)
import type { ... } from "@menuvo/db"
# But prefer using tRPC output types instead
```

## Route Migration Pattern

### Loader Updates

**Before:**
```typescript
export const Route = createFileRoute("/stores/$storeId")({
  loader: async ({ params }) => {
    return await getStore({ data: { storeId: params.storeId } });
  },
});
```

**After:**
```typescript
export const Route = createFileRoute("/stores/$storeId")({
  loader: async ({ context, params }) => {
    // Prefetch using trpcClient (not hook)
    await context.queryClient.ensureQueryData(
      context.trpc.store.getById.queryOptions({ id: params.storeId })
    );
  },
  component: StorePage,
});
```

### Component Query Usage

**Before:**
```typescript
function StorePage() {
  const { storeId } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["stores", storeId],
    queryFn: () => getStore({ data: { storeId } }),
  });
  return <div>{data.name}</div>;
}
```

**After:**
```typescript
function StorePage() {
  const { storeId } = Route.useParams();
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(
    trpc.store.getById.queryOptions({ id: storeId })
  );

  return <div>{data.name}</div>;
}
```

## tRPC Router Implementation

### Router Structure
```typescript
// packages/trpc/src/routers/store.router.ts
import { z } from "zod";
import { db } from "@menuvo/db";
import { stores } from "@menuvo/db/schema";
import { protectedProcedure, router } from "../trpc.js";

export const storeRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.query.stores.findMany({
      where: eq(stores.merchantId, ctx.user.merchantId),
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const store = await db.query.stores.findFirst({
        where: and(
          eq(stores.id, input.id),
          eq(stores.merchantId, ctx.user.merchantId)
        ),
      });
      if (!store) throw new TRPCError({ code: "NOT_FOUND" });
      return store;
    }),

  create: protectedProcedure
    .input(createStoreSchema)
    .mutation(async ({ ctx, input }) => {
      const [store] = await db.insert(stores).values({
        ...input,
        merchantId: ctx.user.merchantId,
      }).returning();
      return store;
    }),
});
```

### Adding to App Router
```typescript
// packages/trpc/src/routers/index.ts
import { storeRouter } from "./store.router.js";

export const appRouter = router({
  store: storeRouter,
  // ... other routers
});
```

## Common Issues & Solutions

### Issue: "Cannot find module '@/components/ui/...'"
**Solution:** Update import to use `@menuvo/ui`
```typescript
// Before
import { Button } from "@/components/ui/button";

// After
import { Button } from "@menuvo/ui";
```

### Issue: "Module not found: ./server/..."
**Solution:** Remove server function imports, use tRPC hooks
```typescript
// Before
import { getStores } from "./server/stores.functions";

// After
import { useTRPC } from "@/lib/trpc";
const trpc = useTRPC();
// Use trpc.store.list.query()
```

### Issue: "useTRPC is not a function"
**Solution:** Ensure TRPCProvider wraps your app in main.tsx
```typescript
// apps/console/src/main.tsx
import { TRPCProvider, createTRPCReactClient } from "@/lib/trpc";

const trpcClient = createTRPCReactClient();

<TRPCProvider client={trpcClient} queryClient={queryClient}>
  <App />
</TRPCProvider>
```

### Issue: Type errors on tRPC procedures
**Solution:** Implement the missing procedure in the tRPC router or add TODO
```typescript
// If procedure doesn't exist yet
mutationFn: async (input) => {
  // TODO: Add store.toggleActive to tRPC router
  throw new Error("Not implemented");
},
```

## Bulk Update Commands

**Find all server function imports:**
```bash
cd apps/console/src
grep -r "from.*server.*functions" features/ routes/
```

**Find all @/components/ui imports:**
```bash
grep -r "@/components/ui" features/ routes/
```

**Find all query files:**
```bash
find features/ -name "queries.ts" -o -name "*.queries.ts"
```

## Validation Checklist

Before marking a feature as "migrated":

- [ ] No imports from `./server/` directories
- [ ] UI components import from `@menuvo/ui`
- [ ] Query hooks use `useTRPC()` pattern
- [ ] Route loaders use `context.trpc` not hooks
- [ ] No `"use server"` directives
- [ ] No `createServerFn` usage
- [ ] All tRPC procedures exist or have TODOs
- [ ] Types compile without errors
- [ ] Feature works end-to-end (if router implemented)

## Priority Order

1. **Critical path features** (needed for basic app function):
   - auth (login/logout)
   - stores (list, create, view)
   - menu (categories, items)
   - orders (view, update status)

2. **Secondary features**:
   - service-points
   - settings
   - translations

3. **Advanced features**:
   - menu-import
   - kitchen (offline support)
   - onboarding

## Getting Help

- Check `MIGRATION_STATUS.md` for current progress
- See `docs/architecture.md` for monorepo structure
- See `docs/coding-guidelines.md` for tRPC patterns
- Example implementations in:
  - `features/stores/queries.ts`
  - `features/menu/queries.ts`
