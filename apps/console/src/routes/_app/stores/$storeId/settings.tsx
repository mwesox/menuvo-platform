import { Box, Icon } from "@chakra-ui/react";
import {
	createFileRoute,
	Outlet,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import {
	CalendarOff,
	Clock,
	Settings,
	ShoppingBag,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarPageLayout } from "@/components/layout/sidebar-page-layout";
import { ConsoleError } from "@/features/components/console-error";
import { DeleteStoreDialog } from "./settings/delete-store-dialog";

export const Route = createFileRoute("/_app/stores/$storeId/settings")({
	component: StoreSettingsLayout,
	errorComponent: ConsoleError,
});

function StoreSettingsLayout() {
	const { t } = useTranslation("stores");
	const navigate = useNavigate();
	const routerState = useRouterState();
	const { storeId } = Route.useParams();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	// Derive active tab from current path (like MenuTabs pattern)
	const currentPath = routerState.location.pathname;
	const basePath = `/stores/${storeId}/settings`;

	const isHours = currentPath.includes(`${basePath}/hours`);
	const isClosures = currentPath.includes(`${basePath}/closures`);
	const isOrderTypes = currentPath.includes(`${basePath}/order-types`);

	const activeValue = isHours
		? "hours"
		: isClosures
			? "closures"
			: isOrderTypes
				? "order-types"
				: "details";

	const handleTabChange = (value: string) => {
		const routes: Record<string, string> = {
			details: `/stores/${storeId}/settings`,
			hours: `/stores/${storeId}/settings/hours`,
			closures: `/stores/${storeId}/settings/closures`,
			"order-types": `/stores/${storeId}/settings/order-types`,
		};
		const route = routes[value];
		if (route) {
			navigate({ to: route });
		}
	};

	const navItems = [
		{
			value: "details",
			label: t("nav.general"),
			icon: (
				<Icon fontSize="md">
					<Settings style={{ height: "1rem", width: "1rem" }} />
				</Icon>
			),
		},
		{
			value: "hours",
			label: t("nav.hours"),
			icon: (
				<Icon fontSize="md">
					<Clock style={{ height: "1rem", width: "1rem" }} />
				</Icon>
			),
		},
		{
			value: "closures",
			label: t("nav.closures"),
			icon: (
				<Icon fontSize="md">
					<CalendarOff style={{ height: "1rem", width: "1rem" }} />
				</Icon>
			),
		},
		{
			value: "order-types",
			label: t("nav.orderTypes"),
			icon: (
				<Icon fontSize="md">
					<ShoppingBag style={{ height: "1rem", width: "1rem" }} />
				</Icon>
			),
		},
	];

	return (
		<>
			<SidebarPageLayout
				nav={
					<>
						{/* Desktop: vertical nav */}
						<Box display={{ base: "none", lg: "block" }}>
							<SidebarNav
								items={navItems}
								value={activeValue}
								onChange={handleTabChange}
								dangerItem={{
									label: t("labels.deleteStore"),
									icon: <Trash2 style={{ height: "1rem", width: "1rem" }} />,
									onClick: () => setShowDeleteDialog(true),
								}}
							/>
						</Box>
						{/* Mobile: horizontal scroll */}
						<Box display={{ base: "block", lg: "none" }}>
							<SidebarNav
								items={navItems}
								value={activeValue}
								onChange={handleTabChange}
								layout="horizontal"
							/>
						</Box>
					</>
				}
			>
				<Outlet />
			</SidebarPageLayout>

			<DeleteStoreDialog
				storeId={storeId}
				open={showDeleteDialog}
				onOpenChange={(e: { open: boolean }) => setShowDeleteDialog(e.open)}
			/>
		</>
	);
}
