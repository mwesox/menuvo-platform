/**
 * Pure functions for mapping orders to kanban columns.
 */

import type { OrderStatus } from "@/features/orders/constants";
import {
	COLUMN_TO_STATUS,
	KANBAN_COLUMNS,
	type KanbanColumnId,
	STATUS_TO_COLUMN,
} from "../constants";

/**
 * Get the kanban column ID for an order status.
 * Returns null for statuses not visible in kitchen (awaiting_payment, cancelled).
 */
export function getColumnForStatus(status: OrderStatus): KanbanColumnId | null {
	return STATUS_TO_COLUMN[status];
}

/**
 * Get the order status for a kanban column.
 */
export function getStatusForColumn(columnId: KanbanColumnId): OrderStatus {
	return COLUMN_TO_STATUS[columnId];
}

/**
 * Check if an order can be dropped into a target column.
 * Validates transition based on column configuration.
 */
export function canDropInColumn(
	fromColumnId: KanbanColumnId,
	toColumnId: KanbanColumnId,
): boolean {
	const targetColumn = KANBAN_COLUMNS.find((col) => col.id === toColumnId);
	if (!targetColumn) return false;

	return targetColumn.canDropFrom.includes(fromColumnId);
}

/**
 * Get valid drop targets for a given column.
 */
export function getValidDropTargets(
	fromColumnId: KanbanColumnId,
): KanbanColumnId[] {
	return KANBAN_COLUMNS.filter((col) =>
		col.canDropFrom.includes(fromColumnId),
	).map((col) => col.id);
}

/**
 * Check if an order status is visible in the kitchen monitor.
 */
export function isKitchenVisibleStatus(status: OrderStatus): boolean {
	return STATUS_TO_COLUMN[status] !== null;
}
