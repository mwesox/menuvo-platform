import {
	LanguageSwitcher,
	Logo,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
	useSidebar,
} from "@menuvo/ui";
import { Link, useRouterState } from "@tanstack/react-router";
import {
	ChefHat,
	HelpCircle,
	Home,
	Receipt,
	Settings,
	Store as StoreIcon,
	UtensilsCrossed,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStoreSelection } from "@/contexts/store-selection-context";

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
	icon: Icon,
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
			<SidebarMenuItem>
				<SidebarMenuButton disabled className="cursor-not-allowed opacity-50">
					<Icon className="size-4" />
					<span>{label}</span>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={isActive}>
				<Link
					to={href}
					preload={false}
					onClick={() => isMobile && setOpenMobile(false)}
				>
					<Icon className="size-4" />
					<span>{label}</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
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
		<Sidebar>
			<SidebarHeader className="flex-row items-center justify-between border-b px-4 py-3">
				<Link to="/">
					<Logo height={28} />
				</Link>
				<LanguageSwitcher />
			</SidebarHeader>

			<SidebarContent>
				{/* Dashboard - ungrouped at top */}
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<NavLink
								href={dashboardItem.href}
								label={t(dashboardItem.labelKey)}
								icon={dashboardItem.icon}
								isActive={isItemActive(dashboardItem)}
							/>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<SidebarSeparator />

				{/* Store section */}
				<SidebarGroup>
					<SidebarGroupLabel className="uppercase tracking-wider">
						{t("store", "Store")}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
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
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Account section */}
				<SidebarGroup>
					<SidebarGroupLabel className="uppercase tracking-wider">
						{t("account", "Account")}
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{accountNavItems.map((item) => (
								<NavLink
									key={item.href}
									href={getHref(item)}
									label={t(item.labelKey)}
									icon={item.icon}
									isActive={isItemActive(item)}
								/>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<SidebarSeparator />
				<SidebarMenu>
					<NavLink
						href={helpItem.href}
						label={t(helpItem.labelKey)}
						icon={helpItem.icon}
						isActive={currentPath.startsWith(helpItem.href)}
					/>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
