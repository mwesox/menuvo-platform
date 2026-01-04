# k6 Load Testing

Load testing suite for the Menuvo platform using [k6](https://k6.io/).

## Prerequisites

Install k6:

```bash
# macOS
brew install k6

# Or download from https://k6.io/docs/get-started/installation/
```

## Quick Start

```bash
# 1. Start the app locally
bun run dev

# 2. Run smoke test (quick sanity check)
bun run k6:smoke

# 3. If smoke passes, run load test
bun run k6:load
```

## Test Profiles

| Profile | VUs | Duration | Purpose |
|---------|-----|----------|---------|
| `k6:smoke` | 5-10 | 2 min | Quick sanity check |
| `k6:load` | 200 | 12 min | Normal load testing |
| `k6:stress` | 500 | 16 min | Find breaking point |
| `k6:soak` | 100 | 30 min | Detect memory leaks |

## Test Scenarios

| Scenario | Description |
|----------|-------------|
| `k6:browsing` | Customer browsing menus |
| `k6:ordering` | Full checkout flow |
| `k6:kitchen` | Kitchen order monitoring |

## Test Data

Before running tests, you need a test store:

1. **Option 1**: Create a store with slug `load-test-restaurant` via the console
2. **Option 2**: Pass a custom store slug:
   ```bash
   k6 run --env TEST_STORE_SLUG=my-store k6/profiles/smoke.js
   ```

## Directory Structure

```
k6/
├── config/
│   ├── environments.js    # Local/staging/production configs
│   └── thresholds.js      # Performance thresholds
├── lib/
│   ├── http-client.js     # HTTP helpers
│   ├── data-generators.js # Test data factories
│   └── metrics.js         # Custom k6 metrics
├── scenarios/
│   ├── customer-browsing.js
│   ├── customer-ordering.js
│   ├── kitchen-operations.js
│   ├── mixed-load.js
│   └── quick-test.js      # Fast sanity check
├── profiles/
│   ├── smoke.js
│   ├── load.js
│   ├── stress.js
│   └── soak.js
├── scripts/
│   └── analyze-performance.sh  # SSH server analysis
├── mocks/
│   └── stripe-mock-server.js
└── results/               # Test output (gitignored)
```

## Key Metrics

| Metric | Target (p95) | Warning |
|--------|--------------|---------|
| Menu load time | < 3s | < 5s |
| Order creation | < 1.5s | < 3s |
| Kitchen poll | < 500ms | < 1s |
| Error rate | < 1% | < 5% |

## Known Bottlenecks

1. **Database Connection Pool** (20 max)
   - Primary risk under load
   - Symptoms: 503 errors, high wait times

2. **Menu Query** (getStoreBySlug)
   - Complex nested JSONB translations
   - Most resource-intensive query

3. **Kitchen Polling**
   - 5-second intervals = sustained DB pressure
   - Multiple monitors multiply the load

## Environment Variables

```bash
# Target environment (default: local)
TARGET_ENV=local|staging|production

# Test store (default: load-test-restaurant)
TEST_STORE_SLUG=my-store

# Test store ID for kitchen tests
TEST_STORE_ID=1
```

## Results Analysis

k6 outputs results to stdout. For detailed analysis:

```bash
# Save results to JSON
k6 run --out json=results/test.json k6/profiles/load.js

# View in k6 Cloud (optional)
k6 cloud k6/profiles/load.js
```

## Server-Side Performance Analysis

Analyze bottlenecks while k6 runs using SSH:

```bash
# Terminal 1: Run k6 load test
k6 run --env TARGET_ENV=production -e TEST_STORE_SLUG=pizza-weso k6/scenarios/quick-test.js

# Terminal 2: SSH and run analysis
ssh deploy@your-vps "bash -s" < k6/scripts/analyze-performance.sh
```

### Analysis Modes

| Mode | Command | Purpose |
|------|---------|---------|
| Full snapshot | `MODE=full` (default) | System + Docker + PostgreSQL + Network |
| Live monitor | `MODE=monitor INTERVAL=5 DURATION=60` | Continuous updates every 5s |
| PostgreSQL deep | `MODE=postgres STORE_SLUG=pizza-weso` | EXPLAIN ANALYZE + indexes |
| Connection pool | `MODE=pool` | Pool status, waiting conns, client breakdown |
| System only | `MODE=system` | CPU, memory, disk |
| Docker only | `MODE=docker` | Container stats |

### What It Reveals

| Check | Bottleneck Indicator |
|-------|---------------------|
| Active connections ≥ 18 | Connection pool exhausted |
| Queries > 200ms | Slow database queries |
| Cache hit ratio < 95% | Data not in memory |
| Container CPU > 80% | CPU-bound |
| Seq Scan in EXPLAIN | Missing index |

## Stripe Mock Server

For testing checkout flows without hitting real Stripe:

```bash
# Terminal 1: Start mock server
bun run k6:mock:stripe

# Terminal 2: Run tests
bun run k6:ordering
```

The mock server runs on port 4242 and simulates:
- Session creation (50-200ms latency)
- Payment completion (after 5 seconds)
- Session expiry
