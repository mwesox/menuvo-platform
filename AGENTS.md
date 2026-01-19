# Repository Guidelines

## Project Structure & Module Organization

This is a Turborepo monorepo with Bun workspaces.

- `apps/` contains deployable apps: `api` (Hono + tRPC), `console` and `shop` (Vite + React SPAs), and `business` (
  marketing site).
- `packages/` holds shared code: `db` (Drizzle schema + client), `trpc` (routers + shared types), `ui` (shadcn-based
  components).
- `docs/` contains architecture and coding guidelines; read `docs/architecture.md` and `docs/coding-guidelines.md`
  before larger changes.
- `infra/` and `docker-compose.yml` hold deployment and infra helpers.
- _archive has old application. dont change it, its only for reference.

## Build, Test, and Development Commands

Run from the repo root unless noted.

```bash
bun install                         # Install dependencies
bun run dev                         # Dev all apps (turbo)
bun run dev --filter=@menuvo/api    # Dev a single app
bun run build                       # Build all apps
bun run check                       # Biome lint + format
bun run check-types                 # TypeScript typecheck
bun run test                        # Turbo test pipeline (if configured per app)
bun run db:generate                 # Create Drizzle migrations
bun run db:migrate                  # Apply migrations
bun run db:push                     # Dev-only schema push
bun run db:studio                   # Drizzle Studio GUI
```

## Coding Style & Naming Conventions

- Formatting uses Biome (`bun run check`), tabs for indentation, and double quotes.
- Filenames are kebab-case (e.g., `store-form.tsx`).
- Hooks use `use*` prefixes; query helpers live in `queries.ts`.
- Apps never import `@menuvo/db` directly; use tRPC types/routers from `@menuvo/trpc`.

## Testing Guidelines

- Tests live alongside features in `apps/*/src/**` and use `*.test.ts` / `*.test.tsx` (also `*.security.test.ts`).
- Vitest is used in frontend apps; run locally with `cd apps/console && bunx vitest` as needed, or via `bun run test` if
  your app defines a `test` script.

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:` with concise, imperative subjects.
- PRs should include a clear description, linked issue (if applicable), and screenshots for UI changes.
- Call out DB schema changes and include the migration commands you ran.

## Architecture & Data Boundaries

All data access flows through tRPC: SPA → tRPC client → API → PostgreSQL. Keep routes thin, move business logic into
`apps/api/src/services/`, and keep shared UI in `packages/ui`.
