/**
 * Hook for kitchen kanban board state and drag-and-drop handling.
 *
 * Uses React 19's useOptimistic for instant UI updates with automatic rollback.
 * Implements proper multi-container drag-and-drop with onDragOver for cross-column moves.
 */

import type {
	DragEndEvent,
	DragOverEvent,
	DragStartEvent,
} from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startTransition, useOptimistic, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { OrderStatus } from "@/features/orders/constants";
import { orderKeys } from "@/features/orders/queries";
import { updateOrderStatus } from "@/features/orders/server/orders.functions";
import type { OrderWithItems } from "@/features/orders/types";
import {
	COLUMN_TO_STATUS,
	KANBAN_COLUMNS,
	type KanbanColumnId,
} from "../constants";
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
	/** Currently dragging order ID */
	activeId: number | null;
	/** Currently dragging order */
	activeOrder: OrderWithServicePoint | null;
	/** Valid drop targets for current drag */
	validDropTargets: KanbanColumnId[];
}

export interface KitchenBoardActions {
	/** Handle drag start event from DndContext */
	onDragStart: (event: DragStartEvent) => void;
	/** Handle drag over event - moves items between containers during drag */
	onDragOver: (event: DragOverEvent) => void;
	/** Handle drag end event - persists the change */
	onDragEnd: (event: DragEndEvent) => void;
	/** Handle drag cancel - reverts optimistic state */
	onDragCancel: () => void;
	/** Get order by ID */
	getOrder: (orderId: number) => OrderWithServicePoint | undefined;
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
 * Find which column contains an order by ID.
 */
function findContainer(
	columns: Record<KanbanColumnId, OrderWithServicePoint[]>,
	id: number | string,
): KanbanColumnId | null {
	// If it's a column ID string
	if (typeof id === "string") {
		if (id.startsWith("column-")) {
			return id.replace("column-", "") as KanbanColumnId;
		}
		return null;
	}

	// Find by order ID
	for (const columnId of Object.keys(columns) as KanbanColumnId[]) {
		if (columns[columnId].some((o) => o.id === id)) {
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
 * - Drag-and-drop with proper multi-container support
 * - Optimistic updates with React 19's useOptimistic
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

	// Active drag state
	const [activeId, setActiveId] = useState<number | null>(null);
	const [activeOrder, setActiveOrder] = useState<OrderWithServicePoint | null>(
		null,
	);

	// Track source column for determining if drop is valid
	const [sourceColumn, setSourceColumn] = useState<KanbanColumnId | null>(null);

	// Group orders into columns
	const baseColumns = groupOrdersByColumn(activeOrders, doneOrders);

	// React 19 optimistic state for instant UI updates
	const [optimisticColumns, addOptimistic] = useOptimistic(
		baseColumns,
		(
			currentColumns: Record<KanbanColumnId, OrderWithServicePoint[]>,
			action: {
				orderId: number;
				fromColumn: KanbanColumnId;
				toColumn: KanbanColumnId;
			},
		) => {
			const { orderId, fromColumn, toColumn } = action;

			// Same column - no change needed
			if (fromColumn === toColumn) return currentColumns;

			// Find and remove order from source column
			const order = currentColumns[fromColumn].find((o) => o.id === orderId);
			if (!order) return currentColumns;

			const newColumns = { ...currentColumns };

			// Remove from source
			newColumns[fromColumn] = currentColumns[fromColumn].filter(
				(o) => o.id !== orderId,
			);

			// Add to target with updated status
			const newStatus = COLUMN_TO_STATUS[toColumn];
			const updatedOrder = { ...order, status: newStatus };
			newColumns[toColumn] = [...currentColumns[toColumn], updatedOrder];

			// Re-sort target column
			if (toColumn === "done") {
				newColumns[toColumn] = sortByCompletionTime(newColumns[toColumn]);
			} else {
				newColumns[toColumn] = sortByUrgencyAndTime(newColumns[toColumn]);
			}

			return newColumns;
		},
	);

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
				// Invalidate to revert optimistic update
				queryClient.invalidateQueries({
					queryKey: orderKeys.kitchen(storeId),
				});
			}
		},
	});

	// Calculate valid drop targets based on source column
	const validDropTargets: KanbanColumnId[] = (() => {
		if (!sourceColumn) return [];

		return KANBAN_COLUMNS.filter((c) =>
			c.canDropFrom.includes(sourceColumn),
		).map((c) => c.id);
	})();

	// Handle drag start - track which item is being dragged
	const handleDragStart = (event: DragStartEvent) => {
		const { active } = event;
		const orderId = active.id as number;

		setActiveId(orderId);

		// Find the order and its source column
		const container = findContainer(optimisticColumns, orderId);
		if (container) {
			setSourceColumn(container);
			const order = optimisticColumns[container].find((o) => o.id === orderId);
			if (order) {
				setActiveOrder(order);
			}
		}
	};

	// Handle drag over - move items between containers DURING drag
	// This is the key for cross-column functionality
	const handleDragOver = (event: DragOverEvent) => {
		const { active, over } = event;

		if (!over) return;

		const activeOrderId = active.id as number;
		const overId = over.id;

		// Find current container of the active item
		const activeContainer = findContainer(optimisticColumns, activeOrderId);
		// Find target container (either from column ID or from item's column)
		const overContainer = findContainer(optimisticColumns, overId);

		if (!activeContainer || !overContainer) return;

		// If moving to a different container
		if (activeContainer !== overContainer) {
			// Validate the transition
			if (!canDropInColumn(sourceColumn ?? activeContainer, overContainer)) {
				return; // Invalid transition
			}

			// Apply optimistic update to move item to new container
			// Wrap in startTransition per React 19 requirements
			startTransition(() => {
				addOptimistic({
					orderId: activeOrderId,
					fromColumn: activeContainer,
					toColumn: overContainer,
				});
			});
		}
	};

	// Handle drag end - persist the final position
	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		// Reset drag state
		setActiveId(null);
		setActiveOrder(null);
		setSourceColumn(null);

		if (!over || !sourceColumn) return;

		const orderId = active.id as number;

		// Find target container
		const targetContainer = findContainer(optimisticColumns, over.id);

		if (!targetContainer) return;

		// Only persist if actually moved to a different column
		if (sourceColumn !== targetContainer) {
			// Validate the drop
			if (!canDropInColumn(sourceColumn, targetContainer)) {
				toast.error(t("errors.invalidTransition"));
				// Revert by invalidating queries
				queryClient.invalidateQueries({
					queryKey: orderKeys.kitchen(storeId),
				});
				return;
			}

			const newStatus = COLUMN_TO_STATUS[targetContainer];

			// Persist to server
			statusMutation.mutate({ orderId, status: newStatus });
		}
	};

	// Handle drag cancel - reset state
	const handleDragCancel = () => {
		setActiveId(null);
		setActiveOrder(null);
		setSourceColumn(null);

		// Invalidate to revert any optimistic updates
		queryClient.invalidateQueries({
			queryKey: orderKeys.kitchen(storeId),
		});
	};

	// Get order by ID from any column
	const getOrder = (orderId: number): OrderWithServicePoint | undefined => {
		for (const columnId of Object.keys(optimisticColumns) as KanbanColumnId[]) {
			const order = optimisticColumns[columnId].find((o) => o.id === orderId);
			if (order) return order;
		}
		return undefined;
	};

	return {
		// State
		columns: optimisticColumns,
		activeId,
		activeOrder,
		validDropTargets,

		// Actions
		onDragStart: handleDragStart,
		onDragOver: handleDragOver,
		onDragEnd: handleDragEnd,
		onDragCancel: handleDragCancel,
		getOrder,
	};
}
