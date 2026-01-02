# Architecture Guide

Structural patterns for this TanStack Start application.

---

## Core Principles

1. **Features own everything** - Routes are thin wiring
2. **Schemas are separated** - Server vs Form vs Database
3. **Transformations have owners** - Clear responsibility per layer
4. **Pure logic is testable** - Extract to `logic/` folder
5. **No premature abstraction** - Add complexity only when proven necessary

---

## Project Structure

### Routes (`src/routes/`)

Thin wiring. Connect URLs to features.

**Contains:** Route definition, loader calls, render feature components, error states

**Never:** Business logic, server functions, complex components, data transformation

### Features (`src/features/`)

Thick business logic. Everything reusable.

| Folder | Purpose | Rule |
|--------|---------|------|
| `server/` | Database access | `*.functions.ts` files only |
| `components/` | Business-aware UI | Compose primitives |
| `contexts/` | Transient shared state | UI state only, never server data |
| `stores/` | Persistent client state | Zustand + persist |
| `hooks/` | Reusable UI logic | Not for data fetching |
| `logic/` | Pure functions | Testable, no side effects |
| `queries.ts` | Query/mutation config | Keys, options, hooks |
| `validation.ts` | Zod schemas | Server + form schemas |

### Components (`src/components/ui/`)

Primitives (shadcn). No business logic.

**Rule:** If you can reuse it across routes, it belongs in features.

---

## Feature Artifacts

### State Decision

| State Type | Tool |
|------------|------|
| Server data | TanStack Query |
| Auth/session | Route Context (`beforeLoad`) |
| Persistent client | Zustand + persist |
| Transient UI | React Context |
| Component-local | `useState` |

**Rule:** Never store server data in Zustand or React Context.

### Route Context vs React Context

| Type | Set In | Access Via | Use For |
|------|--------|------------|---------|
| Route Context | `beforeLoad` | `Route.useRouteContext()` | Auth, session, route-derived values |
| React Context | Provider component | `useContext()` | UI selection, modal state, wizard progress |

---

## Data Flow Patterns

### Form Submission

```
Form (strings) → Mutation Hook (transforms) → Server Function (validates) → Database
```

| Layer | Responsibility |
|-------|----------------|
| Form | Collect raw input (strings) |
| Mutation | Transform types, add context IDs |
| Server | Validate with Zod, execute query |

### Data Loading

```
Loader → ensureQueryData() → Cache → useSuspenseQuery()
```

Loaders run on BOTH server and client. Never put secrets in loaders.

### Schema Separation

| Schema | Purpose | Types |
|--------|---------|-------|
| Form Schema | HTML input validation | Strings |
| Server Schema | Function input | Real types (number, boolean) |
| Database Schema | Drizzle columns | Column types |

---

## Anti-Patterns

- **No repository pattern** - Server functions query DB directly
- **No DI container** - Simple imports
- **No use-case layer** - Logic layer is enough
- **No GraphQL** - REST-style server functions
- **No logic in routes** - Routes are wiring only
- **No server data in context** - Use TanStack Query

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
| Share UI state | `features/{f}/contexts/*.tsx` |
| Add custom hook | `features/{f}/hooks/*.ts` |
| Implementation rules | [`docs/coding-guidelines.md`](./coding-guidelines.md) |
