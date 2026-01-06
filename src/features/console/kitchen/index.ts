/**
 * Kitchen Monitor feature exports.
 *
 * Real-time kanban board for order management in kitchen/manager views.
 */

// Components
export { AudioControl } from "./components/audio-control";
export { CancelOrderDialog } from "./components/cancel-order-dialog";
export { ConnectionStatus } from "./components/connection-status";
export { KanbanBoard } from "./components/kanban-board";
export { KanbanColumn } from "./components/kanban-column";
export { KitchenPage } from "./components/kitchen-page";
export { OrderCard } from "./components/order-card";
export { OrderCardKitchen } from "./components/order-card-kitchen";
export { OrderCardManager } from "./components/order-card-manager";
export { UrgencyIndicator } from "./components/urgency-indicator";
export { ViewToggle } from "./components/view-toggle";
// Constants
export {
	COLUMN_LABELS,
	COLUMN_TO_STATUS,
	DONE_ARCHIVE_HOURS,
	KANBAN_COLUMNS,
	type KanbanColumnConfig,
	type KanbanColumnId,
	type KitchenViewMode,
	NOTIFICATION_BEEP_COUNT,
	NOTIFICATION_BEEP_DURATION,
	NOTIFICATION_BEEP_FREQUENCY,
	NOTIFICATION_BEEP_GAP,
	STATUS_TO_COLUMN,
	URGENCY_CRITICAL_MINUTES,
	URGENCY_WARNING_MINUTES,
	type UrgencyLevel,
	VIEW_MODES,
} from "./constants";
// Hooks
export { useConnectionStatus } from "./hooks/use-connection-status";
export { useKitchenBoard } from "./hooks/use-kitchen-board";
export { useOrderNotifications } from "./hooks/use-order-notifications";
export { useUrgency } from "./hooks/use-urgency";
// Logic
export {
	canDropInColumn,
	getColumnForStatus,
	getStatusForColumn,
	getValidDropTargets,
	isKitchenVisibleStatus,
} from "./logic/column-assignment";
export {
	sortByCompletionTime,
	sortByCreationTime,
	sortByUrgencyAndTime,
} from "./logic/order-sorting";
export {
	calculateUrgency,
	type ElapsedTimeData,
	getElapsedTimeData,
	getUrgencyBgColor,
	getUrgencyBorderColor,
	getUrgencyTextColor,
} from "./logic/urgency";
// Stores
export { useKitchenPreferences } from "./stores/kitchen-preferences";
export { useMutationQueue } from "./stores/mutation-queue";
