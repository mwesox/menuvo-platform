import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Link, useRouterState } from "@tanstack/react-router";
import {
	ChefHat,
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
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { cn } from "@/lib/utils";

const navItems = [
	{ href: "/console", labelKey: "dashboard", icon: Home },
	{ href: "/console/stores", labelKey: "stores", icon: Store },
	{ href: "/console/menu", labelKey: "menu", icon: UtensilsCrossed },
	{ href: "/console/orders", labelKey: "orders", icon: Receipt },
	{ href: "/console/kitchen", labelKey: "kitchen", icon: ChefHat },
	{ href: "/console/settings", labelKey: "settings", icon: Settings },
];

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
				"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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

	return (
		<div className="flex flex-col gap-1">
			{navItems.map((item) => {
				const isActive =
					item.href === "/console"
						? currentPath === "/console"
						: currentPath.startsWith(item.href);

				return (
					<NavLink
						key={item.href}
						href={item.href}
						label={t(item.labelKey)}
						icon={item.icon}
						isActive={isActive}
						onClick={onNavClick}
					/>
				);
			})}
		</div>
	);
}

export function Sidebar() {
	return (
		<aside className="hidden w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:block">
			<div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
				<Link to="/console" className="flex items-center gap-2">
					<Logo height={28} />
				</Link>
				<div className="flex items-center gap-1">
					<ThemeSwitcher />
					<LanguageSwitcher />
				</div>
			</div>
			<nav className="p-4">
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
			<SheetContent side="left" className="w-64 p-0">
				<VisuallyHidden.Root>
					<SheetTitle>{t("navigation")}</SheetTitle>
				</VisuallyHidden.Root>
				<div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
					<Link to="/console" className="flex items-center gap-2">
						<Logo height={28} />
					</Link>
					<div className="flex items-center gap-1">
						<ThemeSwitcher />
						<LanguageSwitcher />
					</div>
				</div>
				<nav className="p-4">
					<NavContent />
				</nav>
			</SheetContent>
		</Sheet>
	);
}
