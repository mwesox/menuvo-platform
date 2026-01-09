import {
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@menuvo/ui";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_OPTIONS } from "../constants";
import type { EntityType, TranslationStatus } from "../schemas";

interface TranslationFiltersProps {
	entityType: "all" | EntityType;
	language: string;
	status: "all" | TranslationStatus;
	search: string;
	targetLanguages: string[];
	onEntityTypeChange: (value: "all" | EntityType) => void;
	onLanguageChange: (value: string) => void;
	onStatusChange: (value: "all" | TranslationStatus) => void;
	onSearchChange: (value: string) => void;
}

export function TranslationFilters({
	entityType,
	language,
	status,
	search,
	targetLanguages,
	onEntityTypeChange,
	onLanguageChange,
	onStatusChange,
	onSearchChange,
}: TranslationFiltersProps) {
	const { t } = useTranslation("menu");

	return (
		<div className="flex flex-wrap items-center gap-2 border-b p-3">
			{/* Filter dropdowns - stay together */}
			<div className="flex flex-wrap items-center gap-2">
				{/* Entity type filter */}
				<Select
					value={entityType}
					onValueChange={(value) =>
						onEntityTypeChange(value as "all" | EntityType)
					}
				>
					<SelectTrigger className="h-8 w-auto min-w-[110px] text-xs">
						<SelectValue placeholder="All types" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Types</SelectItem>
						<SelectItem value="category">Categories</SelectItem>
						<SelectItem value="item">Items</SelectItem>
						<SelectItem value="optionGroup">Option Groups</SelectItem>
						<SelectItem value="optionChoice">Options</SelectItem>
					</SelectContent>
				</Select>

				{/* Language filter */}
				<Select value={language} onValueChange={onLanguageChange}>
					<SelectTrigger className="h-8 w-auto min-w-[100px] text-xs">
						<SelectValue placeholder="All languages" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Languages</SelectItem>
						{targetLanguages.map((lang) => {
							const langOption = LANGUAGE_OPTIONS.find((l) => l.value === lang);
							return (
								<SelectItem key={lang} value={lang}>
									{langOption?.label ?? lang}
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>

				{/* Status filter */}
				<Select
					value={status}
					onValueChange={(value) =>
						onStatusChange(value as "all" | TranslationStatus)
					}
				>
					<SelectTrigger className="h-8 w-auto min-w-[90px] text-xs">
						<SelectValue placeholder="All status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="complete">
							<span className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-green-500" />
								Complete
							</span>
						</SelectItem>
						<SelectItem value="partial">
							<span className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-yellow-500" />
								Partial
							</span>
						</SelectItem>
						<SelectItem value="missing">
							<span className="flex items-center gap-1.5">
								<span className="size-2 rounded-full bg-red-500" />
								Missing
							</span>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Search - takes remaining space */}
			<div className="relative min-w-[140px] flex-1">
				<Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder={t("placeholders.searchTranslations", "Search...")}
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					className="h-8 ps-8 text-xs"
				/>
			</div>
		</div>
	);
}
