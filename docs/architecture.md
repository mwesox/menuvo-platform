# Architecture Guide

Guidelines for building and scaling this TanStack Start application.

---

## Core Principles

1. **Features own everything** - Routes are thin wiring
2. **Schemas are separated** - Server vs Form vs Database
3. **Transformations have owners** - Clear responsibility per layer
4. **Pure logic is testable** - Extract to `logic/` folder
5. **No premature abstraction** - Add complexity only when proven necessary

---

## Routes vs Features

This is the most important distinction in the architecture.

### Routes (`src/routes/`)

Routes are **thin wiring**. They connect URLs to features.

**Routes contain:**
- Route definition and params parsing
- Loader that calls feature queries
- Component that renders feature components
- Error/loading/not-found states

**Routes do NOT contain:**
- Business logic
- Server functions
- Complex components
- Data transformation

### Features (`src/features/`)

Features are **thick business logic**. They contain everything reusable.

**Features contain:**
- `server/` - Server functions (database access)
- `components/` - UI components
- `logic/` - Pure business logic (calculations, transformations)
- `queries.ts` - Query keys, options, mutation hooks
- `validation.ts` - Zod schemas for server + forms

**Rule:** If you can reuse it across routes, it belongs in features.

---

## Feature Structure

```
features/{feature}/
├── components/          # UI components
├── server/              # Server functions
│   └── {domain}.functions.ts
├── logic/               # Pure functions (testable)
├── queries.ts           # TanStack Query config
└── validation.ts        # Zod schemas
```

---

## Component Architecture

### Component Layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Primitives** | `components/ui/` | shadcn components, no business logic |
| **App Primitives** | `features/{app}/components/ui/` | Themed primitives (ShopPrice, etc.) |
| **Feature Components** | `features/{f}/components/` | Business-aware, compose primitives |
| **Pages** | `routes/` | Wiring only, no component logic |

### Granularity Rules

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

### Styling Rules

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

## Forms & Validation

### Form Architecture

```
Zod Schema (validation.ts)
    ↓
TanStack Form (useForm)
    ↓
Mutation Hook (queries.ts) → transforms + adds context
    ↓
Server Function → validates with server schema
```

### Schema Types & Ownership

| Schema Type | Owner | Location | Purpose |
|-------------|-------|----------|---------|
| **Database** | Backend/DB design | `src/db/schema.ts` | Source of truth |
| **Server Input** | Feature developer | `validation.ts` | API contract |
| **Form** | Feature developer | `validation.ts` | UI validation |

### Three Schema Rule

Every data entity has up to 3 schemas:

| Schema | What It Validates | Types Used |
|--------|-------------------|------------|
| `createItemSchema` | Server function input | Real types (number, boolean) |
| `itemFormSchema` | Form field values | Strings (HTML inputs) |
| Database schema | Database insert | Drizzle column types |

**Why different?** Forms collect strings. Server needs proper types. Database has constraints.

### Form Schema Guidelines

| Rule | Guideline |
|------|-----------|
| Location | Same `validation.ts` as server schemas |
| Naming | `{entity}FormSchema` |
| Types | Strings for all inputs (transform later) |
| Messages | User-friendly error messages |
| Context IDs | Excluded (added by mutation hook) |

### Server Schema Guidelines

| Rule | Guideline |
|------|-----------|
| Naming | `{action}{Entity}Schema` (createItem, updateStore) |
| Types | Actual types (numbers, booleans, dates) |
| Context IDs | Included (storeId, merchantId) |
| Optional fields | Use `.optional()` for updates |

### Validation Responsibility

| Layer | What It Validates | How |
|-------|-------------------|-----|
| Form | Field format, required fields | TanStack Form + Zod |
| Mutation Hook | — | Transforms only, no validation |
| Server Function | Full input validation | `.inputValidator(schema)` |

### Form State Management

| Concern | Tool | NOT |
|---------|------|-----|
| Form values | TanStack Form `useForm` | useState |
| Field validation | Zod schema | Manual checks |
| Submit state | Form's `isSubmitting` | useState |
| Server errors | Mutation's `isError` | Form state |

### Type Inference

| Need | Source |
|------|--------|
| Form values type | `z.infer<typeof itemFormSchema>` |
| Server input type | `z.infer<typeof createItemSchema>` |
| Database type | `InferSelectModel<typeof items>` |

---

## Transformation Responsibility

```
Form → Mutation Hook → Server Function → Database
       (transforms)    (validates)
```

| Layer | Responsibility |
|-------|----------------|
| **Form** | Collect raw input (strings) |
| **Mutation Hook** | Transform types + add context IDs |
| **Server Function** | Validate with Zod, execute DB query |
| **Components** | Never transform data |

---

## Server Function Rules

| Rule | Guideline |
|------|-----------|
| HTTP Methods | `GET` for reads, `POST` for writes |
| Validation | Always use `.inputValidator()` |
| Returns | Return affected record(s) for mutations |
| Errors | `throw notFound()` for 404s |
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

## State Management

| State Type | Tool | Example |
|------------|------|---------|
| Server data | TanStack Query | Stores, items, users |
| Persistent client | Zustand + persist | Cart, preferences |
| Transient UI | Context / useState | Modals, selection |

**Rule:** Never store server data in Zustand.

---

## Testing

| Type | Location | Approach |
|------|----------|----------|
| Integration | `server/*.test.ts` | Real test DB, no mocks |
| Unit | `logic/*.test.ts` | Pure functions, no mocks |
| Component | `components/*.test.tsx` | Mock Query hooks |

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
| Server | `throw notFound()` for 404, `throw new Error()` for others |
| Mutation | Toast on error, log to Sentry |
| Route | Use `errorComponent`, `notFoundComponent` |

---

## Adding a New Feature

1. **Database** → `src/db/schema.ts` (if new entity)
2. **Validation** → `features/{f}/validation.ts`
3. **Server** → `features/{f}/server/{domain}.functions.ts`
4. **Queries** → `features/{f}/queries.ts`
5. **Components** → `features/{f}/components/`
6. **Route** → `src/routes/{path}/` (thin wiring only)
7. **Tests** → `logic/*.test.ts`, `server/*.test.ts`

---

## What We Avoid

- **No repository pattern** - Server functions query DB directly
- **No DI container** - Simple imports
- **No use-case layer** - Logic layer is enough
- **No GraphQL** - REST-style server functions
- **No logic in routes** - Routes are wiring only

---

## Quick Reference

| I need to... | Location |
|--------------|----------|
| Access database | `features/{f}/server/*.functions.ts` |
| Add business logic | `features/{f}/logic/*.ts` |
| Configure queries | `features/{f}/queries.ts` |
| Define validation | `features/{f}/validation.ts` |
| Build UI | `features/{f}/components/` |
| Wire up a page | `routes/` |
| Persist client state | `features/{f}/stores/*.ts` |
| React 19+ patterns | [`docs/coding-guidelines.md`](./coding-guidelines.md) |
