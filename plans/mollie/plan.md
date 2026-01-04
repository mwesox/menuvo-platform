# Stripe to Mollie Migration Plan

> **Task Tracker**: See `tasks.md` for checklist progress
> **Created**: 2026-01-04

---

## Overview

Migrate from Stripe to Mollie for all payment functionality:
- **Order Payments**: Customer checkout for food orders (with PayPal support)
- **SaaS Subscriptions**: Merchant billing (Starter/Pro/Max tiers)
- **Merchant Connect**: Platform model with application fees

**Approach**: Parallel period - run both providers, migrate merchants gradually.

**Why Mollie?**
- Native PayPal support (popular in Germany)
- More user-friendly merchant onboarding
- Connected platforms with application fees
- Better German payment method support (iDEAL, giropay, etc.)

---

## Current Stripe Architecture

### What We Have
1. **Order Payments**: Embedded Stripe Checkout with 5% platform fee
2. **Merchant Subscriptions**: 30-day trial → Paid tiers (Starter/Pro/Max)
3. **Stripe Connect V2**: Merchants get individual accounts with KYC
4. **Webhooks**: V1 events + V2 thin events, Redis queue processing

### Key Files
- `src/lib/stripe/` - Core Stripe utilities
- `src/features/orders/server/stripe-checkout.functions.ts` - Order payments
- `src/features/console/settings/server/payments.functions.ts` - Merchant onboarding
- `src/features/console/settings/server/subscription.functions.ts` - SaaS billing
- `src/lib/stripe/handlers/` - Webhook handlers

---

## Phase 1: Infrastructure Setup

### 1.1 Install Dependencies
```bash
bun add @mollie/api-client
```

### 1.2 Database Schema Changes (`src/db/schema.ts`)

Add Mollie fields to `merchants` table:
```typescript
// Mollie Connect (Platform) - OAuth tokens for M2M operations
mollieCustomerId: text("mollie_customer_id"),           // cst_xxx (for subscriptions)
mollieOrganizationId: text("mollie_organization_id"),   // org_xxx
mollieProfileId: text("mollie_profile_id"),             // pfl_xxx
mollieAccessToken: text("mollie_access_token"),         // OAuth access token (encrypted)
mollieRefreshToken: text("mollie_refresh_token"),       // OAuth refresh token (encrypted)
mollieTokenExpiresAt: timestamp("mollie_token_expires_at"), // Token expiry
mollieOnboardingStatus: text("mollie_onboarding_status"), // needs-data | in-review | completed
mollieCanReceivePayments: boolean("mollie_can_receive_payments").default(false),
mollieCanReceiveSettlements: boolean("mollie_can_receive_settlements").default(false),

// Mollie Subscriptions (mandate-based)
mollieMandateId: text("mollie_mandate_id"),             // mdt_xxx
mollieMandateStatus: text("mollie_mandate_status"),     // pending | valid | invalid
mollieSubscriptionId: text("mollie_subscription_id"),   // sub_xxx
mollieSubscriptionStatus: text("mollie_subscription_status"), // active | pending | canceled | suspended

// Provider tracking
paymentProvider: text("payment_provider").default("stripe"), // stripe | mollie
```

Add to `orders` table:
```typescript
molliePaymentId: text("mollie_payment_id"),       // tr_xxx
mollieCheckoutUrl: text("mollie_checkout_url"),
paymentProvider: text("payment_provider"),        // stripe | mollie
```

New `mollieEvents` table (mirror stripeEvents):
```typescript
export const mollieEvents = pgTable("mollie_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  resourceId: text("resource_id"),
  resourceType: text("resource_type"),
  payload: jsonb("payload").notNull(),
  receivedAt: timestamp("received_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processingStatus: text("processing_status").default("PENDING"),
  retryCount: integer("retry_count").default(0),
});
```

### 1.3 Environment Variables (`src/env.ts`)

```typescript
// Mollie
MOLLIE_API_KEY: z.string().min(1),
MOLLIE_CLIENT_ID: z.string().min(1),
MOLLIE_CLIENT_SECRET: z.string().min(1),
MOLLIE_REDIRECT_URI: z.string().url(),
MOLLIE_PRICE_STARTER: z.string().default("29.00"),
MOLLIE_PRICE_PRO: z.string().default("79.00"),
MOLLIE_PRICE_MAX: z.string().default("199.00"),
```

---

## Phase 2: Mollie Library (`src/lib/mollie/`)

Create structure mirroring `src/lib/stripe/`:

```
src/lib/mollie/
├── client.ts              # Mollie client singleton
├── connect.ts             # Client Links API, OAuth, M2M token management
├── subscriptions.ts       # Mandate + subscription management
├── payments.ts            # Order payment creation
├── events.ts              # Event ingestion
├── processor.ts           # Event routing
├── index.ts
└── handlers/
    ├── registry.ts
    ├── payment.handler.ts
    ├── subscription.handler.ts
    └── onboarding.handler.ts
```

### Key Implementations:

**client.ts**
```typescript
import createMollieClient from "@mollie/api-client";

let client: ReturnType<typeof createMollieClient> | null = null;

export function getMollieClient() {
  if (!client) {
    client = createMollieClient({ apiKey: env.MOLLIE_API_KEY });
  }
  return client;
}
```

**payments.ts** - Order checkout
```typescript
export async function createOrderPayment(input: {
  orderId: number;
  storeId: number;
  amount: { value: string; currency: string };
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  profileId?: string;
  applicationFee?: { amount: { value: string; currency: string } };
}) {
  const mollie = getMollieClient();
  const payment = await mollie.payments.create({
    amount: input.amount,
    description: input.description,
    redirectUrl: input.redirectUrl,
    webhookUrl: input.webhookUrl,
    locale: "de_DE",
    metadata: { orderId: String(input.orderId), storeId: String(input.storeId) },
    profileId: input.profileId,
    applicationFee: input.applicationFee,
  });
  return { paymentId: payment.id, checkoutUrl: payment._links.checkout?.href };
}
```

**subscriptions.ts** - Mandate-based recurring
```typescript
// Step 1: First payment creates mandate
export async function createFirstPaymentForMandate(params: {
  customerId: string;
  amount: { value: string; currency: string };
  description: string;
  redirectUrl: string;
  webhookUrl: string;
}) {
  const mollie = getMollieClient();
  return mollie.payments.create({
    ...params,
    sequenceType: "first", // Creates mandate
  });
}

// Step 2: Create subscription after mandate is valid
export async function createSubscription(params: {
  customerId: string;
  amount: { value: string; currency: string };
  interval: string; // "1 month"
  description: string;
  webhookUrl: string;
}) {
  const mollie = getMollieClient();
  return mollie.customerSubscriptions.create(params);
}
```

**connect.ts** - Merchant onboarding + M2M token management
```typescript
export async function createClientLink(input: { name: string; email: string }) {
  const mollie = getMollieClient();
  const clientLink = await mollie.clientLinks.create({
    owner: {
      email: input.email,
      givenName: input.name.split(" ")[0],
      familyName: input.name.split(" ").slice(1).join(" ")
    },
    name: input.name,
    address: { country: "DE" },
  });
  return {
    clientLinkId: clientLink.id,
    redirectUrl: `${clientLink._links.clientLink.href}?client_id=${env.MOLLIE_CLIENT_ID}&response_type=code`,
  };
}

export async function exchangeCodeForTokens(code: string) {
  // OAuth token exchange - returns access_token, refresh_token, expires_in
  // Store tokens encrypted in DB for M2M operations
}

// Auto-refresh tokens before expiry - M2M operations
export async function getMerchantMollieClient(merchantId: number) {
  const merchant = await db.query.merchants.findFirst({ where: eq(merchants.id, merchantId) });

  // Check if token expired/expiring soon (5 min buffer)
  if (merchant.mollieTokenExpiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    const newTokens = await refreshAccessToken(merchant.mollieRefreshToken);
    await db.update(merchants).set({
      mollieAccessToken: encrypt(newTokens.access_token),
      mollieRefreshToken: encrypt(newTokens.refresh_token),
      mollieTokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
    }).where(eq(merchants.id, merchantId));
    return createMollieClient({ accessToken: newTokens.access_token });
  }

  return createMollieClient({ accessToken: decrypt(merchant.mollieAccessToken) });
}
```

---

## Phase 3: Webhook Handler

### 3.1 Add Route (`src/worker/http/router.ts`)
```typescript
if (url.pathname === "/webhooks/mollie" && method === "POST") {
  return handleMollieWebhook(req);
}
```

### 3.2 Handler (`src/worker/http/handlers/mollie.ts`)

Mollie webhooks only send resource ID - must fetch full data:
```typescript
export async function handleMollieWebhook(req: Request) {
  const formData = await req.formData();
  const id = formData.get("id") as string;

  const mollie = getMollieClient();

  // Fetch full resource based on ID prefix
  if (id.startsWith("tr_")) {
    const payment = await mollie.payments.get(id);
    // Process payment status change
  } else if (id.startsWith("sub_")) {
    // Handle subscription event
  }

  return Response.json({ received: true });
}
```

### 3.3 Payment Handler (`src/lib/mollie/handlers/payment.handler.ts`)
```typescript
// payment.paid → Update order status to confirmed/paid
// payment.failed → Update order status to cancelled/failed
// payment.expired → Update order status to cancelled/expired
```

---

## Phase 4: Feature Server Functions

### 4.1 Order Payments (`src/features/orders/server/mollie-checkout.functions.ts`)

```typescript
export const createMollieCheckout = createServerFn({ method: "POST" })
  .inputValidator(z.object({ orderId: z.number(), returnUrl: z.string() }))
  .handler(async ({ data }) => {
    // 1. Get order + merchant
    // 2. Check merchant.mollieCanReceivePayments
    // 3. Create payment with 5% applicationFee
    // 4. Update order with molliePaymentId
    // 5. Return checkoutUrl for redirect
  });

export const getMolliePaymentStatus = createServerFn({ method: "GET" })
  .inputValidator(z.object({ paymentId: z.string() }))
  .handler(async ({ data }) => {
    // Poll payment status for return page
  });
```

### 4.2 Merchant Onboarding (`src/features/console/settings/server/payments.functions.ts`)

Add alongside existing Stripe functions:
```typescript
export const setupMolliePaymentAccount = createServerFn({ method: "POST" })
  .middleware([withAuth])
  .handler(async ({ context }) => {
    // 1. Create Mollie customer (for subscriptions)
    // 2. Create Client Link for organization onboarding
    // 3. Return onboardingUrl
  });

export const completeMollieOAuth = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string() }))
  .middleware([withAuth])
  .handler(async ({ context, data }) => {
    // 1. Exchange code for tokens
    // 2. Store tokens encrypted for M2M operations
    // 3. Get organization/onboarding status
    // 4. Update merchant with Mollie IDs
  });
```

### 4.3 Subscriptions (`src/features/console/settings/server/subscription.functions.ts`)

Add Mollie subscription functions:
```typescript
export const createMollieSubscriptionPayment = createServerFn({ method: "POST" })
  .middleware([withAuth])
  .handler(async ({ context }) => {
    // Create first payment to establish mandate
    // After mandate valid (via webhook), create subscription
  });
```

---

## Phase 5: UI Changes

### 5.1 Checkout Component (`src/features/shop/checkout/components/`)

New `mollie-checkout.tsx`:
```typescript
// Redirect-based checkout (Mollie hosted page)
// Shows "Pay Now" button that redirects to Mollie
// Supports PayPal, iDEAL, cards, etc.
```

Update checkout flow to choose provider based on `merchant.paymentProvider`.

### 5.2 Merchant Settings (`src/features/console/settings/components/payments/`)

Add Mollie onboarding card showing:
- Setup button → Client Links flow
- Onboarding status (needs-data / in-review / completed)
- PayPal + other German payment methods as benefits

---

## Phase 6: Queue Processor

### 6.1 New Queue (`src/lib/queue/mollie-event-queue.ts`)
```typescript
export async function enqueueMollieEvent(eventId: string) { /* Redis queue */ }
```

### 6.2 Processor (`src/worker/processors/mollie-events.ts`)
```typescript
// Mirror stripe-events.ts structure
// BRPOP from mollie:events queue
// Route to handlers via registry
```

---

## Phase 7: Refunds via Platform

You can offer a "Refund" button in your console orders page that triggers refunds on the merchant's behalf (M2M via stored OAuth tokens):

### Server Function (`src/features/console/orders/server/refunds.functions.ts`)
```typescript
export const createMollieRefund = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    orderId: z.number(),
    amount: z.string().optional(), // Partial refund, or full if omitted
  }))
  .middleware([withAuth])
  .handler(async ({ context, data }) => {
    const order = await getOrderWithMerchant(data.orderId, context.auth.merchantId);

    if (!order.molliePaymentId) throw new Error("No Mollie payment for this order");

    const mollie = getMollieClient();
    const refund = await mollie.paymentRefunds.create({
      paymentId: order.molliePaymentId,
      amount: data.amount
        ? { value: data.amount, currency: "EUR" }
        : undefined, // Full refund if no amount
      description: `Refund for order #${order.id}`,
    });

    await db.update(orders)
      .set({ paymentStatus: "refunded" })
      .where(eq(orders.id, data.orderId));

    return { refundId: refund.id, status: refund.status };
  });
```

### Webhook Handler
Add `refund.settled` and `refund.failed` handlers to update order status.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add Mollie fields to merchants, orders |
| `src/env.ts` | Add Mollie env vars |
| `src/worker/http/router.ts` | Add /webhooks/mollie route |
| `src/features/orders/server/` | Add mollie-checkout.functions.ts |
| `src/features/console/settings/server/payments.functions.ts` | Add Mollie onboarding |
| `src/features/console/settings/server/subscription.functions.ts` | Add Mollie subscriptions |
| `src/features/shop/checkout/components/` | Add MollieCheckout component |
| `src/features/console/settings/components/payments/` | Add Mollie settings UI |

## New Files to Create

```
src/lib/mollie/
├── client.ts
├── connect.ts
├── subscriptions.ts
├── payments.ts
├── events.ts
├── processor.ts
├── index.ts
└── handlers/
    ├── registry.ts
    ├── index.ts
    ├── payment.handler.ts
    ├── subscription.handler.ts
    └── onboarding.handler.ts

src/lib/queue/mollie-event-queue.ts
src/worker/http/handlers/mollie.ts
src/worker/processors/mollie-events.ts
src/features/orders/server/mollie-checkout.functions.ts
src/features/shop/checkout/components/mollie-checkout.tsx
```

---

## Key Differences from Stripe

| Aspect | Stripe | Mollie |
|--------|--------|--------|
| Checkout | Embedded iframe | Hosted redirect |
| Webhooks | Full event payload | Resource ID only (must fetch) |
| Connect | V2 Accounts API | OAuth + Client Links |
| Subscriptions | Direct creation | Requires first payment → mandate |
| PayPal | Separate integration | Native |
| Refunds | Platform can manage | Platform triggers via API (M2M with OAuth tokens) |
| Token Management | N/A | Store encrypted, auto-refresh |

---

## M2M (Machine-to-Machine) Flow

After one-time merchant onboarding:
1. **One-time onboarding**: Merchant clicks "Connect to Mollie" → Co-branded flow → KYC verification
2. **Store OAuth tokens**: Access + refresh tokens stored encrypted in DB
3. **M2M operations**: Use `getMerchantMollieClient(merchantId)` - auto-refreshes tokens
4. **No merchant login needed**: All API operations work via stored tokens

---

## Rollout Strategy

1. **Week 1-2**: Infrastructure (schema, lib, env vars)
2. **Week 3-4**: Order payments (test mode)
3. **Week 5-6**: Merchant onboarding (Client Links)
4. **Week 7-8**: Subscriptions (mandate flow)
5. **Week 9+**: Enable for new merchants, migrate existing gradually

---

## References

- [Mollie API Docs](https://docs.mollie.com/)
- [Mollie Node.js SDK](https://github.com/mollie/mollie-api-node)
- [Mollie Connect for Platforms](https://docs.mollie.com/docs/connect-platforms-getting-started)
- [Mollie Recurring Payments](https://docs.mollie.com/docs/recurring-payments)
- [Mollie Components](https://docs.mollie.com/docs/mollie-components)
