/**
 * Main Kitchen Monitor page component.
 */

import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ChefHat, Store } from "lucide-react";
import { useEffect, useEffectEvent } from "react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Store as StoreType } from "@/db/schema";
import { orderQueries } from "@/features/orders/queries";
import { cn } from "@/lib/utils";
import { useKitchenBoard } from "../hooks/use-kitchen-board";
import { useOrderNotifications } from "../hooks/use-order-notifications";
import { AudioControl } from "./audio-control";
import { ConnectionStatus } from "./connection-status";
import { KanbanBoard } from "./kanban-board";

interface KitchenPageProps {
	search: {
		storeId?: number;
	};
	loaderData: {
		stores: StoreType[];
		autoSelectedStoreId?: number;
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
			to: "/console/kitchen",
			search: { ...search, storeId: Number(newStoreId) },
		});
	};

	// Fetch orders (only if store selected - early return below handles no storeId case)
	const { data: activeOrders = [] } = useSuspenseQuery(
		orderQueries.kitchen(storeId ?? 0),
	);

	const { data: doneOrders = [] } = useSuspenseQuery(
		orderQueries.kitchenDone(storeId ?? 0),
	);

	// Initialize board state
	const { columns, moveCard, moveToNext, canDrop } = useKitchenBoard(
		storeId ?? 0,
		activeOrders,
		doneOrders,
	);

	// Initialize notifications and get audio control functions
	const { requestPermission, playNotification, alertActive, dismissAlert } =
		useOrderNotifications(activeOrders);

	// Stable reference to requestPermission for use in effects
	const onRequestPermission = useEffectEvent(() => {
		requestPermission();
	});

	// useEffectEvent provides a stable reference to dismissAlert that can be
	// used in the effect without being a dependency, and always has the latest value
	const onDismissAlert = useEffectEvent(() => {
		dismissAlert();
	});

	// Enable audio on first user interaction with the page
	// Browsers require a user gesture before audio can play
	useEffect(() => {
		const events = ["click", "touchstart", "keydown"] as const;

		for (const event of events) {
			window.addEventListener(event, onRequestPermission, { once: true });
		}

		return () => {
			for (const event of events) {
				window.removeEventListener(event, onRequestPermission);
			}
		};
	}, []); // onRequestPermission excluded - it's an effect event

	// Set up global event listeners to dismiss alert on any user interaction
	// Using { once: true } so listeners auto-remove after firing
	useEffect(() => {
		if (!alertActive) return;

		const events = ["mousemove", "click", "touchstart", "keydown"] as const;

		for (const event of events) {
			window.addEventListener(event, onDismissAlert, { once: true });
		}

		return () => {
			for (const event of events) {
				window.removeEventListener(event, onDismissAlert);
			}
		};
	}, [alertActive]); // onDismissAlert excluded - it's an effect event

	// No stores available
	if (stores.length === 0) {
		return (
			<TooltipProvider>
				<div className="flex h-full flex-col">
					<PageActionBar title={t("title")} />
					<div className="flex flex-1 items-center justify-center">
						<div className="flex flex-col items-center gap-2 text-muted-foreground">
							<Store className="h-12 w-12" />
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
							<ChefHat className="h-12 w-12" />
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
					/>
				</div>
			</div>
		</TooltipProvider>
	);
}
