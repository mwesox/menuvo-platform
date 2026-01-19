# API Integration Tests

## Architecture

```
src/test/
├── setup.ts              # Vitest setup: env vars, mocks
├── db.ts                 # Testcontainers PostgreSQL
├── utils/
│   ├── test-id.ts        # Unique IDs for test isolation
│   └── cleanup.ts        # Data cleanup via merchant cascade
└── integration/
    └── *.test.ts         # Integration tests
```

## Database Setup

Uses `@testcontainers/postgresql` to spin up a real PostgreSQL container per test run.

```typescript
import { setupTestDb, teardownTestDb, getTestDb } from "../db.js";

describe("Feature", () => {
  let db: Database;

  beforeAll(async () => {
    const { testDb } = await setupTestDb(); // Starts container + runs migrations
    db = testDb;
  });

  afterAll(async () => {
    await teardownTestDb(); // Closes connection + stops container
  });
});
```

Key points:

- `setupTestDb()` starts PostgreSQL 16, runs all migrations from `packages/db/drizzle/`
- Returns `Database` type compatible with all services
- Container is destroyed after tests (no cleanup needed)

## Test Isolation

Use `createTestRunId()` and `uniqueEmail()` to isolate test data:

```typescript
const testRunId = createTestRunId(); // "test-1234567890-1"
const email = uniqueEmail(testRunId); // "test-1234567890-1-2@test.local"
```

Cleanup via `cleanupTestData(testRunId)` deletes merchants by email pattern - FK cascades handle related data.

## Wiring Services

Services require `Database` from `@menuvo/db`. Wire them in `beforeAll`:

```typescript
import type { Database } from "@menuvo/db";
import { MerchantsService } from "../../domains/merchants/service.js";
import { StoreService } from "../../domains/stores/service.js";

const merchantsService = new MerchantsService(db);
const storesService = new StoreService(db);
```

## Environment

`setup.ts` sets required env vars before tests:

- `ENCRYPTION_KEY` - 64 hex chars
- `OPENROUTER_API_KEY` - any string
- `NODE_ENV=test`

Email service is mocked to prevent actual sends.

## Running Tests

```bash
bun --filter @menuvo/api test        # Run all
bun --filter @menuvo/api test:watch  # Watch mode
```

## Adding New Tests

1. Create `src/test/integration/feature.test.ts`
2. Import `setupTestDb`, `teardownTestDb` from `../db.js`
3. Wire services with test db in `beforeAll`
4. Use `createTestRunId()` for isolation
5. Clean up in `afterAll` with `cleanupTestData()`

## Timeouts

Testcontainers needs time to start. Configured in `vitest.config.ts`:

- `testTimeout: 60000` (60s per test)
- `hookTimeout: 60000` (60s for beforeAll/afterAll)
