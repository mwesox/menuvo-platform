/**
 * Toggle button group for switching between Kitchen and Manager views.
 */

import { useNavigate, useSearch } from "@tanstack/react-router";
import { ChefHat, ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { KitchenViewMode } from "../constants";

interface ViewToggleProps {
	/** Current view mode */
	currentView: KitchenViewMode;
}

export function ViewToggle({ currentView }: ViewToggleProps) {
	const { t } = useTranslation("console-kitchen");
	const navigate = useNavigate();
	const search = useSearch({ from: "/console/kitchen/" });

	const handleViewChange = (view: KitchenViewMode) => {
		navigate({
			to: "/console/kitchen",
			search: { ...search, view },
		});
	};

	return (
		<div className="flex rounded-lg border bg-muted p-1">
			<Button
				variant={currentView === "kitchen" ? "secondary" : "ghost"}
				size="sm"
				onClick={() => handleViewChange("kitchen")}
				className="gap-2"
			>
				<ChefHat className="size-4" />
				<span className="hidden sm:inline">{t("views.kitchen")}</span>
			</Button>
			<Button
				variant={currentView === "manager" ? "secondary" : "ghost"}
				size="sm"
				onClick={() => handleViewChange("manager")}
				className="gap-2"
			>
				<ClipboardList className="size-4" />
				<span className="hidden sm:inline">{t("views.manager")}</span>
			</Button>
		</div>
	);
}
