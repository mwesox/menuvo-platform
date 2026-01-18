# CLAUDE.md

## Required Reading

Before writing code, read: `docs/architecture.md` and `docs/coding-guidelines.md`

## Rules

- **Domain**: `menuvo.app` (not menuvo.de)
- **Apps never import `@menuvo/db`** - use tRPC
- **Never `git reset`**
- **Use ShadCN MCP** for component docs
- **Subagents must read docs/** before code changes
- Dont start DEV servers in sessions. usually there is a server already running. 
- Avoid too defensive fallback solutions. check bigger picture, sometimes failing is better , thatn implementing anothe fallback. 
- Use Jetbrains MCP for navigating through codebase. 
- Use GH CLI to push changes. never skip --no-verify when pushign (only when user wants it)
- always run bun run check-types to make sure we are on track. 
- Use fullstack-react-dev for subagent work in developement. 
- Enforce type safety. fields which are mandatory must be mandatory and dont fill it with fallback values or model it optional or nullable. 
## Commands

```bash
bun install                      # Install deps
bun run dev                      # All apps (turbo)
bun run check                    # Biome lint + format
bun run check-types                    # Type checks
bun run test                     # Vitest

# Single app
bun --filter @menuvo/api dev
bun --filter @menuvo/console dev
bun --filter @menuvo/shop dev
bun --filter @menuvo/business dev

# Database (run from root, uses packages/db)
bun run db:generate              # Generate migrations from schema changes
bun run db:migrate               # Run pending migrations (production)
bun run db:push                  # Push schema directly (dev only)
bun run db:studio                # Open Drizzle Studio GUI

# DB Workflow:
# 1. Edit schema in packages/db/src/schema/
# 2. Run `bun run db:generate` to create migration
# 3. Run `bun run db:migrate` to apply migration
# 4. Never use db:push in production

# Shadcn
cd packages/ui && bunx --bun shadcn@latest add <component>
```

## Where to Add Things

| Need | Location |
|------|----------|
| DB table/enum | `packages/db/schema/` |
| tRPC procedure | `packages/trpc/routers/` |
| API schema | `packages/trpc/schemas/` |
| UI primitive | `packages/ui/components/` |
| Feature code | `apps/{app}/src/features/{f}/` |
| Business logic | `apps/api/src/services/` |

## Tech

Bun, Hono, tRPC v11, TanStack (Router/Query/Form), Zustand, Drizzle, Tailwind v4, shadcn, Biome, Zod v4

## State

- Server data: TanStack Query
- Persistent client: Zustand + persist
- Transient UI: Context/useState
- Never store server data in Zustand/Context
