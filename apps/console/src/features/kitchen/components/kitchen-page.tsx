/**
 * Main Kitchen Monitor page component.
 */

import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { skipToken, useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import type { OrderWithItems } from "@/features/orders/types";
import { useTRPC } from "@/lib/trpc";
import { useAudioPermission } from "../hooks/use-audio-permission";
import { useKitchenBoard } from "../hooks/use-kitchen-board";
import { useOrderNotifications } from "../hooks/use-order-notifications";
import { useScreenWakeLock } from "../hooks/use-screen-wake-lock";
import { AudioControl } from "./audio-control";
import { ConnectionStatus } from "./connection-status";
import { KanbanBoard } from "./kanban-board";

type RouterOutput = inferRouterOutputs<AppRouter>;
type StoreType = RouterOutput["store"]["list"][number];
type KitchenOrders = RouterOutput["order"]["listForKitchen"];
type DoneOrders = RouterOutput["order"]["kitchenDone"];

interface KitchenPageProps {
	search: {
		storeId: string;
	};
	loaderData: {
		stores: StoreType[];
		autoSelectedStoreId?: string;
	};
}

export function KitchenPage({ search, loaderData }: KitchenPageProps) {
	const { t } = useTranslation("console-kitchen");
	const { stores } = loaderData;
	const trpc = useTRPC();

	const storeId = search.storeId;

	// Fetch orders
	const { data: activeOrdersData } = useQuery(
		trpc.order.listForKitchen.queryOptions(
			storeId ? { storeId, limit: 50 } : skipToken,
		),
	);
	const activeOrdersDataTyped = activeOrdersData as KitchenOrders | undefined;
	const activeOrders = (activeOrdersDataTyped?.orders ??
		[]) as OrderWithItems[];

	const { data: doneOrdersData } = useQuery(
		trpc.order.kitchenDone.queryOptions(
			storeId ? { storeId, limit: 20 } : skipToken,
		),
	);
	const doneOrdersDataTyped = doneOrdersData as DoneOrders | undefined;
	const doneOrders = (doneOrdersDataTyped?.orders ?? []) as OrderWithItems[];

	// Initialize board state
	const { columns, moveCard, moveToNext, canDrop, lastMovedOrderId } =
		useKitchenBoard(storeId, activeOrders, doneOrders);

	// Initialize notifications and get audio control functions
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
			<Flex direction="column" height="100%">
				<PageActionBar title={t("title")} />
				<Flex flex="1" align="center" justify="center">
					<VStack gap="2" color="fg.muted">
						<Store size={48} />
						<Text>{t("noStores")}</Text>
					</VStack>
				</Flex>
			</Flex>
		);
	}

	// Build actions for action bar
	const actions = (
		<HStack gap="2" wrap="wrap">
			<AudioControl
				onRequestPermission={requestPermission}
				onPlayTestSound={playNotification}
			/>
			<ConnectionStatus />
		</HStack>
	);

	return (
		<Box
			display="flex"
			flexDirection="column"
			height="100%"
			className={alertActive ? "kitchen-alert-active" : undefined}
		>
			<PageActionBar title={t("title")} actions={actions} />

			<Box flex="1" overflow="hidden" p="4">
				<KanbanBoard
					columns={columns}
					storeId={storeId}
					moveCard={moveCard}
					moveToNext={moveToNext}
					canDrop={canDrop}
					lastMovedOrderId={lastMovedOrderId}
				/>
			</Box>
		</Box>
	);
}
