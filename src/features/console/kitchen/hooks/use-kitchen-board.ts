/**
 * Hook for kitchen kanban board state management.
 *
 * Simplified to work with pragmatic-drag-and-drop:
 * - No state changes during drag (handled by native browser drag API)
 * - State updates only on drop via moveCard function
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { OrderStatus } from "@/features/orders/constants";
import { orderKeys } from "@/features/orders/queries";
import { updateOrderStatus } from "@/features/orders/server/orders.functions";
import type { OrderWithItems } from "@/features/orders/types";
import { COLUMN_TO_STATUS, type KanbanColumnId } from "../constants";
import {
	canDropInColumn,
	getColumnForStatus,
} from "../logic/column-assignment";
import {
	sortByCompletionTime,
	sortByUrgencyAndTime,
} from "../logic/order-sorting";
import { useMutationQueue } from "../stores/mutation-queue";
import { useConnectionStatus } from "./use-connection-status";

// ============================================================================
// TYPES
// ============================================================================

type OrderWithServicePoint = OrderWithItems & {
	servicePoint?: { id: number; name: string; code: string } | null;
};

export interface KitchenBoardState {
	/** Orders grouped by column */
	columns: Record<KanbanColumnId, OrderWithServicePoint[]>;
}

export interface KitchenBoardActions {
	/** Move order to a specific column (called from drop handler) */
	moveCard: (orderId: number, targetColumn: KanbanColumnId) => void;
	/** Move order to next column (new->preparing->ready->done) */
	moveToNext: (orderId: number) => void;
	/** Check if drop from source to target is valid */
	canDrop: (
		sourceColumn: KanbanColumnId,
		targetColumn: KanbanColumnId,
	) => boolean;
}

export type KitchenBoardResult = KitchenBoardState & KitchenBoardActions;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Group orders by kanban column and sort appropriately.
 */
function groupOrdersByColumn(
	activeOrders: OrderWithItems[],
	doneOrders: OrderWithItems[],
): Record<KanbanColumnId, OrderWithServicePoint[]> {
	const columns: Record<KanbanColumnId, OrderWithServicePoint[]> = {
		new: [],
		preparing: [],
		ready: [],
		done: [],
	};

	// Group active orders
	for (const order of activeOrders) {
		const columnId = getColumnForStatus(order.status);
		if (columnId && columnId !== "done") {
			columns[columnId].push(order as OrderWithServicePoint);
		}
	}

	// Add done orders
	columns.done = [...doneOrders] as OrderWithServicePoint[];

	// Sort each column appropriately
	columns.new = sortByUrgencyAndTime(columns.new);
	columns.preparing = sortByUrgencyAndTime(columns.preparing);
	columns.ready = sortByUrgencyAndTime(columns.ready);
	columns.done = sortByCompletionTime(columns.done);

	return columns;
}

/**
 * Get the next column in the workflow.
 * new -> preparing -> ready -> done
 */
function getNextColumn(current: KanbanColumnId): KanbanColumnId | null {
	switch (current) {
		case "new":
			return "preparing";
		case "preparing":
			return "ready";
		case "ready":
			return "done";
		case "done":
			return null; // No next column
	}
}

/**
 * Find which column contains an order by ID.
 */
function findContainer(
	columns: Record<KanbanColumnId, OrderWithServicePoint[]>,
	orderId: number,
): KanbanColumnId | null {
	for (const columnId of Object.keys(columns) as KanbanColumnId[]) {
		if (columns[columnId].some((o) => o.id === orderId)) {
			return columnId;
		}
	}
	return null;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Main hook for kitchen kanban board.
 *
 * Handles:
 * - Grouping orders into columns
 * - Moving cards between columns via moveCard
 * - Moving cards to next column via moveToNext
 * - Offline mutation queueing
 */
export function useKitchenBoard(
	storeId: number,
	activeOrders: OrderWithItems[],
	doneOrders: OrderWithItems[],
): KitchenBoardResult {
	const { t } = useTranslation("console-kitchen");
	const queryClient = useQueryClient();
	const { isOnline } = useConnectionStatus();
	const mutationQueue = useMutationQueue();

	// Group orders into columns
	const columns = groupOrdersByColumn(activeOrders, doneOrders);

	// Status update mutation - direct call to server function
	const statusMutation = useMutation({
		mutationFn: async ({
			orderId,
			status,
		}: {
			orderId: number;
			status: OrderStatus;
		}) => {
			return updateOrderStatus({ data: { orderId, status } });
		},
		onSuccess: () => {
			// Invalidate queries to sync with server
			queryClient.invalidateQueries({
				queryKey: orderKeys.kitchen(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.kitchenDone(storeId),
			});
		},
		onError: (_error, variables) => {
			// Queue for retry if offline
			if (!isOnline) {
				mutationQueue.addMutation({
					type: "updateStatus",
					orderId: variables.orderId,
					payload: { status: variables.status },
				});
				toast.info(t("info.queuedForSync"));
			} else {
				toast.error(t("errors.updateFailed"));
				// Invalidate to revert to server state
				queryClient.invalidateQueries({
					queryKey: orderKeys.kitchen(storeId),
				});
			}
		},
	});

	// Check if drop is valid
	const canDrop = useCallback(
		(sourceColumn: KanbanColumnId, targetColumn: KanbanColumnId): boolean => {
			return canDropInColumn(sourceColumn, targetColumn);
		},
		[],
	);

	// Move card to a specific column (called from drop handler)
	const moveCard = useCallback(
		(orderId: number, targetColumn: KanbanColumnId) => {
			const sourceColumn = findContainer(columns, orderId);
			if (!sourceColumn) return;

			// Don't do anything if dropped in same column
			if (sourceColumn === targetColumn) return;

			// Validate the transition
			if (!canDropInColumn(sourceColumn, targetColumn)) {
				toast.error(t("errors.invalidTransition"));
				return;
			}

			const newStatus = COLUMN_TO_STATUS[targetColumn];
			statusMutation.mutate({ orderId, status: newStatus });
		},
		[columns, statusMutation, t],
	);

	// Move order to next column (new->preparing->ready->done)
	const moveToNext = useCallback(
		(orderId: number) => {
			// Find current column
			const currentColumn = findContainer(columns, orderId);
			if (!currentColumn) return;

			// Get next column
			const nextColumn = getNextColumn(currentColumn);
			if (!nextColumn) return; // Already in done

			// Persist to server
			const newStatus = COLUMN_TO_STATUS[nextColumn];
			statusMutation.mutate({ orderId, status: newStatus });
		},
		[columns, statusMutation],
	);

	return {
		// State
		columns,

		// Actions
		moveCard,
		moveToNext,
		canDrop,
	};
}
