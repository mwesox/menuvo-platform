# Menuvo Platform Architecture Audit (Prototype)

## Scope
Reviewed `docs/product.md`, `docs/architecture.md`, and the current codebase structure to assess alignment, structure quality, and prototype readiness.

## Architecture Summary
- TanStack Start monolith with three primary surfaces: `routes/console` (merchant), `routes/shop` (customer), `routes/business` (marketing).
- Feature-first organization under `src/features` with server functions, queries, validation, logic, and UI components.
- Data layer built on Drizzle + Postgres with JSONB translations for menu entities in `src/db/schema.ts`.
- Background processing via Bun workers + Redis queues for menu import and image variants.
- Integrations for payments (Stripe Connect + webhooks), storage (S3-compatible), and AI menu extraction (OpenRouter).

## Alignment With Architecture Guide
- Routes mostly act as thin wiring and rely on `ensureQueryData` + `useSuspenseQuery` for SSR cache hydration.
- Feature modules centralize business logic and queries, keeping UI composition reusable across routes.
- Validation schemas are separated by intent (server vs form), and mutation hooks encapsulate side effects.
- Pure logic is generally extracted into `logic/` (orders, menu display, import processing).

## Strengths
- Clear product surfaces and route grouping match the B2B2C product shape and core ordering flows.
- Consistent TanStack Query usage reduces data-fetching duplication and supports SSR.
- Background workers decouple heavy tasks from request latency, which fits a SaaS platform model.
- i18n structure is clean with server-driven language detection and organized locale bundles.
- Stripe integration is comprehensive (connect, subscription, webhook ingestion) and centralized.

## Findings (Prototype Gaps)
- Medium: Some API routes contain substantial business logic and direct DB/storage access instead of delegating to feature server modules (`src/routes/api.images.upload.ts`, `src/routes/api.menu-import.upload.ts`, `src/routes/api.webhooks.stripe.thin.ts`, `src/routes/api.webhooks.stripe.ts`).
- Medium: Server data is stored in React Context, which conflicts with the "no server data in context" rule and risks stale or duplicated state (`src/features/console/stores/contexts/store-selection-context.tsx`).
- Medium: Slug generation is inconsistent between onboarding and store creation, which can yield different slugs for the same name (`src/features/console/onboarding/logic/slug.ts`, `src/features/console/stores/server/stores.functions.ts`).
- Low/Medium: Option-group form schemas rely on numeric Zod types for HTML inputs, diverging from the "form schema = strings" guideline and risking parsing drift (`src/features/console/menu/options.validation.ts`).
- Low/Medium: Menu/category ordering is hard-coded to German translations rather than the active display language, which will mis-order content for non-DE merchants (`src/features/console/menu/server/categories.functions.ts`, `src/features/console/menu/server/items.functions.ts`).
- Low: `MenuPage` bundles routing, state, and UI concerns into a large component, exceeding the component-size guideline and making it harder to test and evolve (`src/features/console/menu/components/menu-page.tsx`).

## Recommendations (Next Pass)
- Move API route logic into `features/*/server` or `lib/*` modules and keep routes as wiring only, matching the architecture guide.
- Centralize slug generation (e.g. `features/console/stores/logic/slug.ts`) and reuse it from onboarding and store creation.
- Replace context-held server data with `useSuspenseQuery` in consumers or a thin hook that reads from the query cache.
- Normalize form schemas to string inputs (or use `z.preprocess`) so parsing happens in one predictable place.
- Make ordering language-aware by passing `displayLanguage` into query builders or applying ordering in pure logic.
- Split `MenuPage` into master list + detail panel components and extract navigation handlers into a dedicated hook.

## Testing Notes
Current tests cover a small set of server functions and shop menu components; consider adding targeted integration tests for uploads, menu import processing, and Stripe webhook handlers once those flows stabilize.
