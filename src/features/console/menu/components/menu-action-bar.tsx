import { Link } from "@tanstack/react-router";
import { Layers, ListChecks, Plus, Store, UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type TabValue = "categories" | "items" | "options";

interface MenuActionBarProps {
	stores: Array<{ id: number; name: string }>;
	storeId: number;
	tab: TabValue;
	counts: {
		categories: number;
		items: number;
		options: number;
	};
	onStoreChange: (storeId: number) => void;
	onTabChange: (tab: TabValue) => void;
	onAdd: () => void;
	addHref?: string;
}

export function MenuActionBar({
	stores,
	storeId,
	tab,
	counts,
	onStoreChange,
	onTabChange,
	onAdd,
	addHref,
}: MenuActionBarProps) {
	const { t } = useTranslation("menu");

	const addLabels: Record<TabValue, string> = {
		categories: t("titles.addCategory"),
		items: t("titles.addItem"),
		options: t("titles.addOptionGroup"),
	};

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b">
			<div className="flex items-center gap-3 flex-wrap">
				{/* Store selector */}
				<div className="flex items-center gap-2">
					<Store className="h-4 w-4 text-muted-foreground flex-shrink-0" />
					<Select
						value={String(storeId)}
						onValueChange={(v) => onStoreChange(Number.parseInt(v, 10))}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder={t("labels.selectStore")} />
						</SelectTrigger>
						<SelectContent>
							{stores.map((store) => (
								<SelectItem key={store.id} value={String(store.id)}>
									{store.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Tabs */}
				<Tabs value={tab} onValueChange={(v) => onTabChange(v as TabValue)}>
					<TabsList>
						<TabsTrigger value="categories" className="gap-1.5">
							<Layers className="h-3.5 w-3.5" />
							<span className="hidden sm:inline">{t("titles.categories")}</span>
							<span
								className={cn(
									"text-xs tabular-nums px-1.5 py-0.5 rounded-full",
									tab === "categories"
										? "bg-primary/20 text-primary"
										: "bg-muted text-muted-foreground",
								)}
							>
								{counts.categories}
							</span>
						</TabsTrigger>
						<TabsTrigger value="items" className="gap-1.5">
							<UtensilsCrossed className="h-3.5 w-3.5" />
							<span className="hidden sm:inline">{t("titles.items")}</span>
							<span
								className={cn(
									"text-xs tabular-nums px-1.5 py-0.5 rounded-full",
									tab === "items"
										? "bg-primary/20 text-primary"
										: "bg-muted text-muted-foreground",
								)}
							>
								{counts.items}
							</span>
						</TabsTrigger>
						<TabsTrigger value="options" className="gap-1.5">
							<ListChecks className="h-3.5 w-3.5" />
							<span className="hidden sm:inline">{t("titles.options")}</span>
							<span
								className={cn(
									"text-xs tabular-nums px-1.5 py-0.5 rounded-full",
									tab === "options"
										? "bg-primary/20 text-primary"
										: "bg-muted text-muted-foreground",
								)}
							>
								{counts.options}
							</span>
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Add button */}
			{addHref ? (
				<Button asChild>
					<Link to={addHref}>
						<Plus className="mr-2 h-4 w-4" />
						{addLabels[tab]}
					</Link>
				</Button>
			) : (
				<Button onClick={onAdd}>
					<Plus className="mr-2 h-4 w-4" />
					{addLabels[tab]}
				</Button>
			)}
		</div>
	);
}
