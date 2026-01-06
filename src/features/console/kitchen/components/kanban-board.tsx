/**
 * Main kanban board component with drag-and-drop support.
 *
 * Uses pragmatic-drag-and-drop for smooth, native browser drag experience:
 * - monitorForElements at board level to handle all drops
 * - No state changes during drag (eliminates flickering)
 * - State updates only on drop
 */

import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { triggerPostMoveFlash } from "@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash";
import { LayoutGroup } from "motion/react";
import { useEffect } from "react";
import type { OrderWithItems } from "@/features/orders/types";
import { KANBAN_COLUMNS, type KanbanColumnId } from "../constants";
import { KanbanColumn } from "./kanban-column";

type OrderWithServicePoint = OrderWithItems & {
	servicePoint?: { id: number; name: string; code: string } | null;
};

interface KanbanBoardProps {
	columns: Record<KanbanColumnId, OrderWithServicePoint[]>;
	storeId: number;
	/** Move order to specific column */
	moveCard: (orderId: number, targetColumn: KanbanColumnId) => void;
	/** Move order to next column */
	moveToNext: (orderId: number) => void;
	/** Check if drop is valid */
	canDrop: (
		sourceColumn: KanbanColumnId,
		targetColumn: KanbanColumnId,
	) => boolean;
	/** ID of the last moved order for visual highlighting */
	lastMovedOrderId?: number | null;
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
	useEffect(() => {
		return monitorForElements({
			onDrop({ source, location }) {
				// Get the innermost drop target (the column)
				const destination = location.current.dropTargets[0];
				if (!destination) return;

				const orderId = source.data.orderId as number;
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
	}, [moveCard]);

	return (
		<LayoutGroup>
			<div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
			</div>
		</LayoutGroup>
	);
}
