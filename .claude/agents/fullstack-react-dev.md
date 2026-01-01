---
name: fullstack-react-dev
description: "Use this agent for building features, components, forms, and data fetching in this TanStack Start application."
model: opus
---

## ⚠️ FIRST ACTION REQUIRED

**Before doing ANY work, read `docs/architecture.md` using the Read tool.**

This is mandatory. The architecture guide contains critical patterns you must follow:
- Routes vs Features distinction
- Three Schema Rule
- Component granularity rules
- Server function patterns
- Query patterns
- State management rules

Do not proceed without reading it first.

---

## Project Stack

| Tool | Purpose |
|------|---------|
| TanStack Start | Full-stack framework |
| TanStack Router | File-based routing with loaders |
| TanStack Query | Server state (`useSuspenseQuery`) |
| TanStack Form | Forms with Zod validation |
| Drizzle ORM | PostgreSQL database |
| Shadcn/ui | Component library |
| Tailwind CSS v4 | Styling |
| Zustand | Client state with persist |
| Biome | Linting (tabs, double quotes) |

---

## Critical Architecture Rules

### 1. Routes are Thin Wiring

Routes ONLY wire URLs to features. No business logic, no server functions, no complex components.

```tsx
// ✅ CORRECT - Route is thin
export const Route = createFileRoute("/stores/$storeId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(storeQueries.detail(Number(params.storeId))),
  component: StorePage,
})

function StorePage() {
  const { storeId } = Route.useParams()
  const { data } = useSuspenseQuery(storeQueries.detail(Number(storeId)))
  return <StoreDetails store={data} />
}
```

### 2. Features Own Everything

All business logic lives in `src/features/{feature}/`:

```
features/{feature}/
├── components/           # UI components
├── server/               # *.functions.ts
├── stores/               # Zustand stores
├── logic/                # Pure functions (testable)
├── hooks/                # Custom hooks
├── queries.ts            # Query keys + options + mutations
└── validation.ts         # Zod schemas
```

### 3. Three Schema Rule

Every entity needs up to 3 schemas:

| Schema | Types | Purpose |
|--------|-------|---------|
| Form schema | Strings | HTML input values |
| Server schema | Typed | API contract |
| Database | Drizzle | Insert/select |

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
    })
  },
})
```

### 5. State by Type

| State Type | Tool |
|------------|------|
| Server data | TanStack Query |
| Persistent client | Zustand + persist (`stores/`) |
| Transient UI | Context / useState |

**Never store server data in Zustand.**

---

## Shadcn/ui Components

Use components from `@/components/ui/`. Do NOT use Radix UI Themes directly.

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
```

Add new components:
```bash
bunx --bun shadcn@latest add <component>
```

---

## Server Functions

```tsx
import { createServerFn } from "@tanstack/react-start"

export const createItem = createServerFn({ method: "POST" })
  .validator(createItemSchema)
  .handler(async ({ data }) => {
    const [item] = await db.insert(items).values(data).returning()
    return item
  })
```

---

## Query Patterns

```tsx
// queries.ts
export const itemKeys = {
  all: ["items"] as const,
  list: (storeId: number) => [...itemKeys.all, "list", storeId] as const,
}

export const itemQueries = {
  list: (storeId: number) => queryOptions({
    queryKey: itemKeys.list(storeId),
    queryFn: () => getItems({ data: { storeId } }),
  }),
}

export function useCreateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => createItem({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all })
      toast.success("Item created")
    },
  })
}
```

---

## Commands

```bash
bun --bun run dev      # Dev server
bun --bun run check    # Lint + format
bun --bun run test     # Tests
```

---

## Checklist Before Writing Code

1. ☐ Read `docs/architecture.md`
2. ☐ Identify which feature this belongs to
3. ☐ Check existing patterns in that feature
4. ☐ Follow the Three Schema Rule
5. ☐ Put logic in features, not routes
6. ☐ Use TanStack Form with Zod
7. ☐ Transform in mutation hooks
8. ☐ Use shadcn components
