import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/store-context";
import { cn } from "@/lib/utils";

export function MenuTabs() {
	const { t } = useTranslation("menu");
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;
	const store = useStore();

	const basePath = `/stores/${store.id}/menu`;

	const isCategories =
		currentPath === basePath ||
		currentPath === `${basePath}/` ||
		currentPath.includes(`${basePath}/categories`);
	const isOptions = currentPath.includes(`${basePath}/options`);
	const isVat = currentPath.includes(`${basePath}/vat`);
	const isImport = currentPath.includes(`${basePath}/import`);

	return (
		<div className="border-b">
			<nav className="-mb-px flex gap-6" aria-label="Menu navigation">
				<Link
					to="/stores/$storeId/menu"
					params={{ storeId: store.id }}
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
					to="/stores/$storeId/menu/options"
					params={{ storeId: store.id }}
					className={cn(
						"border-b-2 px-1 py-3 font-medium text-sm transition-colors",
						isOptions
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
					)}
				>
					{t("titles.optionGroups")}
				</Link>
				<Link
					to="/stores/$storeId/menu/vat"
					params={{ storeId: store.id }}
					className={cn(
						"border-b-2 px-1 py-3 font-medium text-sm transition-colors",
						isVat
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
					)}
				>
					{t("vat.titles.vatGroups")}
				</Link>
				<Link
					to="/stores/$storeId/menu/import"
					params={{ storeId: store.id }}
					className={cn(
						"border-b-2 px-1 py-3 font-medium text-sm transition-colors",
						isImport
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground",
					)}
				>
					{t("titles.aiDataImport")}
				</Link>
			</nav>
		</div>
	);
}
