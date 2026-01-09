/**
 * Draggable order card wrapper using pragmatic-drag-and-drop.
 *
 * Uses native browser drag API for smooth, flicker-free dragging.
 * Motion's layoutId enables smooth position animations when cards move between columns.
 */

import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@menuvo/ui";
import { MoreVertical, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";
import type { OrderWithItems } from "@/features/orders/types";
import { cn } from "@/lib/utils";
import type { KanbanColumnId } from "../constants";
import { CancelOrderDialog } from "./cancel-order-dialog";
import { OrderCardKitchen } from "./order-card-kitchen";

interface OrderCardProps {
	order: OrderWithItems & {
		servicePoint?: { id: string; name: string; code: string } | null;
	};
	storeId: string;
	/** Column this card is in (passed to drag data for drop validation) */
	columnId: KanbanColumnId;
	/** Callback when "Next" button is clicked */
	onNext?: (orderId: string) => void;
	/** Whether this card was the last one moved (for visual highlighting) */
	isLastMoved?: boolean;
	className?: string;
}

export function OrderCard({
	order,
	storeId,
	columnId,
	onNext,
	isLastMoved,
	className,
}: OrderCardProps) {
	const { t } = useTranslation("console-kitchen");
	const cardRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

	// Set up draggable
	useEffect(() => {
		const el = cardRef.current;
		invariant(el, "Card element should exist");

		return draggable({
			element: el,
			getInitialData: () => ({
				orderId: order.id,
				sourceColumn: columnId,
				type: "order",
			}),
			onDragStart: () => setIsDragging(true),
			onDrop: () => setIsDragging(false),
		});
	}, [order.id, columnId]);

	return (
		<>
			<motion.div
				ref={cardRef}
				layoutId={`order-card-${order.id}`}
				data-order-id={order.id}
				className={cn(
					"group relative cursor-grab rounded-lg active:cursor-grabbing",
					isDragging && "opacity-50",
					className,
				)}
				transition={{
					layout: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
				}}
			>
				{/* Actions menu - hidden until hover */}
				<div className="absolute end-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="size-7 bg-background/80 backdrop-blur-sm"
							>
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={() => setCancelDialogOpen(true)}
								className="text-destructive"
							>
								<XCircle className="me-2 size-4" />
								{t("actions.cancel")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Card content */}
				<OrderCardKitchen
					order={order}
					columnId={columnId}
					onNext={onNext ? () => onNext(order.id) : undefined}
					isLastMoved={isLastMoved}
				/>
			</motion.div>

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
