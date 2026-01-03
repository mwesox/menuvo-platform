/**
 * Validation schemas for shop checkout.
 *
 * Following the Three Schema Rule:
 * - Form schemas: Strings (HTML inputs)
 */

import { z } from "zod";
import { orderTypes } from "@/features/orders/constants";

// ============================================================================
// FORM SCHEMAS (Strings from HTML inputs)
// ============================================================================

/**
 * Checkout form schema.
 * All orders require online payment, so email is always required.
 */
export const checkoutFormSchema = z.object({
	customerName: z.string().min(1, "Name is required"),
	customerEmail: z.string().email("Invalid email").min(1, "Email is required"),
	orderType: z.enum(orderTypes),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
