import { Badge, Box, Icon } from "@chakra-ui/react";
import {
	createFileRoute,
	Outlet,
	useNavigate,
	useRouter,
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

function SettingsLayout() {
	const { t } = useTranslation("settings");
	const navigate = useNavigate();
	const router = useRouter();

	// Get tab from current route's search params
	const currentMatch = router.state.matches[router.state.matches.length - 1];
	const tab = (currentMatch?.search as { tab?: string })?.tab || "business";

	const handleTabChange = (value: string) => {
		navigate({
			to: "/settings",
			search: (prev: any) => ({ ...prev, tab: value }),
		});
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
			badge: (
				<Badge variant="subtle" textStyle="xs" fontWeight="normal">
					{t("hub.comingSoon")}
				</Badge>
			),
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
			badge: (
				<Badge variant="subtle" textStyle="xs" fontWeight="normal">
					{t("hub.comingSoon")}
				</Badge>
			),
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
							value={tab}
							onChange={handleTabChange}
						/>
					</Box>
					{/* Mobile: horizontal scroll */}
					<Box display={{ base: "block", lg: "none" }}>
						<SidebarNav
							items={navItems}
							value={tab}
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
