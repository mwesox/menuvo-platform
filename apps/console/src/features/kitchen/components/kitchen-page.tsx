/**
 * Main Kitchen Monitor page component.
 */

import type { Store as StoreType } from "@menuvo/db/schema";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	TooltipProvider,
} from "@menuvo/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ChefHat, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { orderQueries } from "@/features/orders/queries";
import { cn } from "@/lib/utils";
import { useAudioPermission } from "../hooks/use-audio-permission";
import { useKitchenBoard } from "../hooks/use-kitchen-board";
import { useOrderNotifications } from "../hooks/use-order-notifications";
import { useScreenWakeLock } from "../hooks/use-screen-wake-lock";
import { AudioControl } from "./audio-control";
import { ConnectionStatus } from "./connection-status";
import { KanbanBoard } from "./kanban-board";

interface KitchenPageProps {
	search: {
		storeId?: string;
	};
	loaderData: {
		stores: StoreType[];
		autoSelectedStoreId?: string;
	};
}

export function KitchenPage({ search, loaderData }: KitchenPageProps) {
	const { t } = useTranslation("console-kitchen");
	const navigate = useNavigate();
	const { stores, autoSelectedStoreId } = loaderData;

	// Determine effective store ID
	const storeId = search.storeId ?? autoSelectedStoreId;
	const hasMultipleStores = stores.length > 1;

	// Handle store change
	const handleStoreChange = (newStoreId: string) => {
		navigate({
			to: "/kitchen",
			search: { ...search, storeId: newStoreId },
		});
	};

	// Fetch orders (only if store selected - early return below handles no storeId case)
	// API returns { orders: [...], nextCursor } so we need to extract the orders array
	const { data: activeOrdersData } = useSuspenseQuery(
		orderQueries.kitchen(storeId ?? ""),
	);
	const activeOrders = activeOrdersData?.orders ?? [];

	const { data: doneOrdersData } = useSuspenseQuery(
		orderQueries.kitchenDone(storeId ?? ""),
	);
	const doneOrders = doneOrdersData?.orders ?? [];

	// Initialize board state
	const { columns, moveCard, moveToNext, canDrop, lastMovedOrderId } =
		useKitchenBoard(storeId ?? "", activeOrders, doneOrders);

	// Initialize notifications and get audio control functions
	// Pass ALL orders (active + done) so we track all IDs and don't alert when moving from done
	const allOrders = [...activeOrders, ...doneOrders];
	const { requestPermission, playNotification, alertActive, dismissAlert } =
		useOrderNotifications(allOrders);

	// Set up audio permission and alert dismissal effects
	useAudioPermission({ requestPermission, alertActive, dismissAlert });

	// Keep screen awake to prevent tablet from sleeping
	useScreenWakeLock();

	// No stores available
	if (stores.length === 0) {
		return (
			<TooltipProvider>
				<div className="flex h-full flex-col">
					<PageActionBar title={t("title")} />
					<div className="flex flex-1 items-center justify-center">
						<div className="flex flex-col items-center gap-2 text-muted-foreground">
							<Store className="size-12" />
							<p>{t("noStores")}</p>
						</div>
					</div>
				</div>
			</TooltipProvider>
		);
	}

	// Build actions for action bar
	const actions = (
		<div className="flex flex-wrap items-center gap-2">
			{/* Store selector (if multiple stores) */}
			{hasMultipleStores && (
				<Select value={storeId?.toString()} onValueChange={handleStoreChange}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder={t("selectStorePlaceholder")} />
					</SelectTrigger>
					<SelectContent>
						{stores.map((store) => (
							<SelectItem key={store.id} value={store.id.toString()}>
								{store.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}

			{/* Audio control */}
			<AudioControl
				onRequestPermission={requestPermission}
				onPlayTestSound={playNotification}
			/>

			{/* Connection status */}
			<ConnectionStatus />
		</div>
	);

	// No store selected state
	if (!storeId) {
		return (
			<TooltipProvider>
				<div className="flex h-full flex-col">
					<PageActionBar title={t("title")} actions={actions} />
					<div className="flex flex-1 items-center justify-center">
						<div className="flex flex-col items-center gap-2 text-muted-foreground">
							<ChefHat className="size-12" />
							<p>{t("selectStore")}</p>
						</div>
					</div>
				</div>
			</TooltipProvider>
		);
	}

	return (
		<TooltipProvider>
			<div
				className={cn(
					"flex h-full flex-col",
					alertActive && "kitchen-alert-active",
				)}
			>
				{/* Action bar */}
				<PageActionBar title={t("title")} actions={actions} />

				{/* Kanban board */}
				<div className="flex-1 overflow-hidden p-4">
					<KanbanBoard
						columns={columns}
						storeId={storeId}
						moveCard={moveCard}
						moveToNext={moveToNext}
						canDrop={canDrop}
						lastMovedOrderId={lastMovedOrderId}
					/>
				</div>
			</div>
		</TooltipProvider>
	);
}
