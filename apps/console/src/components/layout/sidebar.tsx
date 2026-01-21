import {
	Box,
	Button,
	HStack,
	Icon,
	Separator,
	Text,
	VStack,
} from "@chakra-ui/react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
	ChefHat,
	HelpCircle,
	Home,
	QrCode,
	Receipt,
	Settings,
	Store as StoreIcon,
	UtensilsCrossed,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/ui/logo";
import { useSidebar } from "@/contexts/sidebar-context";
import { useStoreSelection } from "@/contexts/store-selection-context";
import { LanguageSwitcher } from "./language-switcher";

type NavItem = {
	href: string;
	labelKey: string;
	icon: React.ComponentType<{ className?: string }>;
	requiresStore?: boolean;
};

// Dashboard - always visible, at top
const dashboardItem: NavItem = {
	href: "/",
	labelKey: "dashboard",
	icon: Home,
};

// Store-scoped items
const storeNavItems: NavItem[] = [
	{
		href: "/menu",
		labelKey: "menu",
		icon: UtensilsCrossed,
		requiresStore: true,
	},
	{
		href: "/orders",
		labelKey: "orders",
		icon: Receipt,
		requiresStore: true,
	},
	{
		href: "/kitchen",
		labelKey: "kitchen",
		icon: ChefHat,
		requiresStore: true,
	},
	{
		href: "/service-points",
		labelKey: "servicePoints",
		icon: QrCode,
		requiresStore: true,
	},
	{
		href: "/settings",
		labelKey: "storeSettings",
		icon: Settings,
		requiresStore: true,
	},
];

// Account-level items
const accountNavItems: NavItem[] = [
	{ href: "/stores", labelKey: "allStores", icon: StoreIcon },
	{ href: "/settings", labelKey: "settings", icon: Settings },
];

const helpItem: NavItem = {
	href: "/help",
	labelKey: "help",
	icon: HelpCircle,
};

function NavLink({
	href,
	label,
	icon: IconComponent,
	isActive,
	disabled,
}: {
	href: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	isActive: boolean;
	disabled?: boolean;
}) {
	const { setOpenMobile, isMobile } = useSidebar();

	if (disabled) {
		return (
			<Button
				variant="ghost"
				w="full"
				justifyContent="flex-start"
				disabled
				cursor="not-allowed"
				opacity={0.5}
			>
				<Icon w="4" h="4">
					<IconComponent />
				</Icon>
				<Text textStyle="sm">{label}</Text>
			</Button>
		);
	}

	return (
		<Box asChild w="full">
			<Link
				to={href}
				preload={false}
				onClick={() => isMobile && setOpenMobile(false)}
			>
				<Button
					variant={isActive ? "subtle" : "ghost"}
					w="full"
					justifyContent="flex-start"
				>
					<Icon w="4" h="4">
						<IconComponent />
					</Icon>
					<Text textStyle="sm">{label}</Text>
				</Button>
			</Link>
		</Box>
	);
}

export function AppSidebar() {
	const { t } = useTranslation("navigation");
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;
	const { selectedStoreId } = useStoreSelection();

	// Build dynamic hrefs based on store context
	const getHref = (item: NavItem): string => {
		if (item.requiresStore && selectedStoreId) {
			switch (item.href) {
				case "/menu":
					return `/stores/${selectedStoreId}/menu`;
				case "/orders":
					return `/stores/${selectedStoreId}/orders`;
				case "/kitchen":
					return `/stores/${selectedStoreId}/kitchen`;
				case "/service-points":
					return `/stores/${selectedStoreId}/service-points`;
				case "/settings":
					return `/stores/${selectedStoreId}/settings`;
				default:
					return item.href;
			}
		}
		return item.href;
	};

	const isItemActive = (item: NavItem): boolean => {
		// Dashboard - exact match only
		if (item.href === "/") {
			return currentPath === "/";
		}

		// All Stores - exact match only (NOT /stores/{id}/...)
		if (item.href === "/stores") {
			return currentPath === "/stores" || currentPath === "/stores/new";
		}

		// Account Settings - prefix match (but NOT store settings)
		if (item.href === "/settings" && !item.requiresStore) {
			return currentPath.startsWith("/settings");
		}

		// Help - prefix match
		if (item.href === "/help") {
			return currentPath.startsWith("/help");
		}

		// Store-scoped: match /stores/{id}/{section}
		if (item.requiresStore) {
			const section = item.href.slice(1); // "/menu" → "menu"
			return new RegExp(`^/stores/[^/]+/${section}(/|$)`).test(currentPath);
		}

		return false;
	};

	const hasStoreSelected = !!selectedStoreId;

	return (
		<Box
			as="aside"
			display="flex"
			h="full"
			w="64"
			flexDirection="column"
			bg="sidebar"
			color="sidebar-foreground"
		>
			<HStack
				justify="space-between"
				align="center"
				borderBottomWidth="1px"
				px="4"
				py="3"
			>
				<Link to="/">
					<Logo height={28} />
				</Link>
				<LanguageSwitcher />
			</HStack>

			<VStack flex="1" align="stretch" overflowY="auto">
				{/* Dashboard - ungrouped at top */}
				<VStack gap="0" align="stretch" p="2">
					<NavLink
						href={dashboardItem.href}
						label={t(dashboardItem.labelKey)}
						icon={dashboardItem.icon}
						isActive={isItemActive(dashboardItem)}
					/>
				</VStack>

				<Separator />

				{/* Store section */}
				<VStack gap="2" align="stretch" p="2">
					<Text
						px="2"
						textStyle="xs"
						fontWeight="semibold"
						textTransform="uppercase"
						letterSpacing="wider"
						color="fg.muted"
					>
						{t("store", "Store")}
					</Text>
					<VStack gap="0" align="stretch">
						{storeNavItems.map((item) => (
							<NavLink
								key={item.href}
								href={getHref(item)}
								label={t(item.labelKey)}
								icon={item.icon}
								isActive={isItemActive(item)}
								disabled={!hasStoreSelected}
							/>
						))}
					</VStack>
				</VStack>

				{/* Account section */}
				<VStack gap="2" align="stretch" p="2">
					<Text
						px="2"
						textStyle="xs"
						fontWeight="semibold"
						textTransform="uppercase"
						letterSpacing="wider"
						color="fg.muted"
					>
						{t("account", "Account")}
					</Text>
					<VStack gap="0" align="stretch">
						{accountNavItems.map((item) => (
							<NavLink
								key={item.href}
								href={getHref(item)}
								label={t(item.labelKey)}
								icon={item.icon}
								isActive={isItemActive(item)}
							/>
						))}
					</VStack>
				</VStack>
			</VStack>

			{/* Support section */}
			<VStack gap="2" align="stretch" p="2">
				<Text
					px="2"
					textStyle="xs"
					fontWeight="semibold"
					textTransform="uppercase"
					letterSpacing="wider"
					color="fg.muted"
				>
					{t("support", "Support")}
				</Text>
				<VStack gap="0" align="stretch">
					<NavLink
						href={helpItem.href}
						label={t(helpItem.labelKey)}
						icon={helpItem.icon}
						isActive={currentPath.startsWith(helpItem.href)}
					/>
				</VStack>
			</VStack>
		</Box>
	);
}
