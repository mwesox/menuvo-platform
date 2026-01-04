# Stripe to Mollie Migration - Task Tracker

> **Status**: Phase 1-8 Complete
> **Last Updated**: 2026-01-04
> **Full Plan**: `~/.claude/plans/structured-swimming-castle.md`

---

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| 1. Infrastructure | ✅ Complete | 5/5 |
| 2. Mollie Library | ✅ Complete | 6/6 |
| 3. Webhooks | ✅ Complete | 4/4 |
| 4. Order Payments | ✅ Complete | 4/4 |
| 5. Merchant Onboarding | ✅ Complete | 5/5 |
| 6. Subscriptions | ✅ Complete | 4/4 |
| 7. Refunds | ✅ Complete | 3/3 |
| 8. UI Components | ✅ Complete | 4/4 |
| 9. Testing | ⬜ Not Started | 0/3 |

---

## Phase 1: Infrastructure Setup ✅

- [x] **1.1** Install `@mollie/api-client` dependency
  ```bash
  bun add @mollie/api-client
  ```

- [x] **1.2** Add Mollie env vars to `src/env.ts`
  - MOLLIE_API_KEY
  - MOLLIE_CLIENT_ID
  - MOLLIE_CLIENT_SECRET
  - MOLLIE_REDIRECT_URI
  - MOLLIE_PRICE_STARTER/PRO/MAX

- [x] **1.3** Update `src/db/schema.ts` - Add Mollie fields to merchants table
  - mollieCustomerId, mollieOrganizationId, mollieProfileId
  - mollieAccessToken, mollieRefreshToken, mollieTokenExpiresAt
  - mollieOnboardingStatus, mollieCanReceivePayments, mollieCanReceiveSettlements
  - mollieMandateId, mollieMandateStatus
  - mollieSubscriptionId, mollieSubscriptionStatus
  - paymentProvider

- [x] **1.4** Update `src/db/schema.ts` - Add Mollie fields to orders table
  - molliePaymentId, mollieCheckoutUrl, orderPaymentProvider

- [x] **1.5** Create `mollieEvents` table in schema
  - id, eventType, resourceId, resourceType, merchantId, payload
  - receivedAt, processedAt, processingStatus, retryCount

---

## Phase 2: Mollie Library (`src/lib/mollie/`) ✅

- [x] **2.1** Create `src/lib/mollie/client.ts`
  - getMollieClient() singleton
  - createMollieClientWithToken() for connected accounts

- [x] **2.2** Create `src/lib/mollie/payments.ts`
  - createOrderPayment() - with applicationFee for platform model
  - getPayment()
  - cancelPayment()

- [x] **2.3** Create `src/lib/mollie/subscriptions.ts`
  - createFirstPaymentForMandate() - sequenceType: "first"
  - createSubscription() - after mandate valid
  - getSubscription(), cancelSubscription()
  - getMandates(), getMandate(), hasValidMandate(), revokeMandate()

- [x] **2.4** Create `src/lib/mollie/connect.ts`
  - createClientLink() - co-branded onboarding
  - getOAuthUrl() - generate OAuth URL
  - exchangeCodeForTokens() - OAuth callback
  - refreshAccessToken() - token refresh
  - createMollieClientWithToken() - M2M operations
  - getOnboardingStatus()

- [x] **2.5** Create `src/lib/mollie/events.ts`
  - ingestMollieEvent() - store in mollieEvents table (idempotent)
  - markEventProcessed(), markEventFailed()
  - getEventById(), incrementRetryCount(), getRetryCount()

- [x] **2.6** Create `src/lib/mollie/index.ts` + `handlers/registry.ts` + `processor.ts`
  - Barrel exports
  - Handler registry with registerMollieHandler(), dispatchMollieEvent()
  - processMollieEvent() for queue worker

---

## Phase 3: Webhook Handler ✅

- [x] **3.1** Add route in `src/worker/http/router.ts`
  - POST /webhooks/mollie → handleMollieWebhook

- [x] **3.2** Create `src/worker/http/handlers/mollie.ts`
  - Parse form data (id field)
  - Fetch full resource from Mollie API
  - Ingest event, enqueue for processing

- [x] **3.3** Create `src/lib/mollie/handlers/` directory
  - registry.ts - handler registration
  - payment.handler.ts - payment.paid, payment.failed, payment.expired
  - subscription.handler.ts - subscription events
  - (onboarding.handler.ts - deferred to Phase 5)

- [x] **3.4** Create `src/lib/mollie/processor.ts`
  - Route events to handlers by type
  - Also created: `src/lib/queue/mollie-event-queue.ts`
  - Also created: `src/worker/processors/mollie-events.ts`

---

## Phase 4: Order Payments ✅

- [x] **4.1** Create `src/features/orders/server/mollie-checkout.functions.ts`
  - createMolliePayment() - create payment, return checkoutUrl
  - getMolliePaymentStatus() - poll status for return page
  - cancelMolliePayment() - cancel payment when customer abandons

- [x] **4.2** Update payment.handler.ts
  - On payment.paid: update order status to confirmed/paid
  - On payment.failed/expired: update order to cancelled

- [x] **4.3** Create `src/lib/queue/mollie-event-queue.ts`
  - enqueueMollieEvent()
  - Redis queue: mollie:events

- [x] **4.4** Create `src/worker/processors/mollie-events.ts`
  - BRPOP from queue, process via handlers

---

## Phase 5: Merchant Onboarding ✅

- [x] **5.1** Add to `src/features/console/settings/server/payments.functions.ts`
  - setupMolliePaymentAccount() - create customer + client link
  - completeMollieOAuth() - exchange code, store tokens
  - refreshMolliePaymentStatus() - sync onboarding status
  - getMolliePaymentStatus() - get current status

- [x] **5.2** Create OAuth callback route
  - /console/oauth/mollie/callback → completeMollieOAuth

- [x] **5.3** Add token encryption/decryption helpers
  - Created `src/lib/crypto.ts` with AES-256-GCM encryption
  - Added ENCRYPTION_KEY env var

- [x] **5.4** Update onboarding status via webhook
  - Status is synced via refreshMolliePaymentStatus()
  - Webhook handlers can be added later if real-time updates needed

- [x] **5.5** Add getMerchantMollieClient() with auto-refresh
  - Added to `src/lib/mollie/connect.ts`
  - Automatically refreshes tokens when expiring within 5 minutes
  - Added storeMerchantTokens() helper

---

## Phase 6: Subscriptions (SaaS Billing) ✅

- [x] **6.1** Add to `src/features/console/settings/server/subscription.functions.ts`
  - createMollieSubscriptionPayment() - first payment for mandate
  - getMollieSubscriptionStatus()
  - cancelMollieSubscription()

- [x] **6.2** Handle first payment completion in webhook
  - On payment.paid with type=subscription_first_payment
  - Create actual subscription via API
  - Updated `src/lib/mollie/handlers/payment.handler.ts`

- [x] **6.3** subscription.handler.ts already handles all events
  - subscription.created, subscription.updated, subscription.canceled
  - subscription.suspended, subscription.resumed

- [x] **6.4** Sync subscription status to merchant record
  - All handlers update mollieSubscriptionId and mollieSubscriptionStatus

---

## Phase 7: Refunds ✅

- [x] **7.1** Create `src/features/console/orders/server/refunds.functions.ts`
  - createMollieRefund() - full or partial refund via M2M using merchant OAuth tokens
  - getMollieRefundStatus() - query refund status from Mollie API
  - Uses getMerchantMollieClient() for auto-token-refresh

- [x] **7.2** Add refund webhook handlers
  - Created `src/lib/mollie/handlers/refund.handler.ts`
  - Handles refund.settled - updates order paymentStatus to "refunded"
  - Handles refund.failed - reverts order paymentStatus to "paid" if needed
  - Registered in `src/lib/mollie/handlers/index.ts`

- [x] **7.3** Update order paymentStatus on refund
  - On refund creation: optimistically sets to "refunded"
  - On refund.settled webhook: confirms "refunded" status
  - On refund.failed webhook: reverts to "paid" status
  - Note: Using existing "refunded" status for both full and partial refunds

---

## Phase 8: UI Components ✅

- [x] **8.1** Create `src/features/shop/checkout/components/mollie-checkout.tsx`
  - Redirect-based checkout (Pay Now button -> Mollie hosted page)
  - Created component with loading states and error handling
  - Added useCreateMolliePayment hook in queries.ts

- [x] **8.2** Update checkout flow to choose provider
  - Updated `src/features/shop/checkout/components/checkout-page.tsx`
  - Added getActivePaymentProvider() function
  - Supports both Stripe (embedded) and Mollie (redirect) flows
  - Updated shop.functions.ts to include paymentProvider in store data
  - Updated checkout return page to handle both providers

- [x] **8.3** Add Mollie onboarding UI in console settings
  - Created `src/features/console/settings/components/payments/mollie-setup-card.tsx`
  - Created `src/features/console/settings/components/payments/mollie-status-card.tsx`
  - Updated `payments-page.tsx` with tabbed interface (Mollie/Stripe)
  - Added Mollie-specific queries and mutations
  - Displays PayPal badge as key benefit

- [x] **8.4** Add refund button to order details page
  - Created `src/features/console/orders/components/refund-button.tsx`
  - Created `src/features/console/orders/queries.ts` with useCreateMollieRefund hook
  - Created `src/features/console/orders/index.ts` barrel export
  - Button only shows for Mollie orders with status "paid"
  - Supports both full and partial refunds

---

## Phase 9: Testing & Rollout

- [ ] **9.1** Test with Mollie test mode (test_xxx API key)
  - Order payment flow
  - Subscription first payment + mandate
  - Webhook processing

- [ ] **9.2** Deploy to staging with feature flag

- [ ] **9.3** Enable for new merchants, migrate existing gradually

---

## Key Files Reference

| Purpose | File |
|---------|------|
| DB Schema | `src/db/schema.ts` |
| Env Vars | `src/env.ts` |
| Mollie Client | `src/lib/mollie/client.ts` |
| Order Payments | `src/features/orders/server/mollie-checkout.functions.ts` |
| Merchant Onboarding | `src/features/console/settings/server/payments.functions.ts` |
| Subscriptions | `src/features/console/settings/server/subscription.functions.ts` |
| Refunds | `src/features/console/orders/server/refunds.functions.ts` |
| Webhook Handler | `src/worker/http/handlers/mollie.ts` |
| Event Processors | `src/lib/mollie/handlers/*.ts` |
| Refund Handler | `src/lib/mollie/handlers/refund.handler.ts` |
| Token Encryption | `src/lib/crypto.ts` |
| OAuth Callback | `src/routes/console/oauth/mollie/callback.tsx` |
| Checkout UI | `src/features/shop/checkout/components/mollie-checkout.tsx` |
| Checkout Page | `src/features/shop/checkout/components/checkout-page.tsx` |
| Checkout Queries | `src/features/shop/checkout/queries.ts` |
| Checkout Return | `src/features/shop/checkout/components/checkout-return-page.tsx` |
| Payment Settings | `src/features/console/settings/components/payments/payments-page.tsx` |
| Mollie Setup Card | `src/features/console/settings/components/payments/mollie-setup-card.tsx` |
| Mollie Status Card | `src/features/console/settings/components/payments/mollie-status-card.tsx` |
| Settings Queries | `src/features/console/settings/queries.ts` |
| Refund Button | `src/features/console/orders/components/refund-button.tsx` |
| Console Orders | `src/features/console/orders/index.ts` |

---

## Notes

- **Parallel Period**: Keep Stripe code active, add `paymentProvider` field to switch per-merchant
- **M2M Operations**: Store OAuth tokens encrypted, auto-refresh before expiry
- **Platform Model**: 5% application fee on order payments
- **PayPal**: Native Mollie support - main reason for migration
- **Refunds**: Platform can trigger via API, merchants can also use Mollie dashboard

---

## Resume Instructions

If context is lost, read these files to resume:
1. This file for task status
2. `~/.claude/plans/structured-swimming-castle.md` for full implementation details
3. `src/lib/stripe/` for patterns to follow
4. `src/db/schema.ts` for current schema state
