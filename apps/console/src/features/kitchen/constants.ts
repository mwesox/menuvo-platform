/**
 * Kitchen Monitor constants for kanban board configuration.
 */

import type { OrderStatus } from "@/features/orders/constants";

// ============================================================================
// URGENCY THRESHOLDS
// ============================================================================

/** Minutes until order enters warning state (yellow) */
export const URGENCY_WARNING_MINUTES = 5;

/** Minutes until order enters critical state (red) */
export const URGENCY_CRITICAL_MINUTES = 10;

export type UrgencyLevel = "normal" | "warning" | "critical";

// ============================================================================
// COLUMN CONFIGURATION
// ============================================================================

export type KanbanColumnId = "new" | "preparing" | "ready" | "done";

export interface KanbanColumnConfig {
	id: KanbanColumnId;
	status: OrderStatus;
	labelKey: string;
	canDropFrom: KanbanColumnId[];
}

/**
 * Kanban column configuration.
 * Maps column IDs to order statuses and defines valid drop transitions.
 */
export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
	{
		id: "new",
		status: "confirmed",
		labelKey: "columns.new",
		canDropFrom: ["preparing", "done"], // Back from preparing or done (mistakes)
	},
	{
		id: "preparing",
		status: "preparing",
		labelKey: "columns.preparing",
		canDropFrom: ["new", "ready", "done"], // From any column
	},
	{
		id: "ready",
		status: "ready",
		labelKey: "columns.ready",
		canDropFrom: ["preparing", "done"], // From preparing or back from done
	},
	{
		id: "done",
		status: "completed",
		labelKey: "columns.done",
		canDropFrom: ["ready"], // Only from ready
	},
] as const;

/**
 * Maps order status to kanban column ID.
 */
export const STATUS_TO_COLUMN: Record<OrderStatus, KanbanColumnId | null> = {
	awaiting_payment: null, // Not visible in kitchen
	confirmed: "new",
	preparing: "preparing",
	ready: "ready",
	completed: "done",
	cancelled: null, // Not visible in kitchen
};

/**
 * Maps kanban column ID to order status.
 */
export const COLUMN_TO_STATUS: Record<KanbanColumnId, OrderStatus> = {
	new: "confirmed",
	preparing: "preparing",
	ready: "ready",
	done: "completed",
};

// ============================================================================
// DONE ARCHIVE
// ============================================================================

/** Hours to keep completed orders in Done column */
export const DONE_ARCHIVE_HOURS = 2;

// ============================================================================
// DEPRIORITIZATION
// ============================================================================

/** Hours until pickup time to consider an order "too far away" for deprioritization */
export const FAR_AWAY_THRESHOLD_HOURS = 2;

// ============================================================================
// NOTIFICATION
// ============================================================================

/** Notification sound configuration for Web Audio API beep */
export const NOTIFICATION_BEEP_FREQUENCY = 800; // Hz
export const NOTIFICATION_BEEP_DURATION = 0.15; // seconds
export const NOTIFICATION_BEEP_COUNT = 2; // Number of beeps
export const NOTIFICATION_BEEP_GAP = 0.1; // Gap between beeps in seconds
/** How often to repeat the notification sound while alert is active (ms) */
export const NOTIFICATION_REPEAT_INTERVAL = 10_000; // 10 seconds

// ============================================================================
// CONNECTION STATUS
// ============================================================================

/** Milliseconds to show "just reconnected" indicator after coming back online */
export const RECONNECTION_FEEDBACK_DURATION_MS = 5000;

// ============================================================================
// LABELS
// ============================================================================

export const COLUMN_LABELS: Record<KanbanColumnId, string> = {
	new: "New",
	preparing: "Preparing",
	ready: "Ready",
	done: "Done",
};
