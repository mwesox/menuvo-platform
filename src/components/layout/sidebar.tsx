import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Link, useRouterState } from "@tanstack/react-router";
import {
	ChefHat,
	HelpCircle,
	Home,
	Menu,
	Receipt,
	Settings,
	Store,
	UtensilsCrossed,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Logo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = {
	href: string;
	labelKey: string;
	icon: React.ComponentType<{ className?: string }>;
};

const navGroups: { labelKey: string; items: NavItem[] }[] = [
	{
		labelKey: "operations",
		items: [
			{ href: "/console", labelKey: "dashboard", icon: Home },
			{ href: "/console/orders", labelKey: "orders", icon: Receipt },
			{ href: "/console/kitchen", labelKey: "kitchen", icon: ChefHat },
		],
	},
	{
		labelKey: "management",
		items: [
			{ href: "/console/menu", labelKey: "menu", icon: UtensilsCrossed },
			{ href: "/console/stores", labelKey: "stores", icon: Store },
			{ href: "/console/settings", labelKey: "settings", icon: Settings },
		],
	},
];

const helpItem: NavItem = {
	href: "/console/help",
	labelKey: "help",
	icon: HelpCircle,
};

function NavLink({
	href,
	label,
	icon: Icon,
	isActive,
	onClick,
}: {
	href: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	isActive: boolean;
	onClick?: () => void;
}) {
	return (
		<Link
			to={href}
			preload={false}
			onClick={onClick}
			className={cn(
				"flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
				isActive
					? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
					: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
			)}
		>
			<Icon className="h-4 w-4" />
			{label}
		</Link>
	);
}

function NavContent({ onNavClick }: { onNavClick?: () => void }) {
	const { t } = useTranslation("navigation");
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	const isItemActive = (href: string) =>
		href === "/console"
			? currentPath === "/console"
			: currentPath.startsWith(href);

	return (
		<div className="flex h-full flex-col">
			<div className="flex flex-1 flex-col gap-6">
				{navGroups.map((group) => (
					<div key={group.labelKey} className="flex flex-col gap-1">
						<span className="px-3 py-1 font-medium text-xs text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
							{t(group.labelKey)}
						</span>
						{group.items.map((item) => (
							<NavLink
								key={item.href}
								href={item.href}
								label={t(item.labelKey)}
								icon={item.icon}
								isActive={isItemActive(item.href)}
								onClick={onNavClick}
							/>
						))}
					</div>
				))}
			</div>

			<div className="mt-auto">
				<Separator className="my-4" />
				<NavLink
					href={helpItem.href}
					label={t(helpItem.labelKey)}
					icon={helpItem.icon}
					isActive={isItemActive(helpItem.href)}
					onClick={onNavClick}
				/>
			</div>
		</div>
	);
}

export function Sidebar() {
	return (
		<aside className="hidden h-screen w-64 flex-col border-zinc-200 border-r bg-white lg:flex dark:border-zinc-800 dark:bg-zinc-950">
			<div className="flex h-14 shrink-0 items-center justify-between border-zinc-200 border-b px-4">
				<Link to="/console" className="flex items-center gap-2">
					<Logo height={28} />
				</Link>
				<LanguageSwitcher />
			</div>
			<nav className="flex-1 overflow-y-auto p-4">
				<NavContent />
			</nav>
		</aside>
	);
}

export function MobileSidebar() {
	const { t } = useTranslation("navigation");

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="ghost" size="icon" className="lg:hidden">
					<Menu className="h-5 w-5" />
					<span className="sr-only">{t("toggleMenu")}</span>
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="flex h-full w-64 flex-col p-0">
				<VisuallyHidden.Root>
					<SheetTitle>{t("navigation")}</SheetTitle>
				</VisuallyHidden.Root>
				<div className="flex h-14 shrink-0 items-center justify-between border-zinc-200 border-b px-4">
					<Link to="/console" className="flex items-center gap-2">
						<Logo height={28} />
					</Link>
					<LanguageSwitcher />
				</div>
				<nav className="flex-1 overflow-y-auto p-4">
					<NavContent />
				</nav>
			</SheetContent>
		</Sheet>
	);
}
