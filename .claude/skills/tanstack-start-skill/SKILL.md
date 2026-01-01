---
name: tanstack-start-skill
description: This skill provides guidance for TanStack Start development including server functions with createServerFn, server routes/API endpoints, middleware with createMiddleware, route loaders, error handling with redirect/notFound, and Sentry instrumentation. This skill should be used when building full-stack features, creating API endpoints, implementing server-side logic, or working with data loading patterns in TanStack Start applications.
---

# TanStack Start Development Skill

This skill provides patterns and best practices for developing with TanStack Start, a full-stack React framework built on TanStack Router and Vite.

## Project Structure

This project uses feature-based organization:

```
src/
├── features/
│   └── {feature}/
│       ├── components/       # Feature-specific components
│       ├── server/           # Server functions
│       │   └── {entity}.functions.ts
│       ├── queries.ts        # TanStack Query options & mutations
│       └── validation.ts     # Zod schemas
├── routes/                   # File-based routing
├── components/
│   ├── ui/                   # Shadcn components
│   └── layout/               # Layout components
└── db/
    ├── schema.ts             # Drizzle schema
    └── index.ts              # Database connection
```

## Server Functions

Server functions are type-safe RPC functions that run on the server but can be called from client code.

### Basic Server Function

```tsx
import { createServerFn } from "@tanstack/react-start"

export const getServerTime = createServerFn({ method: "GET" }).handler(async () => {
  return new Date().toISOString()
})
```

### With Input Validation (Zod)

```tsx
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

export const createUser = createServerFn({ method: "POST" })
  .validator(CreateUserSchema)
  .handler(async ({ data }) => {
    // data is fully typed from Zod schema
    const [user] = await db.insert(users).values(data).returning()
    return user
  })
```

### Calling Server Functions

Server functions are called with `{ data: ... }`:

```tsx
// In components or queries
const user = await getUser({ data: { userId: 123 } })
const newUser = await createUser({ data: { name: "John", email: "john@example.com" } })
```

### HTTP Methods

```tsx
// GET (for reading data)
export const getData = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    return db.query.items.findFirst({ where: eq(items.id, data.id) })
  })

// POST (for mutations)
export const saveData = createServerFn({ method: "POST" })
  .validator(createItemSchema)
  .handler(async ({ data }) => {
    const [item] = await db.insert(items).values(data).returning()
    return item
  })
```

## Error Handling

### Redirects

```tsx
import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

export const requireAuth = createServerFn().handler(async () => {
  const user = await getCurrentUser()
  if (!user) {
    throw redirect({ to: "/login" })
  }
  return user
})
```

### Not Found

```tsx
import { notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"

export const getPost = createServerFn()
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, data.id)
    })
    if (!post) {
      throw notFound()
    }
    return post
  })
```

## TanStack Query Integration

### Query Options Factory Pattern

Organize query options by entity with a keys object:

```tsx
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { getStores, createStore, deleteStore } from "./server/stores.functions"

// Query keys - organized hierarchy
export const storeKeys = {
  all: ["stores"] as const,
  list: () => [...storeKeys.all, "list"] as const,
  detail: (id: number) => [...storeKeys.all, "detail", id] as const,
}

// Query options factories
export const storeQueries = {
  list: () =>
    queryOptions({
      queryKey: storeKeys.list(),
      queryFn: () => getStores(),
    }),

  detail: (storeId: number) =>
    queryOptions({
      queryKey: storeKeys.detail(storeId),
      queryFn: () => getStore({ data: { storeId } }),
      enabled: !!storeId,
    }),
}

// Mutation hooks with invalidation
export function useCreateStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateStoreInput) => createStore({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.list() })
      toast.success("Store created successfully")
    },
    onError: () => {
      toast.error("Failed to create store")
    },
  })
}

export function useDeleteStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (storeId: number) => deleteStore({ data: { storeId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.list() })
      toast.success("Store deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete store")
    },
  })
}
```

### Using in Routes with Loaders

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { storeQueries } from "@/features/stores/queries"

export const Route = createFileRoute("/stores")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(storeQueries.list())
  },
  component: StoresPage,
})

function StoresPage() {
  const { data: stores } = useSuspenseQuery(storeQueries.list())
  return <StoreList stores={stores} />
}
```

### Route with Parameters and Search Params

```tsx
import { z } from "zod"

const searchSchema = z.object({
  storeId: z.number().optional(),
  tab: z.enum(["categories", "items"]).optional().default("categories"),
})

export const Route = createFileRoute("/menu/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ storeId: search.storeId }),
  loader: async ({ context, deps }) => {
    const stores = await context.queryClient.ensureQueryData(storeQueries.list())
    if (deps.storeId) {
      await context.queryClient.ensureQueryData(categoryQueries.byStore(deps.storeId))
    }
    return { stores }
  },
  component: MenuPage,
})

function MenuPage() {
  const { storeId, tab } = Route.useSearch()
  // ...
}
```

## TanStack Form with Zod

### Form with Zod Validation

```tsx
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
})

function UserForm() {
  const form = useForm({
    defaultValues: { name: "", email: "" },
    validators: {
      onSubmit: userSchema,
    },
    onSubmit: async ({ value }) => {
      await createUser({ data: value })
      toast.success("User created")
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field
          name="name"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Name *</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="email"
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email *</FieldLabel>
                <Input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      </FieldGroup>

      <form.Subscribe
        selector={(state) => state.isSubmitting}
        children={(isSubmitting) => (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        )}
      />
    </form>
  )
}
```

### Form with Select Component

```tsx
<form.Field
  name="currency"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>Currency</FieldLabel>
        <Select
          name={field.name}
          value={field.state.value}
          onValueChange={field.handleChange}
        >
          <SelectTrigger id={field.name} aria-invalid={isInvalid}>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((curr) => (
              <SelectItem key={curr.value} value={curr.value}>
                {curr.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    )
  }}
/>
```

## Middleware

### Creating Middleware

```tsx
import { createMiddleware } from "@tanstack/react-start"

const loggingMiddleware = createMiddleware().server(({ next, request }) => {
  console.log(`${request.method} ${request.url}`)
  return next()
})
```

### Authentication Middleware

```tsx
const authMiddleware = createMiddleware().server(async ({ next, context }) => {
  const user = await getCurrentUser()
  if (!user) {
    throw redirect({ to: "/login" })
  }
  return next({ context: { user } })
})
```

### Applying to Server Functions

```tsx
const protectedFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // context.user is available and typed
    return { userId: context.user.id }
  })
```

## API Routes

### File Naming Conventions

Routes are file-based in `src/routes/`:
- `/routes/api.hello.ts` -> `/api/hello`
- `/routes/api.users.$id.ts` -> `/api/users/:id`

### Basic API Route

```tsx
import { createAPIFileRoute } from "@tanstack/react-start"

export const APIRoute = createAPIFileRoute("/api/hello")({
  GET: async ({ request }) => {
    return Response.json({ message: "Hello!" })
  },
  POST: async ({ request }) => {
    const body = await request.json()
    return Response.json({ received: body }, { status: 201 })
  },
})
```

## Sentry Instrumentation

### Wrapping Server Functions

```tsx
import * as Sentry from "@sentry/tanstackstart-react"

export const fetchData = createServerFn().handler(async () => {
  return Sentry.startSpan({ name: "Fetching data from API" }, async () => {
    const response = await fetch("https://api.example.com/data")
    return response.json()
  })
})
```

### Database Operations

```tsx
export const getUsers = createServerFn().handler(async () => {
  return Sentry.startSpan({ name: "Database: Get all users" }, async () => {
    return await db.query.users.findMany()
  })
})
```

## Validation Schemas

Keep schemas in `{feature}/validation.ts`:

```tsx
import { z } from "zod"

// Create schema (for new records)
export const createStoreSchema = z.object({
  merchantId: z.number(),
  name: z.string().min(1, "Name is required"),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  timezone: z.string().default("Europe/Berlin"),
  currency: z.enum(["EUR", "USD", "GBP", "CHF"]).default("EUR"),
})

// Update schema (partial, without required merchantId)
export const updateStoreSchema = createStoreSchema.omit({ merchantId: true }).partial()

// Form schema (for client-side validation)
export const storeFormSchema = createStoreSchema.omit({ merchantId: true })

// Types derived from schemas
export type CreateStoreInput = z.infer<typeof createStoreSchema>
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>
```

## Best Practices

1. **Feature-based organization** - Group server functions, queries, and validation by feature
2. **Query keys hierarchy** - Use consistent key patterns for cache invalidation
3. **Mutation hooks** - Wrap mutations with invalidation and toast notifications
4. **Zod for everything** - Use Zod schemas for server validation and form validation
5. **Custom Field components** - Use the project's Field, FieldLabel, FieldError components
6. **Suspense queries in routes** - Use `ensureQueryData` in loaders, `useSuspenseQuery` in components
7. **Search params validation** - Use `validateSearch` with Zod for type-safe URL params
