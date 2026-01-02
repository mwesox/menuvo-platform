# Orders Feature Architecture

## Summary

| Aspect | Decision |
|--------|----------|
| **Shared backend** | `src/features/orders/` - server functions, logic, validation |
| **Console: Orders** | `src/features/console/orders/` - back-office management & history |
| **Console: Kitchen** | `src/features/console/kitchen/` - real-time kitchen monitor |
| **Shop UI** | `src/features/shop/checkout/` - checkout flow for customers |
| **Customer auth** | Guest checkout (accounts later) |
| **Payment** | Stripe Checkout for takeaway, pay-at-counter for dine-in |
| **Payment confirmation** | Webhook-based - order only visible to kitchen after payment confirmed |
| **Updates** | Orders: 30s polling / Kitchen: 5-10s polling |

---

## Overview

Design an orders system that shares backend logic between **console** (merchant view) and **shop** (customer view) while maintaining separate UI components appropriate for each audience.

---

## Current State

- **No order database schema exists** - Only client-side cart in Zustand
- **Cart is store-scoped** - One cart per store, cleared on store switch
- **Cart has full item data** - Captures `itemId`, `name`, `basePrice`, `selectedOptions[]`, `totalPrice`
- **No checkout flow** - Cart exists but cannot be submitted
- **Stripe integration exists** - At `/lib/stripe/` but not connected to orders

---

## Proposed Architecture

### 1. Shared Backend Feature: `src/features/orders/`

Create a **shared orders feature** that is NOT under `/console/` or `/shop/`:

```
src/features/orders/
├── server/
│   └── orders.functions.ts        # All order mutations & queries
├── logic/
│   ├── order-pricing.ts           # Calculate totals, fees, taxes
│   ├── order-status.ts            # Status transitions, validation
│   └── order-snapshot.ts          # Snapshot cart → order items
├── validation.ts                  # Shared schemas (create, update)
├── queries.ts                     # Shared query keys & options
├── constants.ts                   # Status enums, order types
└── types.ts                       # Shared TypeScript types
```

**Rationale**: Orders are a core domain entity used by both console and shop. Placing it at `features/orders/` (not nested under console or shop) makes it truly shared.

### 2. Shop-Specific: `src/features/shop/checkout/`

Customer-facing checkout and order viewing:

```
src/features/shop/checkout/
├── components/
│   ├── checkout-page.tsx          # Main checkout flow
│   ├── checkout-form.tsx          # Customer details form
│   ├── payment-form.tsx           # Payment method selection
│   ├── order-summary.tsx          # Order preview before submit
│   ├── order-confirmation.tsx     # Post-checkout success page
│   └── order-status-card.tsx      # Order status for customers
├── hooks/
│   └── use-checkout.ts            # Checkout flow logic
├── queries.ts                     # Shop-specific query wrappers
└── validation.ts                  # Checkout form schemas (strings)
```

### 3. Console: Order Management `src/features/console/orders/`

Back-office order viewing, history, and filtering:

```
src/features/console/orders/
├── components/
│   ├── orders-page.tsx            # Master-detail order list
│   ├── order-list-item.tsx        # Order card in list
│   ├── order-detail.tsx           # Full order detail panel
│   ├── order-status-select.tsx    # Status update dropdown
│   ├── order-filters.tsx          # Filter by status/date/type
│   └── order-receipt.tsx          # Printable receipt view
├── queries.ts                     # Console-specific query wrappers
└── index.ts
```

**Use case**: Manager reviews orders, checks history, handles refunds, exports data.

### 4. Console: Kitchen Monitor `src/features/console/kitchen/`

Real-time display for kitchen staff (separate feature):

```
src/features/console/kitchen/
├── components/
│   ├── kitchen-monitor-page.tsx   # Full-screen kitchen display
│   ├── order-ticket.tsx           # Single order ticket card
│   ├── order-queue.tsx            # Queue of pending/preparing orders
│   ├── status-action-button.tsx   # Big touch-friendly status buttons
│   └── kitchen-stats.tsx          # Today's stats (orders, avg time)
├── hooks/
│   └── use-kitchen-polling.ts     # Fast polling (5-10s) or real-time
├── queries.ts                     # Kitchen-specific queries (active only)
└── index.ts
```

**Use case**: Kitchen staff sees incoming orders, marks as preparing/ready. Optimized for:
- Large, readable text
- Touch-friendly buttons
- Fast updates (shorter polling interval)
- Shows only active orders (confirmed, preparing, ready)
- Auto-removes completed/cancelled orders

---

## Order Status & Payment Flow

### Status Enums

**Order Status** (fulfillment workflow):
```typescript
export const orderStatuses = [
  "awaiting_payment",  // Order created, waiting for Stripe payment
  "confirmed",         // Payment confirmed OR pay-at-counter, ready for kitchen
  "preparing",         // Kitchen working on it
  "ready",             // Ready for pickup
  "completed",         // Handed to customer
  "cancelled",         // Cancelled (by customer, merchant, or payment failed)
] as const;
```

**Payment Status** (payment state):
```typescript
export const paymentStatuses = [
  "pending",              // Initial state before payment action
  "awaiting_confirmation", // Sent to Stripe Checkout, waiting for webhook
  "paid",                 // Payment confirmed via Stripe webhook
  "pay_at_counter",       // Dine-in, will pay after eating
  "failed",               // Payment failed
  "refunded",             // Refunded (full or partial)
  "expired",              // Stripe Checkout session expired
] as const;
```

### Visibility Rules

| View | Visible Orders |
|------|----------------|
| **Kitchen Monitor** | `paymentStatus IN ('paid', 'pay_at_counter') AND orderStatus IN ('confirmed', 'preparing', 'ready')` |
| **Order Management** | All orders (with visual distinction for payment-pending) |
| **Customer Confirmation** | Their own order (any status) |

**Key rule**: Orders in `awaiting_payment` status are **NOT visible to kitchen**. They appear only after:
1. Stripe webhook confirms payment (`paymentStatus = 'paid'`)
2. OR order type is dine-in (`paymentStatus = 'pay_at_counter'`)

### Flow 1: Takeaway with Stripe Checkout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TAKEAWAY ORDER FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

Customer                    Our Backend                 Stripe                Kitchen
    │                            │                         │                      │
    │  1. Fill checkout form     │                         │                      │
    │  ─────────────────────────>│                         │                      │
    │                            │                         │                      │
    │                      2. createOrder()                │                      │
    │                         orderStatus: awaiting_payment│                      │
    │                         paymentStatus: pending       │                      │
    │                            │                         │                      │
    │                      3. createStripeCheckoutSession()│                      │
    │                            │────────────────────────>│                      │
    │                            │                         │                      │
    │                      4. Update order                 │                      │
    │                         paymentStatus: awaiting_confirmation               │
    │                         stripeSessionId: sess_xxx    │                      │
    │                            │                         │                      │
    │  5. Redirect to Stripe     │<────────────────────────│                      │
    │  <─────────────────────────│     checkout URL        │                      │
    │                            │                         │                      │
    │  6. Customer pays on Stripe│                         │                      │
    │  ─────────────────────────────────────────────────>  │                      │
    │                            │                         │                      │
    │                            │  7. Webhook: checkout.session.completed        │
    │                            │<────────────────────────│                      │
    │                            │                         │                      │
    │                      8. confirmOrderPayment()        │                      │
    │                         paymentStatus: paid          │                      │
    │                         orderStatus: confirmed       │                      │
    │                         confirmedAt: now()           │                      │
    │                            │                         │                      │
    │                            │                         │      9. Order visible
    │                            │                         │      ───────────────>│
    │                            │                         │                      │
    │  10. Redirect to confirmation page                   │                      │
    │  <─────────────────────────│                         │                      │
    │     /shop/$slug/order/$orderId                       │                      │
    │                            │                         │                      │
```

### Flow 2: Dine-in (Pay at Counter)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DINE-IN ORDER FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Customer                    Our Backend                              Kitchen
    │                            │                                       │
    │  1. Fill checkout form     │                                       │
    │     (orderType: dine_in)   │                                       │
    │  ─────────────────────────>│                                       │
    │                            │                                       │
    │                      2. createOrder()                              │
    │                         orderStatus: confirmed   ──────────────────│
    │                         paymentStatus: pay_at_counter              │
    │                         confirmedAt: now()                         │
    │                            │                                       │
    │                            │           3. Order IMMEDIATELY visible│
    │                            │           ───────────────────────────>│
    │                            │                                       │
    │  4. Redirect to confirmation                                       │
    │  <─────────────────────────│                                       │
    │     /shop/$slug/order/$orderId                                     │
    │                            │                                       │
    │                            │           5. Kitchen prepares order   │
    │                            │           (preparing → ready)         │
    │                            │                                       │
    │  6. Customer picks up & pays at counter                            │
    │  ─────────────────────────>│                                       │
    │                            │                                       │
    │                      7. Mark as completed                          │
    │                         (out of system or via POS)                 │
```

### Flow 3: Payment Failure / Abandonment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PAYMENT FAILURE SCENARIOS                             │
└─────────────────────────────────────────────────────────────────────────────┘

Scenario A: Customer abandons Stripe Checkout
──────────────────────────────────────────────
1. Order created with paymentStatus: awaiting_confirmation
2. Customer closes Stripe Checkout without paying
3. Stripe webhook: checkout.session.expired (after 24h or configured timeout)
4. Update order:
   - paymentStatus: expired
   - orderStatus: cancelled
5. Order stays in history (for analytics) but never reaches kitchen

Scenario B: Payment fails on Stripe
───────────────────────────────────
1. Order in paymentStatus: awaiting_confirmation
2. Stripe webhook: checkout.session.async_payment_failed
   OR payment_intent.payment_failed
3. Update order:
   - paymentStatus: failed
   - orderStatus: cancelled
4. Customer redirected to failure page with retry option

Scenario C: Customer cancels on confirmation page (before payment)
─────────────────────────────────────────────────────────────────
1. Order in paymentStatus: awaiting_confirmation
2. Customer clicks "Cancel Order" on /shop/$slug/order/$orderId
3. Expire Stripe Checkout Session via API
4. Update order:
   - paymentStatus: expired
   - orderStatus: cancelled
```

### Order Status Transitions

```
                    ┌──────────────────┐
                    │ awaiting_payment │ (created, waiting for Stripe)
                    └────────┬─────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────┐     ┌───────────┐     ┌───────────┐
    │ cancelled│     │  expired  │     │ confirmed │ ← Webhook confirms payment
    │  (user)  │     │ (timeout) │     │           │   OR dine-in (immediate)
    └──────────┘     └───────────┘     └─────┬─────┘
                                             │
                                             ▼
                                      ┌───────────┐
                                      │ preparing │ ← Kitchen starts
                                      └─────┬─────┘
                                            │
                              ┌─────────────┼─────────────┐
                              │             │             │
                              ▼             ▼             ▼
                       ┌───────────┐ ┌───────────┐ ┌───────────┐
                       │ cancelled │ │   ready   │ │   ready   │
                       │(merchant) │ └─────┬─────┘ └─────┬─────┘
                       └───────────┘       │             │
                                           ▼             ▼
                                    ┌───────────┐ ┌───────────┐
                                    │ completed │ │ cancelled │
                                    └───────────┘ │(no pickup)│
                                                  └───────────┘
```

### Status Transition Rules

```typescript
// src/features/orders/logic/order-status.ts

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ["confirmed", "cancelled"],  // Via webhook or user cancel
  confirmed: ["preparing", "cancelled"],          // Kitchen starts or merchant cancels
  preparing: ["ready", "cancelled"],              // Kitchen done or issue
  ready: ["completed", "cancelled"],              // Picked up or abandoned
  completed: [],                                  // Terminal state
  cancelled: [],                                  // Terminal state
};

export function canTransitionTo(from: OrderStatus, to: OrderStatus): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}

export function isKitchenVisible(order: Order): boolean {
  const validPayment = order.paymentStatus === "paid" || order.paymentStatus === "pay_at_counter";
  const validStatus = ["confirmed", "preparing", "ready"].includes(order.orderStatus);
  return validPayment && validStatus;
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === "completed" || status === "cancelled";
}
```

### Stripe Integration Points

**Files to create/modify:**

```
src/features/orders/
├── server/
│   ├── orders.functions.ts        # createOrder, updateOrderStatus, etc.
│   └── stripe-checkout.functions.ts  # Stripe Checkout session creation
├── logic/
│   └── order-status.ts            # Transition validation, visibility rules
└── ...

src/lib/stripe/
├── checkout.ts                    # createCheckoutSession helper
└── webhooks/
    └── orders.ts                  # Handle order-related Stripe webhooks
```

**Server Functions:**

```typescript
// Create Stripe Checkout session for an order
createStripeCheckoutSession(orderId: number): Promise<{ url: string }>

// Handle Stripe webhook events
handleStripeOrderWebhook(event: Stripe.Event): Promise<void>
  - checkout.session.completed → confirmOrderPayment()
  - checkout.session.expired → expireOrder()
  - payment_intent.payment_failed → failOrderPayment()

// Confirm payment (called by webhook)
confirmOrderPayment(orderId: number, stripeSessionId: string): Promise<Order>
  - Set paymentStatus: "paid"
  - Set orderStatus: "confirmed"
  - Set confirmedAt: now()

// Expire order (called by webhook or cleanup job)
expireOrder(orderId: number): Promise<Order>
  - Set paymentStatus: "expired"
  - Set orderStatus: "cancelled"
```

### Database Schema Updates

```typescript
// Additional fields for orders table
stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }),
stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),

// Index for webhook lookups
index("idx_orders_stripe_session").on(orders.stripeCheckoutSessionId),
```

---

## Database Schema Design

### Tables to Add

```typescript
// src/db/schema.ts

// Order status enum (fulfillment workflow)
export const orderStatuses = [
  "awaiting_payment",  // Order created, waiting for Stripe payment
  "confirmed",         // Payment confirmed OR pay-at-counter, ready for kitchen
  "preparing",         // Kitchen working on it
  "ready",             // Ready for pickup
  "completed",         // Handed to customer
  "cancelled",         // Cancelled (by customer, merchant, or payment failed)
] as const;

// Payment status enum
export const paymentStatuses = [
  "pending",              // Initial state before payment action
  "awaiting_confirmation", // Sent to Stripe Checkout, waiting for webhook
  "paid",                 // Payment confirmed via Stripe webhook
  "pay_at_counter",       // Dine-in, will pay after eating
  "failed",               // Payment failed
  "refunded",             // Refunded (full or partial)
  "expired",              // Stripe Checkout session expired
] as const;

// Order type enum
export const orderTypes = [
  "dine_in",        // Eating at the restaurant
  "takeaway",       // Pickup
  "delivery",       // Future: delivery
] as const;

// 1. Orders table
export const orders = pgTable("orders", {
  id: serial().primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id),

  // Customer info (snapshot, not FK - customers may not have accounts)
  customerName: varchar("customer_name", { length: 100 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 50 }),

  // Order details
  orderType: text("order_type", { enum: orderTypes }).notNull(),
  status: text("status", { enum: orderStatuses }).notNull().default("awaiting_payment"),

  // Service point (table, counter, etc.) - optional for future use
  servicePointId: integer("service_point_id").references(() => servicePoints.id),

  // Pricing (all in cents)
  subtotal: integer().notNull(),        // Sum of item totals
  taxAmount: integer("tax_amount").notNull().default(0),
  tipAmount: integer("tip_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),

  // Payment
  paymentStatus: text("payment_status", { enum: paymentStatuses }).notNull().default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }),  // "card", "cash", "apple_pay", etc.
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),

  // Notes
  customerNotes: text("customer_notes"),   // Special requests from customer
  merchantNotes: text("merchant_notes"),   // Internal notes from merchant

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  confirmedAt: timestamp("confirmed_at"),
  completedAt: timestamp("completed_at"),
});

// 2. Order items table (snapshot of cart items)
export const orderItems = pgTable("order_items", {
  id: serial().primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),

  // Item reference (for analytics, can be null if item deleted)
  itemId: integer("item_id").references(() => items.id, { onDelete: "set null" }),

  // Snapshot data (preserved even if original item changes)
  name: varchar({ length: 200 }).notNull(),
  description: text(),
  quantity: integer().notNull(),
  unitPrice: integer("unit_price").notNull(),      // Base price per unit (cents)
  optionsPrice: integer("options_price").notNull(), // Total options price per unit (cents)
  totalPrice: integer("total_price").notNull(),     // (unitPrice + optionsPrice) * quantity

  // Metadata
  displayOrder: integer("display_order").notNull(),
});

// 3. Order item options table (snapshot of selected options)
export const orderItemOptions = pgTable("order_item_options", {
  id: serial().primaryKey(),
  orderItemId: integer("order_item_id").notNull().references(() => orderItems.id, { onDelete: "cascade" }),

  // Option references (for analytics, can be null if deleted)
  optionGroupId: integer("option_group_id").references(() => optionGroups.id, { onDelete: "set null" }),
  optionChoiceId: integer("option_choice_id").references(() => optionChoices.id, { onDelete: "set null" }),

  // Snapshot data
  groupName: varchar("group_name", { length: 200 }).notNull(),
  choiceName: varchar("choice_name", { length: 200 }).notNull(),
  quantity: integer().notNull().default(1),
  priceModifier: integer("price_modifier").notNull(),  // Price per unit (cents)
});
```

### Indexes

```typescript
// Performance indexes
index("idx_orders_store_id").on(orders.storeId),
index("idx_orders_status").on(orders.status),
index("idx_orders_payment_status").on(orders.paymentStatus),
index("idx_orders_created_at").on(orders.createdAt),
index("idx_orders_store_status").on(orders.storeId, orders.status),
index("idx_orders_stripe_session").on(orders.stripeCheckoutSessionId),  // For webhook lookups
index("idx_order_items_order_id").on(orderItems.orderId),
index("idx_order_item_options_order_item_id").on(orderItemOptions.orderItemId),
```

### Relations

```typescript
export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  servicePoint: one(servicePoints, { fields: [orders.servicePointId], references: [servicePoints.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  item: one(items, { fields: [orderItems.itemId], references: [items.id] }),
  options: many(orderItemOptions),
}));

export const orderItemOptionsRelations = relations(orderItemOptions, ({ one }) => ({
  orderItem: one(orderItems, { fields: [orderItemOptions.orderItemId], references: [orderItems.id] }),
  optionGroup: one(optionGroups, { fields: [orderItemOptions.optionGroupId], references: [optionGroups.id] }),
  optionChoice: one(optionChoices, { fields: [orderItemOptions.optionChoiceId], references: [optionChoices.id] }),
}));
```

---

## Server Functions (Shared)

### `src/features/orders/server/orders.functions.ts`

```typescript
// === CREATE ===
createOrder          // Shop: Place new order from cart
                     // Input: storeId, items[], customer info, payment method, notes

// === READ ===
getOrder             // Both: Get single order by ID
getOrdersByStore     // Console: List orders for store (with filters)
getOrdersByCustomer  // Shop: Customer order history (by email/phone)

// === UPDATE ===
updateOrderStatus    // Console: Change order status
updatePaymentStatus  // Webhook: Payment confirmation
addMerchantNotes     // Console: Add internal notes
cancelOrder          // Both: Cancel order (with validation)

// === ANALYTICS ===
getOrderStats        // Console: Daily/weekly order counts, revenue
```

---

## Logic Layer (Shared)

### `src/features/orders/logic/order-pricing.ts`

```typescript
// Pure functions for price calculations
calculateItemTotal(item, quantity, selectedOptions)
calculateSubtotal(items[])
calculateTax(subtotal, taxRate)
calculateTotal(subtotal, tax, tip)
```

### `src/features/orders/logic/order-status.ts`

```typescript
// Status transition validation
canTransitionTo(currentStatus, newStatus): boolean
getNextValidStatuses(currentStatus): Status[]
isTerminalStatus(status): boolean  // completed, cancelled
```

### `src/features/orders/logic/order-snapshot.ts`

```typescript
// Convert cart items to order items with snapshots
snapshotCartItem(cartItem, menuItem, optionGroups): OrderItemInput
snapshotOrder(cart, store, customerInfo): CreateOrderInput
```

---

## Query Keys & Options (Shared)

### `src/features/orders/queries.ts`

```typescript
export const orderKeys = {
  all: ["orders"] as const,
  byStore: (storeId: number) => ["orders", "store", storeId] as const,
  byStoreAndStatus: (storeId: number, status: string) =>
    ["orders", "store", storeId, "status", status] as const,
  detail: (orderId: number) => ["orders", orderId] as const,
  byCustomer: (identifier: string) => ["orders", "customer", identifier] as const,
};

export const orderQueries = {
  byStore: (storeId: number, filters?: OrderFilters) =>
    queryOptions({
      queryKey: orderKeys.byStore(storeId),
      queryFn: () => getOrdersByStore({ data: { storeId, ...filters } }),
    }),
  detail: (orderId: number) =>
    queryOptions({
      queryKey: orderKeys.detail(orderId),
      queryFn: () => getOrder({ data: { orderId } }),
    }),
};
```

---

## Validation Schemas (Shared)

### `src/features/orders/validation.ts`

```typescript
// === SERVER SCHEMAS (real types) ===

export const orderItemOptionInput = z.object({
  optionGroupId: z.number(),
  optionChoiceId: z.number(),
  groupName: z.string(),
  choiceName: z.string(),
  quantity: z.number().int().min(1),
  priceModifier: z.number().int(),
});

export const orderItemInput = z.object({
  itemId: z.number(),
  name: z.string(),
  description: z.string().optional(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0),
  optionsPrice: z.number().int().min(0),
  totalPrice: z.number().int().min(0),
  options: z.array(orderItemOptionInput),
});

export const createOrderSchema = z.object({
  storeId: z.number(),
  items: z.array(orderItemInput).min(1),
  orderType: z.enum(orderTypes),
  servicePointId: z.number().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  customerNotes: z.string().optional(),
  paymentMethod: z.string(),
  subtotal: z.number().int().min(0),
  taxAmount: z.number().int().min(0),
  tipAmount: z.number().int().min(0),
  totalAmount: z.number().int().min(0),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.number(),
  status: z.enum(orderStatuses),
});
```

### `src/features/shop/checkout/validation.ts`

```typescript
// === FORM SCHEMAS (strings for HTML inputs) ===

export const checkoutFormSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  customerPhone: z.string().min(5, "Phone is required"),
  orderType: z.enum(["dine_in", "takeaway"]),
  customerNotes: z.string().optional(),
});
```

---

## Data Flow

### Shop: Placing a Takeaway Order (Stripe Checkout)

```
1. Customer browses menu → adds items to cart (Zustand store)
2. Customer clicks checkout → navigate to /shop/$slug/checkout
3. Checkout page:
   - Displays cart summary (from Zustand)
   - Collects customer info (checkoutFormSchema)
   - Selects orderType: "takeaway"
4. On submit:
   a. snapshotOrder() creates full order data with current prices
   b. createOrder() inserts with:
      - orderStatus: "awaiting_payment"
      - paymentStatus: "pending"
   c. createStripeCheckoutSession() → get Stripe URL
   d. Update order: paymentStatus: "awaiting_confirmation"
   e. Clear cart from Zustand
   f. Redirect to Stripe Checkout
5. Customer pays on Stripe hosted page
6. Stripe webhook: checkout.session.completed
   - confirmOrderPayment() updates:
     - paymentStatus: "paid"
     - orderStatus: "confirmed"
     - confirmedAt: now()
7. Customer redirected to /shop/$slug/order/$orderId (confirmation page)
8. Order now visible in Kitchen Monitor
```

### Shop: Placing a Dine-in Order (Pay at Counter)

```
1. Customer browses menu → adds items to cart (Zustand store)
2. Customer clicks checkout → navigate to /shop/$slug/checkout
3. Checkout page:
   - Displays cart summary (from Zustand)
   - Collects customer info (checkoutFormSchema)
   - Selects orderType: "dine_in"
4. On submit:
   a. snapshotOrder() creates full order data with current prices
   b. createOrder() inserts with:
      - orderStatus: "confirmed" (immediate)
      - paymentStatus: "pay_at_counter"
      - confirmedAt: now()
   c. Clear cart from Zustand
   d. Redirect to /shop/$slug/order/$orderId (confirmation page)
5. Order IMMEDIATELY visible in Kitchen Monitor
6. Customer pays at counter after eating (out of system or via POS)
```

### Console: Managing Orders

```
1. Merchant navigates to /console/orders
2. Orders page shows ALL orders (including awaiting_payment)
   - Payment-pending orders visually distinguished (badge/color)
   - Filter by status, date, order type
3. Polling every 30s for updates
4. Click order → detail panel shows:
   - Customer info
   - Items with options
   - Order status + payment status
   - Status controls (if confirmed+)
   - Merchant notes section
5. Status changes trigger toast + invalidate queries
```

### Console: Kitchen Monitor

```
1. Kitchen staff opens /console/kitchen (full-screen mode)
2. Query filters:
   - paymentStatus IN ('paid', 'pay_at_counter')
   - orderStatus IN ('confirmed', 'preparing', 'ready')
3. Fast polling (5-10s) for new orders
4. Big touch-friendly buttons to update status:
   - "Start Preparing" → preparing
   - "Ready" → ready
   - "Complete" → completed
5. Completed/cancelled orders auto-remove from view
6. Audio/visual notification for new orders
7. Orders in "awaiting_payment" NEVER appear here
```

---

## Routes

### Shop Routes

```
/shop/$slug/checkout        # Checkout flow
/shop/$slug/order/$orderId  # Order confirmation/status
/shop/$slug/orders          # Customer order history (optional, future)
```

### Console Routes

```
/console/orders             # Order management master-detail (back-office)
/console/orders/$orderId    # Direct link to order (opens in detail panel)
/console/kitchen            # Kitchen monitor (full-screen, real-time)
```

---

## Design Decisions

1. **Customer Identification**: Guest checkout now, schema supports accounts later
   - Customers provide name/phone/email per order
   - Schema includes optional `customerId` field for future accounts
   - Order history accessible via phone/email lookup

2. **Payment Integration**: Stripe Checkout with webhook confirmation
   - **Takeaway**: Stripe Checkout required
     - Order created in `awaiting_payment` status
     - Redirected to Stripe hosted checkout page
     - Webhook confirms payment → order becomes `confirmed`
     - Only then visible to kitchen
   - **Dine-in**: Pay at counter
     - Order created immediately as `confirmed`
     - `paymentStatus: pay_at_counter`
     - Immediately visible to kitchen
     - Payment handled offline/POS

3. **Kitchen Visibility Rule**
   - Orders appear in Kitchen Monitor only when:
     ```
     (paymentStatus = 'paid' OR paymentStatus = 'pay_at_counter')
     AND orderStatus IN ('confirmed', 'preparing', 'ready')
     ```
   - `awaiting_payment` orders NEVER visible to kitchen
   - Prevents preparing orders that may never be paid

4. **Webhook-Based Confirmation**
   - Never trust client-side redirect for payment confirmation
   - Only `checkout.session.completed` webhook triggers order confirmation
   - Handle edge cases:
     - `checkout.session.expired` → cancel order
     - `payment_intent.payment_failed` → cancel order
   - Idempotent webhook handling (check current status before updating)

5. **Real-time Updates**: Polling first, real-time later if needed
   - Order management: 30-second polling
   - Kitchen monitor: 5-10 second polling (faster)
   - Query invalidation on status changes
   - Can add WebSocket/SSE later

6. **Service Point**: Not needed at launch
   - Optional field in schema for future use
   - Not required in checkout flow

7. **Snapshots**: Orders preserve data at time of purchase
   - Item names, descriptions, prices are snapshotted
   - Original item IDs kept for analytics (but can be null if deleted)
   - Menu changes don't affect historical orders

---

## Key Patterns

### Three Schema Rule (per architecture.md)

| Schema | Purpose | Types |
|--------|---------|-------|
| Form schema | HTML input validation | Strings |
| Server schema | API contract | Real types (numbers, booleans) |
| Database schema | Drizzle ORM | Column types |

### Transformation Flow

```
Form (strings) → Mutation Hook (transforms) → Server Function (validates) → Database
```

### Query Invalidation

```typescript
// On status change
queryClient.invalidateQueries({ queryKey: orderKeys.byStore(storeId) });
queryClient.setQueryData(orderKeys.detail(orderId), updatedOrder);
```

---

## File Paths Summary

### Shared Orders Feature
- `src/features/orders/server/orders.functions.ts` - CRUD operations
- `src/features/orders/server/stripe-checkout.functions.ts` - Stripe session management
- `src/features/orders/logic/order-pricing.ts` - Price calculations
- `src/features/orders/logic/order-status.ts` - Status transitions, visibility rules
- `src/features/orders/logic/order-snapshot.ts` - Cart → order conversion
- `src/features/orders/validation.ts` - Zod schemas
- `src/features/orders/queries.ts` - Query keys and options
- `src/features/orders/constants.ts` - Status enums, order types

### Stripe Integration
- `src/lib/stripe/checkout.ts` - createCheckoutSession helper
- `src/lib/stripe/webhooks/orders.ts` - Order-related webhook handlers
- `src/routes/api/webhooks/stripe.ts` - Webhook endpoint (existing or new)

### Console Features
- `src/features/console/orders/` - Order management
- `src/features/console/kitchen/` - Kitchen monitor
- `src/routes/console/orders/index.tsx`
- `src/routes/console/orders/$orderId.tsx`
- `src/routes/console/kitchen.tsx`

### Shop Features
- `src/features/shop/checkout/` - Checkout flow
- `src/routes/shop/$slug/checkout.tsx`
- `src/routes/shop/$slug/order/$orderId.tsx`

### Database
- `src/db/schema.ts` - Add orders, orderItems, orderItemOptions tables
