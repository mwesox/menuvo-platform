import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface MenuTabsProps {
	storeId: string;
}

export function MenuTabs({ storeId }: MenuTabsProps) {
	const { t } = useTranslation("menu");
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;

	const isCategories =
		currentPath === "/console/menu" ||
		currentPath === "/console/menu/" ||
		currentPath.startsWith("/console/menu/categories");
	const isOptions = currentPath.startsWith("/console/menu/options");

	return (
		<div className="border-b">
			<nav className="-mb-px flex gap-6" aria-label="Menu navigation">
				<Link
					to="/console/menu"
					search={{ storeId }}
					className={cn(
						"border-b-2 px-1 py-3 font-medium text-sm transition-colors",
						isCategories
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
					)}
				>
					{t("titles.categories")}
				</Link>
				<Link
					to="/console/menu/options"
					search={{ storeId }}
					className={cn(
						"border-b-2 px-1 py-3 font-medium text-sm transition-colors",
						isOptions
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
					)}
				>
					{t("titles.optionGroups")}
				</Link>
			</nav>
		</div>
	);
}
