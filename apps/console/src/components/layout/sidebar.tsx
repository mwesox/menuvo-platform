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
	Store,
	UtensilsCrossed,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type NavItem = {
	href: string;
	labelKey: string;
	icon: React.ComponentType<{ className?: string }>;
};

const navGroups: { labelKey: string; items: NavItem[] }[] = [
	{
		labelKey: "operations",
		items: [
			{ href: "/", labelKey: "dashboard", icon: Home },
			{ href: "/orders", labelKey: "orders", icon: Receipt },
			{ href: "/kitchen", labelKey: "kitchen", icon: ChefHat },
		],
	},
	{
		labelKey: "management",
		items: [
			{ href: "/menu", labelKey: "menu", icon: UtensilsCrossed },
			{ href: "/stores", labelKey: "stores", icon: Store },
			{ href: "/settings", labelKey: "settings", icon: Settings },
		],
	},
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
}: {
	href: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	isActive: boolean;
}) {
	const { setOpenMobile, isMobile } = useSidebar();

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

	const isItemActive = (href: string) =>
		href === "/" ? currentPath === "/" : currentPath.startsWith(href);

	return (
		<Sidebar>
			<SidebarHeader className="flex-row items-center justify-between border-b px-4 py-3">
				<Link to="/">
					<Logo height={28} />
				</Link>
				<LanguageSwitcher />
			</SidebarHeader>

			<SidebarContent>
				{navGroups.map((group) => (
					<SidebarGroup key={group.labelKey}>
						<SidebarGroupLabel className="uppercase tracking-wider">
							{t(group.labelKey)}
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => (
									<NavLink
										key={item.href}
										href={item.href}
										label={t(item.labelKey)}
										icon={item.icon}
										isActive={isItemActive(item.href)}
									/>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter>
				<SidebarSeparator />
				<SidebarMenu>
					<NavLink
						href={helpItem.href}
						label={t(helpItem.labelKey)}
						icon={helpItem.icon}
						isActive={isItemActive(helpItem.href)}
					/>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
