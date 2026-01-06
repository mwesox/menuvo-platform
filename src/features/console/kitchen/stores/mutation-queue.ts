/**
 * Zustand store for offline mutation queue.
 *
 * Queues failed mutations when offline and retries them on reconnection.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrderStatus } from "@/features/orders/constants";

// ============================================================================
// TYPES
// ============================================================================

export type MutationType = "updateStatus" | "cancel";

export interface QueuedMutation {
	/** Unique identifier */
	id: string;
	/** Type of mutation */
	type: MutationType;
	/** Order ID affected */
	orderId: number;
	/** Mutation payload */
	payload: {
		status?: OrderStatus;
		reason?: string;
	};
	/** When the mutation was queued */
	timestamp: number;
	/** Number of retry attempts */
	retryCount: number;
}

interface MutationQueueState {
	/** Queue of pending mutations */
	queue: QueuedMutation[];
}

interface MutationQueueActions {
	/** Add a mutation to the queue */
	addMutation: (
		mutation: Omit<QueuedMutation, "id" | "timestamp" | "retryCount">,
	) => void;
	/** Remove a mutation from the queue */
	removeMutation: (id: string) => void;
	/** Increment retry count for a mutation */
	incrementRetry: (id: string) => void;
	/** Clear all mutations from the queue */
	clearQueue: () => void;
	/** Get mutations for a specific order */
	getMutationsForOrder: (orderId: number) => QueuedMutation[];
}

export type MutationQueueStore = MutationQueueState & MutationQueueActions;

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum retry attempts before removing from queue */
export const MAX_RETRY_COUNT = 3;

// ============================================================================
// STORE
// ============================================================================

export const useMutationQueue = create<MutationQueueStore>()(
	persist(
		(set, get) => ({
			// State
			queue: [],

			// Actions
			addMutation: (mutation) =>
				set((state) => ({
					queue: [
						...state.queue,
						{
							...mutation,
							id: crypto.randomUUID(),
							timestamp: Date.now(),
							retryCount: 0,
						},
					],
				})),

			removeMutation: (id) =>
				set((state) => ({
					queue: state.queue.filter((m) => m.id !== id),
				})),

			incrementRetry: (id) =>
				set((state) => ({
					queue: state.queue.map((m) =>
						m.id === id ? { ...m, retryCount: m.retryCount + 1 } : m,
					),
				})),

			clearQueue: () => set({ queue: [] }),

			getMutationsForOrder: (orderId) =>
				get().queue.filter((m) => m.orderId === orderId),
		}),
		{
			name: "menuvo-kitchen-queue",
			// Validate persisted data on rehydration
			merge: (persistedState, currentState) => {
				const persisted = persistedState as
					| Partial<MutationQueueState>
					| undefined;
				if (!persisted) return currentState;

				// Filter out old mutations (older than 24 hours) and failed ones
				const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
				const validMutations = (persisted.queue ?? []).filter(
					(m) => m.timestamp > oneDayAgo && m.retryCount < MAX_RETRY_COUNT,
				);

				return {
					...currentState,
					queue: validMutations,
				};
			},
		},
	),
);
