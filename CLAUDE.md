# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**USE BUN ONLY!**

```bash
bun --bun run dev          # Start dev server on port 3000
bun --bun run build        # Build for production
bun --bun run start        # Run production build
bun --bun run test         # Run all tests with Vitest
bun --bun run check        # Run Biome linting and formatting checks

# Database (Drizzle)
bun run db:generate        # Generate migrations
bun run db:migrate         # Run migrations
bun run db:push            # Push schema to database
bun run db:studio          # Open Drizzle Studio
```

## Architecture

**TanStack Start** full-stack React framework with:

- **TanStack Router** - File-based routing (`src/routes/`)
- **TanStack Query** - Data fetching with SSR
- **TanStack Form** - Form handling with Zod validation
- **Drizzle ORM** - PostgreSQL database (`src/db/`)
- **Tailwind CSS v4** - Styling
- **Shadcn/ui** - Components (new-york style, zinc base)
- **Sentry** - Error tracking
- **T3 Env** - Type-safe env vars (`src/env.ts`)

### Project Structure

```
src/
├── features/              # Feature-based modules
│   └── {feature}/
│       ├── components/    # Feature components
│       ├── server/        # Server functions
│       ├── queries.ts     # Query options & mutations
│       └── validation.ts  # Zod schemas
├── routes/                # File-based routing
├── components/
│   ├── ui/                # Shadcn components
│   └── layout/            # Layout components
└── db/
    ├── schema.ts          # Drizzle schema
    └── index.ts           # Database connection
```

### Key Files

- `src/router.tsx` - Router with Query integration and Sentry
- `src/routes/__root.tsx` - Root layout
- `src/db/schema.ts` - Database schema
- `src/env.ts` - Environment variables (VITE_ prefix for client)

## TanStack Form Patterns

**Always use TanStack Form with Zod for form handling.**

### Basic Form with Zod Validation

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

## Server Functions

```tsx
import { createServerFn } from "@tanstack/react-start"
import { redirect, notFound } from "@tanstack/react-router"
import { z } from "zod"

// Basic server function
export const getServerTime = createServerFn().handler(async () => {
  return new Date().toISOString()
})

// With Zod validation
export const createUser = createServerFn({ method: "POST" })
  .validator(z.object({ name: z.string(), email: z.string().email() }))
  .handler(async ({ data }) => {
    const [user] = await db.insert(users).values(data).returning()
    return user
  })

// Auth redirect
export const requireAuth = createServerFn().handler(async () => {
  const user = await getCurrentUser()
  if (!user) throw redirect({ to: "/login" })
  return user
})

// Not found
export const getPost = createServerFn()
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const post = await db.query.posts.findFirst({ where: eq(posts.id, data.id) })
    if (!post) throw notFound()
    return post
  })
```

## TanStack Query Patterns

### Query Options Factory

```tsx
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"

export const storeKeys = {
  all: ["stores"] as const,
  list: () => [...storeKeys.all, "list"] as const,
  detail: (id: number) => [...storeKeys.all, "detail", id] as const,
}

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
    }),
}

// Mutation hook with invalidation
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
```

### Route with Loader

```tsx
import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

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

## Middleware

```tsx
import { createMiddleware } from "@tanstack/react-start"

const authMiddleware = createMiddleware().server(({ next, context }) => {
  return next({ context: { userId: 123 } })
})

const fn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // context.userId available
  })
```

## Code Style

- Biome for linting/formatting (tabs, double quotes)
- Import aliases: `@/*` maps to `./src/*`
- Feature-based organization in `src/features/`

### Adding Shadcn Components

```bash
bunx --bun shadcn@latest add <component>
```
