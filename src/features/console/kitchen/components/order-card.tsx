/**
 * Draggable order card wrapper using @dnd-kit.
 * Renders either Kitchen or Manager view variant.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreVertical, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OrderWithItems } from "@/features/orders/types";
import { cn } from "@/lib/utils";
import type { KanbanColumnId, KitchenViewMode } from "../constants";
import { CancelOrderDialog } from "./cancel-order-dialog";
import { OrderCardKitchen } from "./order-card-kitchen";
import { OrderCardManager } from "./order-card-manager";

interface OrderCardProps {
	order: OrderWithItems & {
		servicePoint?: { id: number; name: string; code: string } | null;
	};
	viewMode: KitchenViewMode;
	storeId: number;
	/** Column this card is in (for done styling) */
	columnId?: KanbanColumnId;
	isDragging?: boolean;
	isOverlay?: boolean;
	/** Whether drag-and-drop is enabled (false during SSR) */
	isDndEnabled?: boolean;
	className?: string;
}

export function OrderCard({
	order,
	viewMode,
	storeId,
	columnId,
	isDragging,
	isOverlay,
	isDndEnabled = false,
	className,
}: OrderCardProps) {
	const { t } = useTranslation("console-kitchen");
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

	const sortable = useSortable({
		id: order.id,
		data: {
			type: "order",
			order,
		},
		disabled: !isDndEnabled,
	});

	const style = isDndEnabled
		? {
				transform: CSS.Transform.toString(sortable.transform),
				transition: sortable.transition,
			}
		: undefined;

	const showDragging = isDragging || sortable.isDragging;
	const isDone = columnId === "done";

	// Props for draggable element (only when dnd enabled)
	const dragProps = isDndEnabled
		? {
				ref: sortable.setNodeRef,
				style,
				...sortable.attributes,
				...sortable.listeners,
			}
		: {};

	return (
		<>
			<div
				{...dragProps}
				className={cn(
					"group relative",
					isDndEnabled &&
						"cursor-grab touch-none select-none active:cursor-grabbing",
					showDragging && "opacity-50",
					isOverlay && "rotate-3 shadow-xl",
					className,
				)}
			>
				{/* Actions menu - hidden until hover */}
				<div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 bg-background/80 backdrop-blur-sm"
								onPointerDown={(e) => e.stopPropagation()}
							>
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => setCancelDialogOpen(true)}
								className="text-destructive"
							>
								<XCircle className="mr-2 size-4" />
								{t("actions.cancel")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Card content */}
				<div>
					{viewMode === "kitchen" ? (
						<OrderCardKitchen order={order} isDone={isDone} />
					) : (
						<OrderCardManager order={order} />
					)}
				</div>
			</div>

			{/* Cancel dialog */}
			<CancelOrderDialog
				open={cancelDialogOpen}
				onOpenChange={setCancelDialogOpen}
				orderId={order.id}
				storeId={storeId}
			/>
		</>
	);
}
