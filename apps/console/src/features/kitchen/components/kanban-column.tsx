/**
 * Droppable kanban column for orders.
 *
 * Uses pragmatic-drag-and-drop dropTargetForElements for drop zone handling.
 * Industrial/utilitarian design - recessive headers, prominent order cards.
 *
 * Note: drag-and-drop library is dynamically imported to reduce initial bundle size
 */

import { ScrollArea } from "@menuvo/ui";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";
import type { OrderWithItems } from "@/features/orders/types";
import { cn } from "@/lib/utils";
import type { KanbanColumnId } from "../constants";
import { OrderCard } from "./order-card";

interface KanbanColumnProps {
	id: KanbanColumnId;
	orders: (OrderWithItems & {
		servicePoint?: { id: string; name: string; code: string } | null;
	})[];
	storeId: string;
	/** Check if drop from source to this column is valid */
	canDrop: (
		sourceColumn: KanbanColumnId,
		targetColumn: KanbanColumnId,
	) => boolean;
	/** Callback when "Next" button is clicked on an order */
	onNext?: (orderId: string) => void;
	/** ID of the last moved order for visual highlighting */
	lastMovedOrderId?: string | null;
	className?: string;
}

/**
 * Column styling - Clover-inspired: dark text on light bg for max readability.
 * Colored top border for quick column identification.
 */
const columnConfig: Record<KanbanColumnId, { border: string }> = {
	new: { border: "border-t-blue-500" },
	preparing: { border: "border-t-amber-500" },
	ready: { border: "border-t-green-500" },
	done: { border: "border-t-gray-400" },
};

export function KanbanColumn({
	id,
	orders,
	storeId,
	canDrop,
	onNext,
	lastMovedOrderId,
	className,
}: KanbanColumnProps) {
	const { t } = useTranslation("console-kitchen");
	const columnRef = useRef<HTMLDivElement>(null);
	const [isDraggedOver, setIsDraggedOver] = useState(false);
	const [isValidTarget, setIsValidTarget] = useState(false);

	const config = columnConfig[id];

	// Set up drop target - dynamically import to reduce initial bundle
	useEffect(() => {
		const el = columnRef.current;
		invariant(el, "Column element should exist");

		let cancelled = false;
		let cleanup: (() => void) | undefined;

		import("@atlaskit/pragmatic-drag-and-drop/element/adapter").then(
			({ dropTargetForElements }) => {
				// Skip registration if effect was already cleaned up (StrictMode double-invocation)
				if (cancelled) return;

				cleanup = dropTargetForElements({
					element: el,
					getData: () => ({ columnId: id }),
					canDrop: ({ source }) => {
						// Validate drop is allowed based on source column
						const sourceColumn = source.data.sourceColumn as KanbanColumnId;
						return canDrop(sourceColumn, id);
					},
					onDragEnter: ({ source }) => {
						setIsDraggedOver(true);
						const sourceColumn = source.data.sourceColumn as KanbanColumnId;
						setIsValidTarget(canDrop(sourceColumn, id));
					},
					onDragLeave: () => {
						setIsDraggedOver(false);
						setIsValidTarget(false);
					},
					onDrop: () => {
						setIsDraggedOver(false);
						setIsValidTarget(false);
					},
				});
			},
		);

		return () => {
			cancelled = true;
			cleanup?.();
		};
	}, [id, canDrop]);

	return (
		<div
			ref={columnRef}
			className={cn(
				"flex h-full flex-col rounded-lg border-t-4 bg-muted/30",
				config.border,
				isDraggedOver && isValidTarget && "ring-2 ring-primary ring-offset-2",
				isDraggedOver &&
					!isValidTarget &&
					"ring-2 ring-destructive/50 ring-offset-2",
				className,
			)}
		>
			{/* Column header - dark text on light bg for max readability */}
			<div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
				<h3 className="font-semibold text-foreground text-sm">
					{t(`columns.${id}`)}
				</h3>
				<span className="font-medium text-muted-foreground text-sm tabular-nums">
					{orders.length}
				</span>
			</div>

			{/* Column content */}
			<ScrollArea className="@container flex-1 p-2">
				<div className="space-y-3">
					{orders.length === 0 ? (
						<div className="py-8 text-center text-muted-foreground text-sm">
							{t(`columns.${id}Empty`)}
						</div>
					) : (
						orders.map((order) => (
							<OrderCard
								key={order.id}
								order={order}
								storeId={storeId}
								columnId={id}
								onNext={onNext}
								isLastMoved={order.id === lastMovedOrderId}
							/>
						))
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
