# Console App Migration Status

This document tracks the migration of the console app from TanStack Start to the monorepo structure with tRPC.

## Completed Steps

### 1. File Structure Migration ✅
All files have been successfully copied from the old structure to the new monorepo:

- **Features**: `src/features/console/*` → `apps/console/src/features/*`
  - auth/
  - help/
  - images/
  - kitchen/
  - menu/
  - menu-import/
  - onboarding/
  - orders/
  - service-points/
  - settings/
  - stores/
  - translations/
  - components/ (console-specific)

- **Routes**: `src/routes/console/*` → `apps/console/src/routes/*`
  - help/
  - kitchen/
  - menu/
  - orders/
  - settings/
  - stores/
  - index.tsx
  - route.tsx

- **Hooks**: `src/hooks/*.ts` → `apps/console/src/hooks/*`
  - use-debounce.ts
  - use-media-query.ts
  - use-mobile.ts

- **i18n**: `src/i18n/` → `apps/console/src/i18n/`
  - config.ts
  - index.ts
  - server.ts
  - locales/

### 2. Server Function Removal ✅
All `server/` directories have been removed from features, as the monorepo uses tRPC instead of TanStack Start server functions.

### 3. Query File Updates ✅ (Partial)
Updated key query files to use tRPC v11 patterns:

- ✅ `features/stores/queries.ts` - Complete tRPC migration with TODOs for missing procedures
- ✅ `features/menu/queries.ts` - Complete tRPC migration for categories and items
- ✅ `features/orders/queries.ts` - Stubbed with tRPC pattern
- ✅ `features/auth/queries.ts` - Complete tRPC migration

## Remaining Work

### 1. Query Files Needing Updates
The following query files still reference removed server functions and need tRPC migration:

- `features/settings/queries.ts`
  - Merchant settings
  - Payment provider integration (Mollie)
  - Plan management

- `features/service-points/queries.ts`
  - Service point CRUD
  - Batch creation
  - Zone toggles

- `features/menu-import/queries.ts`
  - Import job status
  - Apply import changes

- `features/kitchen/queries.ts`
  - Order status updates
  - Offline mutation queueing

- `features/translations/queries.ts`
  - Translation management
  - Language settings
  - Missing translations report

- `features/onboarding/queries.ts`
  - Merchant onboarding flow

- `features/menu/options.queries.ts`
  - Option groups
  - Option choices
  - Modifier management

### 2. Component Import Updates
Components throughout the codebase need import updates:

**Pattern to follow:**
```typescript
// Old (TanStack Start)
import { Button } from "@/components/ui/button";
import { serverFunction } from "./server/functions";

// New (Monorepo)
import { Button } from "@menuvo/ui";
import { useTRPC } from "@/lib/trpc";
```

**Affected areas:**
- All component files in `features/*/components/`
- Route files in `routes/`
- Shared components in `features/components/`

### 3. Route File Updates
Route files need to be updated to remove TanStack Start specific patterns:

**Changes needed:**
- Remove `"use server"` directives
- Remove `createServerFn` usage
- Update loaders to use `trpcClient` from `@/lib/trpc`
- Ensure query keys match between loaders and components

**Example pattern:**
```typescript
// Route loader (can't use hooks)
export const Route = createFileRoute("/stores/$storeId")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.store.getById.queryOptions({ id: params.storeId })
    );
  },
  component: StorePage,
});

// Component (uses hooks)
function StorePage() {
  const { storeId } = Route.useParams();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.store.getById.queryOptions({ id: storeId })
  );
  return <StoreDetail store={data} />;
}
```

### 4. tRPC Router Implementation
The tRPC routers in `packages/trpc/src/routers/` have placeholder implementations. They need to be fully implemented with database access:

**Routers to implement:**
- `store.router.ts` - Extend with hours, closures, cities procedures
- `category.router.ts` - Add getById, toggleActive procedures
- `item.router.ts` - Add toggleAvailable procedure
- `order.router.ts` - Add kitchen views, refund procedures
- `auth.router.ts` - Add register, merchant management

**New routers needed:**
- `service-point.router.ts`
- `menu-import.router.ts`
- `translation.router.ts`
- `merchant.router.ts` (settings, onboarding)
- `option.router.ts` (modifier groups and choices)

### 5. Schema Alignment
Form schemas in features need to be aligned with tRPC input schemas:

**Current state:**
- Form schemas: `features/*/schemas.ts` (string-based for HTML forms)
- API schemas: Need to be created in `packages/trpc/schemas/`

**Pattern:**
```typescript
// packages/trpc/schemas/store.schema.ts
export const createStoreSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  // ... actual types
});

// apps/console/src/features/stores/schemas.ts
export const storeFormSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  // ... all strings for HTML inputs
});

// Mutation hook transforms form → API
export function useCreateStore() {
  const trpc = useTRPC();
  return useMutation({
    mutationFn: (formData: StoreFormInput) => {
      const apiData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
      };
      return trpc.store.create.mutate(apiData);
    },
  });
}
```

## Migration Strategy

### Phase 1: Infrastructure (Current)
- ✅ Copy files to monorepo structure
- ✅ Remove server functions
- ✅ Update key query files with tRPC patterns
- 🔄 Document remaining work

### Phase 2: Core Functionality
1. Implement tRPC routers with database access
2. Create API schemas in packages/trpc/schemas/
3. Update all query files to use tRPC
4. Update component imports

### Phase 3: Routes & Polish
1. Update route loaders to use tRPC
2. Test each feature end-to-end
3. Fix any type errors
4. Remove unused imports

### Phase 4: Testing & Validation
1. Run type checking: `bun run check`
2. Test all features manually
3. Update any broken tests
4. Verify all TODOs are addressed

## Notes

- **No build was run** - As requested, only migration/copy operations were performed
- **TODOs in code** - Query files have TODO comments marking where tRPC procedures need to be implemented
- **Type safety** - Some `as any` casts are used temporarily where schema alignment is needed
- **Backwards compatibility** - Query keys are maintained for cache compatibility

## Next Steps

1. Implement database-backed tRPC procedures in `packages/trpc/routers/`
2. Update remaining query files following the established pattern
3. Search and replace component imports from local UI to `@menuvo/ui`
4. Update route loaders to use tRPC client
5. Run type checking and fix errors
6. Test the console app end-to-end
