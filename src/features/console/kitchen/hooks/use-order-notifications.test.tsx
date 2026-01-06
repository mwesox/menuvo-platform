import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrderWithItems } from "@/features/orders/types";
import { useOrderNotifications } from "./use-order-notifications";

// Mock Zustand store - audio muted to skip audio complexity
vi.mock("../stores/kitchen-preferences", () => ({
	useKitchenPreferences: () => ({
		audioMuted: true,
		toggleAudio: vi.fn(),
	}),
}));

// Helper to create minimal mock orders
const mockOrder = (id: number) => ({ id }) as OrderWithItems;

describe("useOrderNotifications", () => {
	it("does NOT alert on initial load with existing orders", () => {
		const orders = [mockOrder(1), mockOrder(2)];

		const { result } = renderHook(() => useOrderNotifications(orders));

		expect(result.current.alertActive).toBe(false);
	});

	it("alerts when NEW order arrives after initial load", () => {
		const initialOrders = [mockOrder(1)];

		const { result, rerender } = renderHook(
			({ orders }) => useOrderNotifications(orders),
			{ initialProps: { orders: initialOrders } },
		);

		// Initial load - no alert
		expect(result.current.alertActive).toBe(false);

		// New order arrives
		const updatedOrders = [mockOrder(1), mockOrder(2)];
		rerender({ orders: updatedOrders });

		expect(result.current.alertActive).toBe(true);
	});

	it("does NOT alert when order changes status (same IDs)", () => {
		// Simulates: order moves from "done" to "preparing" column
		// The ID stays the same, only status changes
		const orders = [mockOrder(1), mockOrder(2), mockOrder(3)];

		const { result, rerender } = renderHook(
			({ orders }) => useOrderNotifications(orders),
			{ initialProps: { orders } },
		);

		expect(result.current.alertActive).toBe(false);

		// Same orders, different statuses (simulated by same IDs)
		rerender({ orders: [mockOrder(1), mockOrder(2), mockOrder(3)] });

		expect(result.current.alertActive).toBe(false);
	});

	it("does NOT alert when order previously tracked reappears", () => {
		// This tests the bug fix: order was in doneOrders, moves back to active
		// Since we now pass ALL orders, the ID should already be tracked
		const allOrders = [mockOrder(1), mockOrder(2), mockOrder(3)];

		const { result, rerender } = renderHook(
			({ orders }) => useOrderNotifications(orders),
			{ initialProps: { orders: allOrders } },
		);

		expect(result.current.alertActive).toBe(false);

		// Order 3 "moves" from done to active - still same set of IDs
		rerender({ orders: allOrders });

		expect(result.current.alertActive).toBe(false);
	});
});
