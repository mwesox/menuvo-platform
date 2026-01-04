# Mollie Migration - Kickstart Prompt

Copy and paste this prompt to resume the migration work:

---

```
I'm migrating from Stripe to Mollie for my restaurant platform (menuvo).

## First Steps
1. Read `plans/mollie/tasks.md` - Check which tasks are done
2. Read `plans/mollie/plan.md` - Full implementation details
3. Continue from where we left off, marking tasks complete as you go

## Tech Stack
- TanStack Start (React 19 fullstack framework)
- Drizzle ORM + PostgreSQL
- Redis queues for async processing
- Bun runtime

## Key References
- Current Stripe integration: `src/lib/stripe/` - use as pattern reference
- Mollie SDK: `@mollie/api-client` (https://github.com/mollie/mollie-api-node)
- Architecture docs: `docs/architecture.md`, `docs/coding-guidelines.md`

## What We're Migrating
1. **Order payments** - Mollie hosted checkout (redirect) instead of Stripe embedded
2. **Merchant onboarding** - Client Links API + OAuth instead of Stripe Connect
3. **SaaS subscriptions** - Mandate-based (first payment creates mandate → then subscription)
4. **Refunds** - Platform triggers via Mollie API using stored OAuth tokens

## Architecture Decisions
- **Platform model**: 5% application fee, merchants get their own Mollie organizations
- **M2M operations**: Store OAuth tokens encrypted, auto-refresh before expiry
- **Parallel period**: Keep Stripe working, add Mollie alongside (`paymentProvider` field)
- **Webhooks**: Mollie sends only resource ID - must fetch full payload from API

## How to Work
- **Use multiple fullstack-react-dev subagents in parallel** where tasks are independent
- Example parallel work:
  - Agent 1: Schema + migrations
  - Agent 2: Mollie lib files
  - Agent 3: Webhook handlers
- For dependent tasks, work sequentially
- Update `tasks.md` checkboxes as tasks complete

## Key Differences from Stripe
| Stripe | Mollie |
|--------|--------|
| Embedded checkout iframe | Hosted redirect page |
| Full webhook payload | Webhook sends ID only (fetch data) |
| Direct subscription creation | First payment → mandate → subscription |
| Connect accounts API | OAuth + Client Links API |

Start implementing from the current progress in tasks.md.
```
