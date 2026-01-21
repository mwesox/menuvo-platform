# CLAUDE.md

## Required Reading

Before writing code, read: `docs/architecture.md` and `docs/coding-guidelines.md`

For API integration tests, read: `apps/api/src/test/README.md`

## Rules

- **Domain**: `menuvo.app` (not menuvo.de)
- **Apps never import `@menuvo/db`** - use tRPC
- **Never `git reset`**
- **Subagents must read docs/** before code changes
- Don't start dev servers - usually already running
- Avoid defensive fallbacks - sometimes failing is better
- Enforce type safety - mandatory fields stay mandatory, no fallback values
- Consistent frontend designs with reusable components

## Tools

- **Chakra MCP** - component docs and examples
- **JetBrains MCP** - codebase navigation
- **GH CLI** - push changes (never skip `--no-verify` unless user requests)
- **fullstack-react-dev** - subagent for development work
- Always run `bun run check-types` to verify

## Commands

```bash
bun install                      # Install deps
bun run dev                      # All apps (turbo)
bun run check                    # Biome lint + format
bun run check-types              # Type checks
bun run test                     # Vitest

# Single app
bun --filter @menuvo/api dev
bun --filter @menuvo/console dev
bun --filter @menuvo/shop dev
bun --filter @menuvo/business dev

# Database
bun run db:generate              # Generate migrations from schema
bun run db:migrate               # Run pending migrations
bun run db:push                  # Push schema directly (dev only)
bun run db:studio                # Drizzle Studio GUI
```

## Where to Add Things

| Need           | Location                       |
|----------------|--------------------------------|
| DB table/enum  | `packages/db/schema/`          |
| tRPC procedure | `packages/trpc/routers/`       |
| API schema     | `packages/trpc/schemas/`       |
| UI component   | Use Chakra UI directly         |
| Feature code   | `apps/{app}/src/features/{f}/` |
| Business logic | `apps/api/src/services/`       |

## Tech

Bun, Hono, tRPC v11, TanStack (Router/Query/Form), Zustand, Drizzle, Chakra UI v3, Biome, Zod v4

## State

- Server data: TanStack Query
- Persistent client: Zustand + persist
- Transient UI: Context/useState
- Never store server data in Zustand/Context

## Navigation

- **Links**: Use TanStack Router's `<Link to="/path">` directly
- **Programmatic**: Use `useNavigate()` hook - `navigate({ to: "/path" })`
- **Avoid**: Don't use `asChild` with RouterLink in Chakra components (causes full page reloads)
