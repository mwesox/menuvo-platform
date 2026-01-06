/**
 * Droppable kanban column for orders.
 */

import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Bell, CheckCircle, ChefHat, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OrderWithItems } from "@/features/orders/types";
import { cn } from "@/lib/utils";
import type { KanbanColumnId, KitchenViewMode } from "../constants";
import { OrderCard } from "./order-card";

interface KanbanColumnProps {
	id: KanbanColumnId;
	orders: (OrderWithItems & {
		servicePoint?: { id: number; name: string; code: string } | null;
	})[];
	viewMode: KitchenViewMode;
	storeId: number;
	isValidDropTarget: boolean;
	activeId: number | null;
	/** Whether drag-and-drop is enabled (false during SSR) */
	isDndEnabled?: boolean;
	className?: string;
}

const columnConfig: Record<
	KanbanColumnId,
	{ border: string; headerBg: string; headerText: string }
> = {
	new: {
		border: "border-t-blue-500",
		headerBg: "bg-blue-500/10",
		headerText: "text-blue-700 dark:text-blue-400",
	},
	preparing: {
		border: "border-t-orange-500",
		headerBg: "bg-orange-500/10",
		headerText: "text-orange-700 dark:text-orange-400",
	},
	ready: {
		border: "border-t-green-500",
		headerBg: "bg-green-500/10",
		headerText: "text-green-700 dark:text-green-400",
	},
	done: {
		border: "border-t-gray-400",
		headerBg: "bg-muted/50",
		headerText: "text-muted-foreground",
	},
};

const columnIcons: Record<KanbanColumnId, React.ReactNode> = {
	new: <Inbox className="size-5" />,
	preparing: <ChefHat className="size-5" />,
	ready: <Bell className="size-5" />,
	done: <CheckCircle className="size-5" />,
};

export function KanbanColumn({
	id,
	orders,
	viewMode,
	storeId,
	isValidDropTarget,
	activeId,
	isDndEnabled = false,
	className,
}: KanbanColumnProps) {
	const { t } = useTranslation("console-kitchen");

	// Only use dnd-kit hooks when enabled (client-side)
	const droppable = useDroppable({
		id: `column-${id}`,
		data: {
			type: "column",
			columnId: id,
		},
		disabled: !isDndEnabled,
	});

	const orderIds = orders.map((o) => o.id);
	const config = columnConfig[id];

	const orderCards = orders.map((order) => (
		<OrderCard
			key={order.id}
			order={order}
			viewMode={viewMode}
			storeId={storeId}
			columnId={id}
			isDragging={order.id === activeId}
			isDndEnabled={isDndEnabled}
		/>
	));

	return (
		<div
			ref={isDndEnabled ? droppable.setNodeRef : undefined}
			className={cn(
				"flex h-full flex-col rounded-lg border-t-4 bg-muted/30",
				config.border,
				isDndEnabled &&
					droppable.isOver &&
					isValidDropTarget &&
					"ring-2 ring-primary ring-offset-2",
				isDndEnabled &&
					isValidDropTarget &&
					!droppable.isOver &&
					"ring-1 ring-primary/30",
				className,
			)}
		>
			{/* Column header */}
			<div
				className={cn(
					"flex items-center gap-2 border-b px-4 py-3",
					config.headerBg,
				)}
			>
				<span className={config.headerText}>{columnIcons[id]}</span>
				<h3 className={cn("flex-1 text-lg font-bold", config.headerText)}>
					{t(`columns.${id}`)}
				</h3>
				<Badge variant="secondary" className="font-mono text-sm">
					{orders.length}
				</Badge>
			</div>

			{/* Column content */}
			<ScrollArea className="flex-1 p-2">
				{isDndEnabled ? (
					<SortableContext
						items={orderIds}
						strategy={verticalListSortingStrategy}
					>
						<div className="space-y-3">
							{orders.length === 0 ? (
								<div className="py-8 text-center text-sm text-muted-foreground">
									{t(`columns.${id}Empty`)}
								</div>
							) : (
								orderCards
							)}
						</div>
					</SortableContext>
				) : (
					<div className="space-y-3">
						{orders.length === 0 ? (
							<div className="py-8 text-center text-sm text-muted-foreground">
								{t(`columns.${id}Empty`)}
							</div>
						) : (
							orderCards
						)}
					</div>
				)}
			</ScrollArea>
		</div>
	);
}
