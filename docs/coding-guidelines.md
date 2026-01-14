# Coding Guidelines

Implementation rules and conventions for writing code in this monorepo.

---

## React 19+ Patterns

### `useEffectEvent`

Use when effects need fresh prop/state values but shouldn't re-run when they change.

```tsx
// Bad: theme change causes reconnect
useEffect(() => {
  connection.on('connected', () => notify(theme));
}, [roomId, theme]); // theme triggers effect

// Good: theme is fresh but not a dependency
const onConnected = useEffectEvent(() => notify(theme));
useEffect(() => {
  connection.on('connected', onConnected);
}, [roomId]); // Only roomId triggers effect
```

### `<Activity>`

Preserve UI state in drawers/modals that users toggle frequently.

```tsx
// Bad: Loses state when closed
{isOpen && <ItemDrawer />}

// Good: Preserves state, unmounts effects
<Activity mode={isOpen ? 'visible' : 'hidden'}>
  <ItemDrawer />
</Activity>
```

### `useDeferredValue`

Built-in debouncing for search/filter inputs.

```tsx
const [query, setQuery] = useState('');
const deferredQuery = useDeferredValue(query);

<input value={query} onChange={(e) => setQuery(e.target.value)} />
<StoreList filter={deferredQuery} />
```

---

## Component Rules

### Granularity

| Situation | Action |
|-----------|--------|
| Pattern repeats 3+ times | Extract to component |
| Component > 150 lines | Split into sub-components |
| Component has 3+ useState | Extract logic to hook |
| Multiple concerns in one file | Split by concern |
| Scrolling to understand | Too big, split it |

### Composition Principles

| Principle | Guideline |
|-----------|-----------|
| **Single Responsibility** | One reason to change per component |
| **Composition over size** | Compose small components, don't grow big ones |
| **Logic extraction** | Stateful logic → hooks, pure logic → `logic/` |
| **Prop drilling limit** | Max 2 levels, then use composition or context |

### Styling

| Rule | Guideline |
|------|-----------|
| Use shadcn variants | Don't duplicate Tailwind patterns |
| Use CVA for custom variants | Keep conditional styling in one place |
| Extract repeated patterns | 3+ usages = new component |
| Primitives own their styles | Feature components compose, don't override |

### What Components Should NOT Do

- Fetch data with `useEffect` → Use query hooks
- Transform data inline → Do in mutation hooks or `logic/`
- Contain business rules → Extract to `logic/`
- Mix layout + logic + data → Split into focused components

---

## Schema Rules

### Form Schemas

| Rule | Guideline |
|------|-----------|
| Location | `features/{f}/schemas.ts` |
| Naming | `{entity}FormSchema` |
| Types | Strings for all inputs (transform later) |
| Messages | User-friendly error messages |
| Context IDs | Excluded (added by mutation hook) |

### API Schemas

| Rule | Guideline |
|------|-----------|
| Location | `packages/trpc/routers/{domain}/schemas.ts` |
| Naming | `{action}{Entity}Schema` (createItem, updateStore) |
| Types | Actual types (numbers, booleans, dates) |
| Context IDs | Included (storeId, merchantId) |
| Optional fields | Use `.optional()` for updates |

### Type Inference

| Need | Source |
|------|--------|
| Form values type | `z.infer<typeof itemFormSchema>` |
| API input type | `z.infer<typeof createItemSchema>` |
| Database type | `InferSelectModel<typeof items>` |

### Enum & Const Arrays

| Rule | Guideline |
|------|-----------|
| Source of truth | `packages/db/schema/` - define as `const array` with `as const` |
| Zod schemas | `packages/trpc/routers/{domain}/schemas.ts` - derive using `z.enum(dbArray)` |
| App imports | Always from `@menuvo/trpc`, never from `@menuvo/db` |
| Local types | Never create type mirrors in apps - import from tRPC |

### Composite Types

| Need | Location |
|------|----------|
| Database join result | Define locally in feature `types.ts` |
| tRPC response with relations | Use tRPC router inference |
| Extended form state | Define locally in feature `schemas.ts` or `types.ts` |

---

## tRPC Procedure Rules

### Procedure Types

| Type | Use When |
|------|----------|
| `publicProcedure` | Unauthenticated access (storefront, public menu) |
| `protectedProcedure` | Requires valid session |
| `storeOwnerProcedure` | Requires owner/admin role |

### Input Validation

```typescript
// Always validate inputs
.input(createItemSchema)

// Never trust client data
.mutation(({ input, ctx }) => {
  // input is fully validated and typed
})
```

### Context Usage

```typescript
// Context provides authenticated user and database
.mutation(({ input, ctx }) => {
  const { db, user } = ctx;

  // Always check ownership/permissions
  const store = await db.query.stores.findFirst({
    where: and(
      eq(stores.id, input.storeId),
      eq(stores.merchantId, user.merchantId)
    ),
  });
})
```

### Error Handling

```typescript
import { TRPCError } from "@trpc/server";

// Throw typed errors
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Store not found",
});

// Common codes: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, BAD_REQUEST
```

### Response Data

| Rule | Guideline |
|------|-----------|
| Use Drizzle `columns` | Fetch only needed fields, omit sensitive data |
| Use `.output()` for public APIs | Explicit contract, strips extra fields |
| Skip `.output()` internally | Type inference sufficient, no runtime overhead |
| Never expose payment fields | `stripeAccountId`, `mollieProfileId`, etc. |

```typescript
// Preferred: column projection
return ctx.db.query.merchants.findFirst({
  columns: { id: true, name: true, email: true }, // omit sensitive
});

// Public APIs: explicit output schema
getMenu: publicProcedure.output(menuSchema).query(...)
```

---

## Query Rules (tRPC v11 + TanStack Query)

### Using the tRPC Hook

```typescript
// Access tRPC client in components
const trpc = useTRPC();

// Use with TanStack Query hooks
const { data } = useQuery(trpc.store.get.queryOptions({ id }));
const { data } = useSuspenseQuery(trpc.store.get.queryOptions({ id }));
```

### Query Options Pattern

```typescript
// queries.ts - Wrap tRPC for reuse across components
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

```typescript
// Get type-safe query keys for invalidation
const trpc = useTRPC();
const queryKey = trpc.store.get.queryKey({ id });

// Invalidate specific query
queryClient.invalidateQueries({ queryKey });

// Invalidate entire router
queryClient.invalidateQueries({ queryKey: trpc.store.pathKey() });
```

### Mutations

```typescript
// Use mutationOptions() factory
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

### Rules

| Rule | Guideline |
|------|-----------|
| Use `queryOptions()` | Type-safe query configuration |
| Use `queryKey()` | Type-safe invalidation |
| Use `pathKey()` | Invalidate entire routers |
| Always invalidate on mutation | Keep cache in sync |
| Show toast feedback | User needs confirmation |

---

## Route Rules (SPA)

### Loader Pattern

```typescript
// Route loaders can't use hooks, so use trpcClient directly
export const Route = createFileRoute("/stores/$storeId")({
  loader: async ({ context, params }) => {
    // Prefetch using trpcClient (not useTRPC hook)
    await context.queryClient.ensureQueryData({
      queryKey: ["store", params.storeId],
      queryFn: () => context.trpcClient.store.get.query({
        id: params.storeId
      }),
    });
  },
  component: StorePage,
});
```

### Component Pattern

```typescript
function StorePage() {
  const { storeId } = Route.useParams();
  const trpc = useTRPC();

  // Data guaranteed by loader prefetch
  const { data: store } = useSuspenseQuery(
    trpc.store.get.queryOptions({ id: storeId })
  );

  return <StoreDetail store={store} />;
}
```

### Matching Query Keys

```typescript
// Ensure loader and component use same query key
// Option 1: Define key factory
const storeKeys = {
  detail: (id: string) => ["store", id] as const,
};

// Option 2: Use trpc.queryKey() in components (preferred)
// Loader must match the key pattern tRPC generates
```

### Rules

| Rule | Guideline |
|------|-----------|
| Loaders use `trpcClient` | Can't use hooks outside React |
| Components use `useTRPC()` | Get queryOptions factory |
| Match query keys | Ensures cache hit from loader |
| Keep routes thin | No business logic |

---

## Hooks Rules

### When to Create Custom Hooks

| Scenario | Create Hook? |
|----------|--------------|
| Mutation with toast/cache invalidation | Yes → `queries.ts` |
| Same query used in 3+ components | Yes → `queries.ts` |
| Complex UI state (3+ useState) | Yes → `hooks/` |
| Simple useState in one component | No, inline |
| Server data sharing | No, use TanStack Query directly |

### Naming Conventions

| Hook Type | Pattern | Example |
|-----------|---------|---------|
| Mutations | `use{Action}{Entity}` | `useCreateCategory()` |
| Queries | `{entity}Queries` object | `storeQueries.detail(id)` |
| Context | `use{Feature}` | `useShop()`, `useConsole()` |
| UI state | `use{Concern}` | `useMenuPageState()` |
| Stores | `use{Entity}Store` | `useCartStore()` |

### Hook Rules

1. **Mutation hooks own side effects** - Toast notifications, cache invalidation
2. **Never store server data in hooks** - Use TanStack Query cache
3. **Context for transient UI only** - Drawers, modals, search state
4. **Export return types** - `export type MenuPageState = ReturnType<typeof useMenuPageState>`

---

## Form State Management

| Concern | Tool | NOT |
|---------|------|-----|
| Form values | TanStack Form `useForm` | useState |
| Field validation | Zod schema | Manual checks |
| Submit state | Form's `isSubmitting` | useState |
| Server errors | Mutation's `isError` | Form state |

### Validation Responsibility

| Layer | What It Validates | How |
|-------|-------------------|-----|
| Form | Field format, required fields | TanStack Form + Zod |
| Mutation Hook | — | Transforms only, no validation |
| tRPC Procedure | Full input validation | `.input(schema)` |

---

## Naming Conventions

**Files:** kebab-case
- `store-form.tsx`, `create-item.ts`

**Functions:**

| Prefix | Use |
|--------|-----|
| `get*` | Queries |
| `create*`, `update*`, `delete*` | Mutations |
| `is*`, `has*`, `can*` | Boolean checks |
| `calculate*`, `format*` | Transformations |
| `use*` | React hooks |

---

## Error Handling

| Layer | Pattern |
|-------|---------|
| tRPC procedures | `throw new TRPCError({ code, message })` |
| Mutations | Toast on error, log to Sentry |
| Routes | Use `errorComponent` for error boundaries |
| Components | Try/catch for async operations |

---

## Testing

| Type | Approach |
|------|----------|
| Domain functions | Unit test with mocked dependencies |
| Pure logic | Unit test, no mocks needed |
| Components | Mock tRPC client |
| Infrastructure | Integration test with real services (test mode) |

---

## Adding a New Feature

See `docs/architecture.md` for detailed folder structure. High-level flow:

1. **Database schema** → `packages/db/schema/`
2. **Domain logic** → `apps/api/src/domain/{slice}/`
3. **tRPC router + schema** → `packages/trpc/routers/{domain}/`
4. **Frontend queries** → `apps/{app}/src/features/{f}/queries.ts`
5. **Frontend components** → `apps/{app}/src/features/{f}/components/`
6. **Route** → `apps/{app}/src/routes/` (thin wiring only)
