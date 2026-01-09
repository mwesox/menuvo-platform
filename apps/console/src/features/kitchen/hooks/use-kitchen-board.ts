/**
 * Hook for kitchen kanban board state management.
 *
 * Simplified to work with pragmatic-drag-and-drop:
 * - No state changes during drag (handled by native browser drag API)
 * - State updates only on drop via moveCard function
 */

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import { useKitchenUpdateOrderStatus } from "../queries";

// ============================================================================
// TYPES
// ============================================================================

type OrderWithServicePoint = OrderWithItems & {
	servicePoint?: { id: string; name: string; code: string } | null;
};

export interface KitchenBoardState {
	/** Orders grouped by column */
	columns: Record<KanbanColumnId, OrderWithServicePoint[]>;
}

export interface KitchenBoardActions {
	/** Move order to a specific column (called from drop handler) */
	moveCard: (orderId: string, targetColumn: KanbanColumnId) => void;
	/** Move order to next column (new->preparing->ready->done) */
	moveToNext: (orderId: string) => void;
	/** Check if drop from source to target is valid */
	canDrop: (
		sourceColumn: KanbanColumnId,
		targetColumn: KanbanColumnId,
	) => boolean;
}

export type KitchenBoardResult = KitchenBoardState &
	KitchenBoardActions & {
		/** ID of the last moved order for visual highlighting */
		lastMovedOrderId: string | null;
	};

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
	orderId: string,
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
	storeId: string,
	activeOrders: OrderWithItems[],
	doneOrders: OrderWithItems[],
): KitchenBoardResult {
	const { t } = useTranslation("console-kitchen");

	// Track last moved order for visual highlighting
	const [lastMovedOrderId, setLastMovedOrderId] = useState<string | null>(null);

	// Group orders into columns
	const columns = groupOrdersByColumn(activeOrders, doneOrders);

	// Status update mutation with offline queueing
	const statusMutation = useKitchenUpdateOrderStatus(storeId);

	// Check if drop is valid
	const canDrop = useCallback(
		(sourceColumn: KanbanColumnId, targetColumn: KanbanColumnId): boolean => {
			return canDropInColumn(sourceColumn, targetColumn);
		},
		[],
	);

	// Move card to a specific column (called from drop handler)
	const moveCard = useCallback(
		(orderId: string, targetColumn: KanbanColumnId) => {
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
			statusMutation.mutate(
				{ orderId, status: newStatus },
				{ onSuccess: () => setLastMovedOrderId(orderId) },
			);
		},
		[columns, statusMutation, t],
	);

	// Move order to next column (new->preparing->ready->done)
	const moveToNext = useCallback(
		(orderId: string) => {
			// Find current column
			const currentColumn = findContainer(columns, orderId);
			if (!currentColumn) return;

			// Get next column
			const nextColumn = getNextColumn(currentColumn);
			if (!nextColumn) return; // Already in done

			// Persist to server
			const newStatus = COLUMN_TO_STATUS[nextColumn];
			statusMutation.mutate(
				{ orderId, status: newStatus },
				{ onSuccess: () => setLastMovedOrderId(orderId) },
			);
		},
		[columns, statusMutation],
	);

	return {
		// State
		columns,
		lastMovedOrderId,

		// Actions
		moveCard,
		moveToNext,
		canDrop,
	};
}
