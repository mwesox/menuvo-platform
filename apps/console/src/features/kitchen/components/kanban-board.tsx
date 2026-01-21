/**
 * Main kanban board component with drag-and-drop support.
 *
 * Uses pragmatic-drag-and-drop for smooth, native browser drag experience:
 * - monitorForElements at board level to handle all drops
 * - No state changes during drag (eliminates flickering)
 * - State updates only on drop
 *
 * Note: drag-and-drop libraries are dynamically imported to reduce initial bundle (~76ms savings)
 */

import { Box } from "@chakra-ui/react";
import { LayoutGroup } from "motion/react";
import { useEffect } from "react";
import type { OrderWithItems } from "@/features/orders/types";
import { KANBAN_COLUMNS, type KanbanColumnId } from "../constants";
import { KanbanColumn } from "./kanban-column";

type OrderWithServicePoint = OrderWithItems & {
	servicePoint?: { id: string; name: string; code: string } | null;
};

interface KanbanBoardProps {
	columns: Record<KanbanColumnId, OrderWithServicePoint[]>;
	storeId: string;
	/** Move order to specific column */
	moveCard: (orderId: string, targetColumn: KanbanColumnId) => void;
	/** Move order to next column */
	moveToNext: (orderId: string) => void;
	/** Check if drop is valid */
	canDrop: (
		sourceColumn: KanbanColumnId,
		targetColumn: KanbanColumnId,
	) => boolean;
	/** ID of the last moved order for visual highlighting */
	lastMovedOrderId?: string | null;
}

export function KanbanBoard({
	columns,
	storeId,
	moveCard,
	moveToNext,
	canDrop,
	lastMovedOrderId,
}: KanbanBoardProps) {
	// Monitor all drag operations at board level
	// Libraries are dynamically imported to reduce initial bundle size
	useEffect(() => {
		let cancelled = false;
		let cleanup: (() => void) | undefined;

		// Dynamically import drag-and-drop libraries
		Promise.all([
			import("@atlaskit/pragmatic-drag-and-drop/element/adapter"),
			import(
				"@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash"
			),
		]).then(([{ monitorForElements }, { triggerPostMoveFlash }]) => {
			// Skip registration if effect was already cleaned up (StrictMode double-invocation)
			if (cancelled) return;

			cleanup = monitorForElements({
				onDrop({ source, location }) {
					// Get the innermost drop target (the column)
					const destination = location.current.dropTargets[0];
					if (!destination) return;

					const orderId = source.data.orderId as string;
					const targetColumn = destination.data.columnId as KanbanColumnId;

					moveCard(orderId, targetColumn);

					// Trigger post-move flash after React re-renders
					requestAnimationFrame(() => {
						const droppedCard = document.querySelector(
							`[data-order-id="${orderId}"]`,
						);
						if (droppedCard instanceof HTMLElement) {
							triggerPostMoveFlash(droppedCard);
						}
					});
				},
			});
		});

		return () => {
			cancelled = true;
			cleanup?.();
		};
	}, [moveCard]);

	return (
		<LayoutGroup>
			<Box
				display="grid"
				height="100%"
				gridTemplateColumns={{
					base: "1fr",
					md: "repeat(2, 1fr)",
					lg: "repeat(3, 1fr)",
					xl: "repeat(4, 1fr)",
				}}
				gap="4"
			>
				{KANBAN_COLUMNS.map((column) => (
					<KanbanColumn
						key={column.id}
						id={column.id}
						orders={columns[column.id]}
						storeId={storeId}
						canDrop={canDrop}
						onNext={moveToNext}
						lastMovedOrderId={lastMovedOrderId}
					/>
				))}
			</Box>
		</LayoutGroup>
	);
}
