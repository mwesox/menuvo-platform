/**
 * Main kanban board component with drag-and-drop support.
 *
 * Uses @dnd-kit with proper multi-container support:
 * - onDragOver moves items between columns during drag
 * - DragOverlay provides smooth visual feedback
 * - Multiple SortableContext (one per column) is the correct pattern
 *
 * Note: DndContext is client-only to avoid hydration mismatch
 * (aria-describedby IDs differ between server/client)
 */

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useEffect, useState } from "react";
import type { OrderWithItems } from "@/features/orders/types";
import {
	KANBAN_COLUMNS,
	type KanbanColumnId,
	type KitchenViewMode,
} from "../constants";
import { KanbanColumn } from "./kanban-column";
import { OrderCard } from "./order-card";

type OrderWithServicePoint = OrderWithItems & {
	servicePoint?: { id: number; name: string; code: string } | null;
};

interface KanbanBoardProps {
	columns: Record<KanbanColumnId, OrderWithServicePoint[]>;
	viewMode: KitchenViewMode;
	storeId: number;
	activeId: number | null;
	activeOrder: OrderWithServicePoint | null;
	validDropTargets: KanbanColumnId[];
	onDragStart: (event: DragStartEvent) => void;
	onDragOver: (event: DragOverEvent) => void;
	onDragEnd: (event: DragEndEvent) => void;
	onDragCancel: () => void;
}

export function KanbanBoard({
	columns,
	viewMode,
	storeId,
	activeId,
	activeOrder,
	validDropTargets,
	onDragStart,
	onDragOver,
	onDragEnd,
	onDragCancel,
}: KanbanBoardProps) {
	// Client-only rendering to avoid hydration mismatch with dnd-kit's aria IDs
	const [isClient, setIsClient] = useState(false);
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Configure sensors for mouse, touch, and keyboard
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8, // Require 8px movement before starting drag
			},
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				delay: 250, // Long press for touch
				tolerance: 5,
			},
		}),
		useSensor(KeyboardSensor),
	);

	// Render static grid during SSR, DndContext only on client
	const content = (
		<div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
			{KANBAN_COLUMNS.map((column) => (
				<KanbanColumn
					key={column.id}
					id={column.id}
					orders={columns[column.id]}
					viewMode={viewMode}
					storeId={storeId}
					isValidDropTarget={validDropTargets.includes(column.id)}
					activeId={activeId}
					isDndEnabled={isClient}
				/>
			))}
		</div>
	);

	// During SSR, render without DndContext to avoid hydration mismatch
	if (!isClient) {
		return content;
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToWindowEdges]}
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDragEnd={onDragEnd}
			onDragCancel={onDragCancel}
		>
			{content}

			{/* DragOverlay renders outside of column flow for smooth dragging */}
			<DragOverlay dropAnimation={null}>
				{activeId && activeOrder ? (
					<OrderCard
						order={activeOrder}
						viewMode={viewMode}
						storeId={storeId}
						isOverlay
					/>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}
