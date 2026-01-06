import { Layers, ListChecks, UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";

type TabType = "categories" | "items" | "options";

interface EmptySelectionProps {
	tab: TabType;
}

const iconMap = {
	categories: Layers,
	items: UtensilsCrossed,
	options: ListChecks,
} as const;

export function EmptySelection({ tab }: EmptySelectionProps) {
	const { t } = useTranslation("menu");
	const Icon = iconMap[tab];

	const messages = {
		categories: {
			title: t("masterDetail.selectCategory", "Kategorie auswählen"),
			description: t(
				"masterDetail.selectCategoryDescription",
				"Wählen Sie eine Kategorie aus der Liste, um Details anzuzeigen und Artikel zu verwalten.",
			),
		},
		items: {
			title: t("masterDetail.selectItem", "Artikel auswählen"),
			description: t(
				"masterDetail.selectItemDescription",
				"Wählen Sie einen Artikel aus der Liste, um Details anzuzeigen und zu bearbeiten.",
			),
		},
		options: {
			title: t("masterDetail.selectOptionGroup", "Optionsgruppe auswählen"),
			description: t(
				"masterDetail.selectOptionGroupDescription",
				"Wählen Sie eine Optionsgruppe aus der Liste, um Details anzuzeigen und Auswahlmöglichkeiten zu verwalten.",
			),
		},
	};

	const { title, description } = messages[tab];

	return (
		<div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
			<div className="rounded-full bg-muted p-4 mb-4">
				<Icon className="size-8 text-muted-foreground" />
			</div>
			<h3 className="font-medium text-lg mb-2">{title}</h3>
			<p className="text-sm text-muted-foreground max-w-sm">{description}</p>
		</div>
	);
}
