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
