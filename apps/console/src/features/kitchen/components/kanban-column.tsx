/**
 * Droppable kanban column for orders.
 *
 * Uses pragmatic-drag-and-drop dropTargetForElements for drop zone handling.
 * Industrial/utilitarian design - recessive headers, prominent order cards.
 *
 * Note: drag-and-drop library is dynamically imported to reduce initial bundle size
 */

import { Box, Flex, ScrollArea, Text, VStack } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";
import { Label } from "@/components/ui/typography";
import type { OrderWithItems } from "@/features/orders/types";
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
const columnConfig: Record<KanbanColumnId, { borderColor: string }> = {
	new: { borderColor: "blue.500" },
	preparing: { borderColor: "amber.500" },
	ready: { borderColor: "green.500" },
	done: { borderColor: "gray.400" },
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
		<Box
			ref={columnRef}
			display="flex"
			flexDirection="column"
			height="100%"
			rounded="lg"
			borderTopWidth="4px"
			borderTopColor={config.borderColor}
			bg="bg.muted"
			outline={
				isDraggedOver && isValidTarget
					? "2px solid"
					: isDraggedOver && !isValidTarget
						? "2px solid"
						: undefined
			}
			outlineColor={
				isDraggedOver && isValidTarget
					? "colorPalette.500"
					: isDraggedOver && !isValidTarget
						? "destructive/50"
						: undefined
			}
			outlineOffset={isDraggedOver ? "2px" : undefined}
			className={className}
		>
			{/* Column header - dark text on light bg for max readability */}
			<Flex
				alignItems="center"
				justifyContent="space-between"
				borderBottomWidth="1px"
				px="3"
				py="2"
			>
				<Label color="fg">{t(`columns.${id}`)}</Label>
				<Text
					fontWeight="medium"
					color="fg.muted"
					textStyle="sm"
					fontVariantNumeric="tabular-nums"
				>
					{orders.length}
				</Text>
			</Flex>

			{/* Column content */}
			<ScrollArea.Root className="@container" flex="1" p="2">
				<ScrollArea.Viewport>
					<ScrollArea.Content>
						<VStack gap="3">
							{orders.length === 0 ? (
								<Box py="8" textAlign="center" color="fg.muted" textStyle="sm">
									{t(`columns.${id}Empty`)}
								</Box>
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
						</VStack>
					</ScrollArea.Content>
				</ScrollArea.Viewport>
				<ScrollArea.Scrollbar>
					<ScrollArea.Thumb />
				</ScrollArea.Scrollbar>
			</ScrollArea.Root>
		</Box>
	);
}
