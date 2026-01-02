# Coding Guidelines

Practical patterns and conventions for writing code in this codebase.

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

## Sharing Data Between Layout and Child Routes

When a parent layout needs data that's loaded in a child route, **use TanStack Query directly** - don't use context + useEffect.

### The Problem

```tsx
// ❌ BAD: Child sets context via useEffect (causes flash/hydration mismatch)
// In child route component:
useEffect(() => {
  setStoreName(store.name);
  setStoreAddress(store.address);
}, [store]);

// In parent layout header:
const { storeName } = useContext(ShopContext); // Empty on SSR!
```

This causes hydration mismatches because:
1. SSR renders with empty context values
2. Client hydrates, useEffect runs, context updates
3. UI flashes from empty → populated

### The Solution

Use TanStack Query as the shared state layer. The child route's loader has already cached the data.

```tsx
// ✅ GOOD: Child route loader preloads data
// routes/shop/$slug/route.tsx
export const Route = createFileRoute("/shop/$slug")({
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData(
      shopQueries.storeBySlug(params.slug)
    );
  },
});

// ✅ GOOD: Parent layout reads from same cache
// In header component:
function useStoreSlug() {
  const routerState = useRouterState();
  const match = routerState.matches.find((m) => m.routeId === "/shop/$slug");
  return (match?.params as { slug?: string })?.slug ?? null;
}

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

### Why It Works

1. Child route loader calls `ensureQueryData()` during SSR
2. Data is cached before parent layout renders
3. Parent's `useQuery` with same key gets cached data instantly
4. No useEffect, no context, no hydration mismatch

### Rule

**For server data that multiple components need, use TanStack Query with consistent query keys. Don't duplicate into context or Zustand.**
