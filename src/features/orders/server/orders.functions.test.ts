/**
 * Smoke tests for orders server functions.
 *
 * Tests order creation, retrieval, status transitions, and cancellation.
 * Uses unique IDs per test run to avoid conflicts.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { extractError } from "@/lib/errors";
import {
	cleanupTestData,
	closeTestDb,
	createTestCategory,
	createTestItem,
	createTestMerchant,
	createTestOrder,
	createTestRunId,
	createTestStore,
} from "@/test/factories";
import {
	cancelOrder,
	createOrder,
	getKitchenOrders,
	getOrder,
	getOrdersByStore,
	updateOrderStatus,
} from "./orders.functions";

describe("orders.functions", () => {
	const testRunId = createTestRunId();
	let storeId: number;
	let itemId: number;

	beforeAll(async () => {
		const merchant = await createTestMerchant({ testRunId });
		const store = await createTestStore({
			testRunId,
			merchantId: merchant.id,
		});
		storeId = store.id;

		// Create a category and item for order tests
		const category = await createTestCategory({ testRunId, storeId });
		const item = await createTestItem({
			testRunId,
			categoryId: category.id,
			storeId,
			price: 1000,
		});
		itemId = item.id;
	});

	afterAll(async () => {
		await cleanupTestData(testRunId);
		await closeTestDb();
	});

	describe("createOrder", () => {
		it("should create order with items in transaction", async () => {
			const result = await createOrder({
				data: {
					storeId,
					orderType: "takeaway",
					paymentMethod: "card",
					items: [
						{
							itemId,
							name: `Test Burger ${testRunId}`,
							quantity: 2,
							unitPrice: 1200,
							optionsPrice: 0,
							totalPrice: 2400,
							options: [],
						},
					],
					subtotal: 2400,
					taxAmount: 0,
					tipAmount: 0,
					totalAmount: 2400,
				},
			});

			expect(result).toBeDefined();
			expect(result.id).toBeGreaterThan(0);
			expect(result.storeId).toBe(storeId);
			expect(result.status).toBe("awaiting_payment"); // Takeaway with card payment
			expect(result.totalAmount).toBe(2400);
		});

		it("should set awaiting_payment status for dine_in orders", async () => {
			const result = await createOrder({
				data: {
					storeId,
					orderType: "dine_in",
					paymentMethod: "card",
					items: [
						{
							itemId,
							name: `Dine-in Item ${testRunId}`,
							quantity: 1,
							unitPrice: 800,
							optionsPrice: 0,
							totalPrice: 800,
							options: [],
						},
					],
					subtotal: 800,
					taxAmount: 0,
					tipAmount: 0,
					totalAmount: 800,
				},
			});

			// All orders require payment - no special handling for dine_in
			expect(result.status).toBe("awaiting_payment");
			expect(result.paymentStatus).toBe("pending");
		});
	});

	describe("getOrder", () => {
		it("should return order with items and options", async () => {
			const created = await createTestOrder({
				testRunId,
				storeId,
				status: "confirmed",
				paymentStatus: "paid",
			});

			const result = await getOrder({ data: { orderId: created.id } });

			expect(result).toBeDefined();
			expect(result.id).toBe(created.id);
			expect(result.items).toBeDefined();
			expect(Array.isArray(result.items)).toBe(true);
			expect(result.store).toBeDefined();
		});

		it("should throw NotFoundError for non-existent order", async () => {
			try {
				await getOrder({ data: { orderId: 999999 } });
				expect.fail("Should have thrown an error");
			} catch (error) {
				const appError = extractError(error);
				expect(appError).toBeDefined();
				expect(appError?._tag).toBe("NotFoundError");
			}
		});
	});

	describe("getOrdersByStore", () => {
		it("should return orders for store", async () => {
			// Create an order first
			await createTestOrder({
				testRunId,
				storeId,
				status: "confirmed",
				paymentStatus: "paid",
			});

			const result = await getOrdersByStore({ data: { storeId } });

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
			expect(result[0].items).toBeDefined();
		});

		it("should filter by status", async () => {
			await createTestOrder({
				testRunId,
				storeId,
				status: "preparing",
				paymentStatus: "paid",
			});

			const result = await getOrdersByStore({
				data: { storeId, status: "preparing" },
			});

			expect(Array.isArray(result)).toBe(true);
			// All results should have preparing status
			for (const order of result) {
				expect(order.status).toBe("preparing");
			}
		});
	});

	describe("getKitchenOrders", () => {
		it("should return only active paid orders", async () => {
			// Create a confirmed paid order (visible in kitchen)
			await createTestOrder({
				testRunId,
				storeId,
				status: "confirmed",
				paymentStatus: "paid",
			});

			const result = await getKitchenOrders({ data: { storeId } });

			expect(Array.isArray(result)).toBe(true);
			// All results should be in kitchen-visible statuses with paid payment
			for (const order of result) {
				expect(["confirmed", "preparing", "ready"]).toContain(order.status);
				expect(order.paymentStatus).toBe("paid");
			}
		});
	});

	describe("updateOrderStatus", () => {
		it("should allow valid status transitions", async () => {
			const order = await createTestOrder({
				testRunId,
				storeId,
				status: "confirmed",
				paymentStatus: "paid",
			});

			// confirmed -> preparing (valid)
			const result = await updateOrderStatus({
				data: { orderId: order.id, status: "preparing" },
			});

			expect(result.status).toBe("preparing");
		});

		it("should reject invalid status transitions", async () => {
			const order = await createTestOrder({
				testRunId,
				storeId,
				status: "confirmed",
				paymentStatus: "paid",
			});

			// confirmed -> completed (invalid, must go through preparing and ready)
			try {
				await updateOrderStatus({
					data: { orderId: order.id, status: "completed" },
				});
				expect.fail("Should have thrown an error");
			} catch (error) {
				const appError = extractError(error);
				expect(appError).toBeDefined();
				expect(appError?._tag).toBe("InvalidOrderTransitionError");
			}
		});

		it("should allow full status workflow", async () => {
			const order = await createTestOrder({
				testRunId,
				storeId,
				status: "confirmed",
				paymentStatus: "paid",
			});

			// confirmed -> preparing
			const prep = await updateOrderStatus({
				data: { orderId: order.id, status: "preparing" },
			});
			expect(prep.status).toBe("preparing");

			// preparing -> ready
			const ready = await updateOrderStatus({
				data: { orderId: order.id, status: "ready" },
			});
			expect(ready.status).toBe("ready");

			// ready -> completed
			const completed = await updateOrderStatus({
				data: { orderId: order.id, status: "completed" },
			});
			expect(completed.status).toBe("completed");
			expect(completed.completedAt).not.toBeNull();
		});
	});

	describe("cancelOrder", () => {
		it("should cancel active order", async () => {
			const order = await createTestOrder({
				testRunId,
				storeId,
				status: "preparing",
				paymentStatus: "paid",
			});

			const result = await cancelOrder({
				data: { orderId: order.id, reason: "Customer request" },
			});

			expect(result.status).toBe("cancelled");
			expect(result.merchantNotes).toContain("Customer request");
		});

		it("should reject cancellation of completed order", async () => {
			const order = await createTestOrder({
				testRunId,
				storeId,
				status: "completed",
				paymentStatus: "paid",
			});

			try {
				await cancelOrder({ data: { orderId: order.id } });
				expect.fail("Should have thrown an error");
			} catch (error) {
				const appError = extractError(error);
				expect(appError).toBeDefined();
				expect(appError?._tag).toBe("OrderNotCancellableError");
			}
		});

		it("should reject cancellation of already cancelled order", async () => {
			const order = await createTestOrder({
				testRunId,
				storeId,
				status: "cancelled",
				paymentStatus: "paid",
			});

			try {
				await cancelOrder({ data: { orderId: order.id } });
				expect.fail("Should have thrown an error");
			} catch (error) {
				const appError = extractError(error);
				expect(appError).toBeDefined();
				expect(appError?._tag).toBe("OrderNotCancellableError");
			}
		});
	});
});
