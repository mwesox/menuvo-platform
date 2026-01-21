import { Box, Icon } from "@chakra-ui/react";
import {
	createFileRoute,
	Outlet,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import {
	Building2,
	CreditCard,
	Globe,
	Palette,
	Sparkles,
	Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarPageLayout } from "@/components/layout/sidebar-page-layout";
import { ConsoleError } from "@/features/components/console-error";
import { trpcUtils } from "@/lib/trpc";

export const Route = createFileRoute("/_app/settings")({
	loader: async () => {
		// Prefetch merchant data for forms
		await trpcUtils.merchant.getCurrent.ensureData();
	},
	component: SettingsLayout,
	errorComponent: ConsoleError,
});

type TabValue = "business" | "language" | "payments" | "ai" | "staff" | "brand";

const routes: Record<TabValue, string> = {
	business: "/settings",
	language: "/settings/language",
	payments: "/settings/payments",
	ai: "/settings/ai",
	staff: "/settings",
	brand: "/settings",
};

function getActiveTab(pathname: string): TabValue {
	if (pathname.endsWith("/language")) return "language";
	if (pathname.endsWith("/payments")) return "payments";
	if (pathname.endsWith("/ai")) return "ai";
	return "business";
}

function SettingsLayout() {
	const { t } = useTranslation("settings");
	const navigate = useNavigate();
	const routerState = useRouterState();

	// Derive active tab from pathname
	const activeTab = getActiveTab(routerState.location.pathname);

	const handleTabChange = (value: string) => {
		const tab = value as TabValue;
		navigate({ to: routes[tab] });
	};

	const navItems = [
		{
			value: "business",
			label: t("nav.business"),
			icon: (
				<Icon fontSize="md">
					<Building2 style={{ height: "1rem", width: "1rem" }} />
				</Icon>
			),
		},
		{
			value: "language",
			label: t("nav.language"),
			icon: (
				<Icon fontSize="md">
					<Globe style={{ height: "1rem", width: "1rem" }} />
				</Icon>
			),
		},
		{
			value: "payments",
			label: t("nav.payments"),
			icon: (
				<Icon fontSize="md">
					<CreditCard style={{ height: "1rem", width: "1rem" }} />
				</Icon>
			),
		},
		{
			value: "ai",
			label: t("nav.ai"),
			icon: (
				<Icon fontSize="md">
					<Sparkles style={{ height: "1rem", width: "1rem" }} />
				</Icon>
			),
		},
		{
			value: "staff",
			label: t("nav.staff"),
			icon: (
				<Icon fontSize="md">
					<Users style={{ height: "1rem", width: "1rem" }} />
				</Icon>
			),
			disabled: true,
		},
		{
			value: "brand",
			label: t("nav.brand"),
			icon: (
				<Icon fontSize="md">
					<Palette style={{ height: "1rem", width: "1rem" }} />
				</Icon>
			),
			disabled: true,
		},
	];

	return (
		<SidebarPageLayout
			nav={
				<>
					{/* Desktop: vertical nav */}
					<Box display={{ base: "none", lg: "block" }}>
						<SidebarNav
							items={navItems}
							value={activeTab}
							onChange={handleTabChange}
						/>
					</Box>
					{/* Mobile: horizontal scroll */}
					<Box display={{ base: "block", lg: "none" }}>
						<SidebarNav
							items={navItems}
							value={activeTab}
							onChange={handleTabChange}
							layout="horizontal"
						/>
					</Box>
				</>
			}
		>
			<Outlet />
		</SidebarPageLayout>
	);
}
