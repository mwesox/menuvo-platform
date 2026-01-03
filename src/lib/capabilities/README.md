# Capabilities

A system for determining what merchants and stores can do. Inspired by [Stripe's account capabilities](https://docs.stripe.com/connect/capabilities).

## Concept

Capabilities are **computed** (derived from existing data), not stored. This ensures they're always consistent with the source data.

### Two Levels

| Level | Scope | Example |
|-------|-------|---------|
| **Merchant** | Applies to all stores | Payment processing |
| **Store** | Per-store settings | Order types, hours |

Store capabilities inherit from merchant capabilities.

## Current Capabilities

### Merchant Level

| Capability | Derived From | Description |
|------------|--------------|-------------|
| `canAcceptOnlinePayment` | `paymentCapabilitiesStatus === "active"` | Can process Stripe payments |

### Store Level

| Capability | Source | Description |
|------------|--------|-------------|
| `canAcceptOnlinePayment` | Inherited from merchant | Can accept online payment |

## Usage

### Server-side validation (defense in depth)

```typescript
import { computeMerchantCapabilities } from "@/lib/capabilities";

// In createCheckoutSession
const caps = computeMerchantCapabilities(order.store.merchant);
if (!caps.canAcceptOnlinePayment) {
  throw new Error("Merchant cannot accept online payments");
}
```

### Client-side (UI gating)

```typescript
import { computeMerchantCapabilities, computeStoreCapabilities } from "@/lib/capabilities";

const merchantCaps = computeMerchantCapabilities(store.merchant);
const storeCaps = computeStoreCapabilities(merchantCaps);

if (!storeCaps.canAcceptOnlinePayment) {
  return <PaymentUnavailableMessage />;
}
```

## Why Computed?

- **Always consistent** - No sync issues between source data and capabilities
- **No migrations** - Adding a new capability is just code, no DB changes
- **Single source of truth** - Capability logic lives in one place
- **Testable** - Pure functions, easy to unit test

## Future Ideas

### Merchant Capabilities

| Capability | Derived From | Description |
|------------|--------------|-------------|
| `canProcessRefunds` | `paymentCapabilitiesStatus === "active"` | Can issue refunds |
| `canHaveMultipleStores` | Subscription tier | Premium feature |
| `canUseAiMenuImport` | Subscription tier | AI-powered import |
| `canUseCustomDomain` | Subscription tier | Custom domain support |
| `maxMenuItems` | Subscription tier | Item limit per menu |

### Store Capabilities

| Capability | Derived From | Description |
|------------|--------------|-------------|
| `isPublished` | `store.isPublished` | Visible to customers |
| `acceptsOrders` | `store.acceptsOrders` | Accepting orders now |
| `acceptsDineIn` | `store.orderTypes` | Dine-in enabled |
| `acceptsPickup` | `store.orderTypes` | Pickup enabled |
| `acceptsDelivery` | `store.orderTypes` | Delivery enabled |
| `acceptsCashPayment` | `store.paymentMethods` | Cash payment option |
| `canAcceptReservations` | Feature flag | Table reservations |
| `canUseQrOrdering` | Feature flag | QR code ordering |

### Subscription-Based Capabilities

Some capabilities could be tied to subscription tiers:

```typescript
function computeMerchantCapabilities(merchant: MerchantData): MerchantCapabilities {
  const tier = merchant.subscriptionTier ?? "free";

  return {
    canAcceptOnlinePayment: merchant.paymentCapabilitiesStatus === "active",
    canHaveMultipleStores: tier === "pro" || tier === "enterprise",
    canUseAiMenuImport: tier !== "free",
    maxMenuItems: tier === "free" ? 50 : tier === "pro" ? 500 : Infinity,
  };
}
```

## Design Decisions

### Why not store in DB?

Storing capabilities would require:
- Sync logic when source data changes
- Migrations when adding capabilities
- Potential inconsistencies

Computed capabilities avoid all of this.

### Why separate merchant and store?

- Payment is a merchant-level concern (Stripe Connect account)
- Order settings are store-level (each store can have different hours, order types)
- Clean separation of concerns
