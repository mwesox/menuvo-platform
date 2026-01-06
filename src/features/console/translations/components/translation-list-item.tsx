import { Circle, Layers, ListChecks, UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { EntityType, TranslationStatus } from "../schemas";
import { TranslationStatusBadge } from "./translation-status-badge";

interface TranslationListItemProps {
	id: number;
	name: string;
	entityType: EntityType;
	status: TranslationStatus;
	statusByLanguage: Record<string, TranslationStatus>;
	targetLanguages: string[];
	isSelected: boolean;
	onSelect: (entityType: EntityType, id: number) => void;
}

const entityIcons = {
	category: Layers,
	item: UtensilsCrossed,
	optionGroup: ListChecks,
	optionChoice: Circle,
};

// Status color mapping for left border indicator
const statusColors = {
	complete: "border-l-green-500",
	partial: "border-l-yellow-500",
	missing: "border-l-red-500",
};

export function TranslationListItem({
	id,
	name,
	entityType,
	status,
	statusByLanguage,
	targetLanguages,
	isSelected,
	onSelect,
}: TranslationListItemProps) {
	const { t } = useTranslation("common");
	const Icon = entityIcons[entityType];

	return (
		<button
			type="button"
			onClick={() => onSelect(entityType, id)}
			className={cn(
				"w-full rounded-lg border-l-2 px-3 py-2 text-start transition-colors",
				"hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				isSelected ? "border-l-primary bg-accent" : statusColors[status],
			)}
		>
			<div className="flex items-center gap-2.5">
				{/* Entity type icon - smaller */}
				<div
					className={cn(
						"flex size-7 flex-shrink-0 items-center justify-center rounded",
						isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
					)}
				>
					<Icon className="h-3.5 w-3.5" />
				</div>

				{/* Entity info - allow truncation */}
				<div className="min-w-0 flex-1 overflow-hidden">
					<span className="block truncate font-medium text-sm">{name}</span>
					<span className="text-[11px] text-muted-foreground">
						{t(`entityTypes.${entityType}`)}
					</span>
				</div>

				{/* Translation status badges - NEVER truncate */}
				<div className="flex flex-shrink-0 items-center gap-0.5">
					{targetLanguages.map((lang) => (
						<TranslationStatusBadge
							key={lang}
							status={statusByLanguage[lang] ?? "missing"}
							languageCode={lang}
							size="sm"
						/>
					))}
				</div>
			</div>
		</button>
	);
}
