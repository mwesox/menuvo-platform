# Coding Guidelines

Implementation rules and conventions for writing code in this codebase.

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
| Location | Same `validation.ts` as server schemas |
| Naming | `{entity}FormSchema` |
| Types | Strings for all inputs (transform later) |
| Messages | User-friendly error messages |
| Context IDs | Excluded (added by mutation hook) |

### Server Schemas

| Rule | Guideline |
|------|-----------|
| Naming | `{action}{Entity}Schema` (createItem, updateStore) |
| Types | Actual types (numbers, booleans, dates) |
| Context IDs | Included (storeId, merchantId) |
| Optional fields | Use `.optional()` for updates |

### Type Inference

| Need | Source |
|------|--------|
| Form values type | `z.infer<typeof itemFormSchema>` |
| Server input type | `z.infer<typeof createItemSchema>` |
| Database type | `InferSelectModel<typeof items>` |

---

## Server Function Rules

| Rule | Guideline |
|------|-----------|
| HTTP Methods | `GET` for reads, `POST` for writes |
| Validation | Always use `.inputValidator()` |
| Returns | Return affected record(s) for mutations |
| Errors | `throw notFound()` in routes, `throw Error()` in server functions |
| Logic | Delegate complex logic to `logic/` layer |

---

## Query Rules

| Rule | Guideline |
|------|-----------|
| Keys | Hierarchical arrays: `["items", "store", storeId]` |
| Options | Group in `{entity}Queries` object |
| Mutations | Wrap in `use{Action}{Entity}` hooks |
| Invalidation | Always invalidate on mutation success |
| Feedback | Always show toast for mutations |

---

## Route Rules

| Rule | Guideline |
|------|-----------|
| Loader | Use `ensureQueryData` for SSR prefetch |
| Component | Use `useSuspenseQuery` (data guaranteed) |
| Params | Parse in route definition |
| Logic | Keep routes focused on wiring only |

---

## Data Loading Rules

1. **Loaders prefetch** → `ensureQueryData(queryOptions)`
2. **Components consume** → `useSuspenseQuery(queryOptions)`
3. **Same query options** → Ensures cache hit
4. **Never direct calls in loaders** → Always wrap in queryOptions
5. **Mutations via hooks** → `use{Action}{Entity}()` in `queries.ts`

### Loader Pattern

```typescript
export const Route = createFileRoute("/console/items")({
  loader: async ({ context }) => {
    // Always use ensureQueryData with query wrapper
    await context.queryClient.ensureQueryData(itemQueries.byStore(storeId));

    // Never call server functions directly in loaders
    // ❌ await getItems({ data: { storeId } })
  },
});
```

### Component Pattern

```typescript
function ItemList() {
  // useSuspenseQuery reads from cache (no network request)
  // Data guaranteed by loader prefetch
  const { data: items } = useSuspenseQuery(itemQueries.byStore(storeId));

  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}
```

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
| Queries | `{entity}Queries` object | `merchantQueries.detail(id)` |
| Context | `use{Feature}` | `useShop()`, `useMerchantContext()` |
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
| Server Function | Full input validation | `.inputValidator(schema)` |

---

## Sharing Data Between Layout and Child Routes

When a parent layout needs data that's loaded in a child route, **use TanStack Query directly** - don't use context + useEffect.

### The Problem

```tsx
// ❌ BAD: Child sets context via useEffect (causes flash/hydration mismatch)
useEffect(() => {
  setStoreName(store.name);
}, [store]);

// In parent layout header:
const { storeName } = useContext(ShopContext); // Empty on SSR!
```

### The Solution

```tsx
// ✅ GOOD: Parent layout reads from same cache
function StoreInfo() {
  const slug = useStoreSlug();

  // Same query key = instant cache hit, no flash
  const { data: store } = useQuery({
    ...shopQueries.storeBySlug(slug ?? ""),
    enabled: !!slug,
  });

  if (!store) return null;
  return <div>{store.name}</div>;
}
```

**Rule:** For server data that multiple components need, use TanStack Query with consistent query keys. Don't duplicate into context or Zustand.

---

## Naming Conventions

**Files:** kebab-case
- `store-form.tsx`, `items.functions.ts`

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
| Server functions | `throw new Error()` for API errors |
| Route loaders | `throw notFound()` for 404 pages |
| Mutations | Toast on error, log to Sentry |
| Routes | Use `errorComponent`, `notFoundComponent` |

---

## Testing

| Type | Location | Approach |
|------|----------|----------|
| Integration | `server/*.test.ts` | Real test DB, no mocks |
| Unit | `logic/*.test.ts` | Pure functions, no mocks |
| Component | `components/*.test.tsx` | Mock Query hooks |

---

## Adding a New Feature

1. **Database** → `src/db/schema.ts` (if new entity)
2. **Validation** → `features/{f}/validation.ts`
3. **Server** → `features/{f}/server/{domain}.functions.ts`
4. **Queries** → `features/{f}/queries.ts`
5. **Components** → `features/{f}/components/`
6. **Route** → `src/routes/{path}/` (thin wiring only)
7. **Tests** → `logic/*.test.ts`, `server/*.test.ts`
