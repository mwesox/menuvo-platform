import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Languages, Settings } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MasterDetailLayout } from "@/components/layout/master-detail-layout";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	getDisplayDescription,
	getDisplayName,
} from "@/features/console/menu/logic/display";
import { translationQueries } from "../queries";
import type { EntityType, TranslationStatus } from "../schemas";
import { TranslationEditor } from "./translation-editor";
import { TranslationFilters } from "./translation-filters";
import { TranslationListItem } from "./translation-list-item";

interface TranslationsTabProps {
	storeId: number;
}

interface TranslatableEntity {
	id: number;
	name: string;
	description?: string | null;
	entityType: EntityType;
	translationStatus: TranslationStatus;
	translationStatusByLanguage: Record<string, TranslationStatus>;
	translations: Record<string, { name?: string; description?: string }>;
}

export function TranslationsTab({ storeId }: TranslationsTabProps) {
	const { t } = useTranslation("menu");

	// Filters state
	const [entityTypeFilter, setEntityTypeFilter] = useState<"all" | EntityType>(
		"all",
	);
	const [languageFilter, setLanguageFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState<"all" | TranslationStatus>(
		"all",
	);
	const [searchQuery, setSearchQuery] = useState("");
	const deferredSearch = useDeferredValue(searchQuery);

	// Selection state
	const [selectedEntity, setSelectedEntity] = useState<{
		type: EntityType;
		id: number;
	} | null>(null);

	// Fetch translation status (merchantId obtained from auth context on server)
	const { data } = useSuspenseQuery(translationQueries.status(storeId));

	// Primary language is the first supported language (fallback)
	// Target languages are all others that need translations
	const primaryLanguage = data.fallbackLanguage;
	const targetLanguages = data.supportedLanguages.slice(1);

	// Flatten all entities into a single list
	const allEntities = useMemo(() => {
		const entities: TranslatableEntity[] = [];

		// Add categories
		for (const cat of data.categories) {
			entities.push({
				id: cat.id,
				name: getDisplayName(cat.translations, primaryLanguage),
				description: getDisplayDescription(cat.translations, primaryLanguage),
				entityType: "category",
				translationStatus: cat.translationStatus,
				translationStatusByLanguage: cat.translationStatusByLanguage,
				translations: (cat.translations ?? {}) as Record<
					string,
					{ name?: string; description?: string }
				>,
			});
		}

		// Add items
		for (const item of data.items) {
			entities.push({
				id: item.id,
				name: getDisplayName(item.translations, primaryLanguage),
				description: getDisplayDescription(item.translations, primaryLanguage),
				entityType: "item",
				translationStatus: item.translationStatus,
				translationStatusByLanguage: item.translationStatusByLanguage,
				translations: (item.translations ?? {}) as Record<
					string,
					{ name?: string; description?: string }
				>,
			});
		}

		// Add option groups and their choices
		for (const og of data.optionGroups) {
			entities.push({
				id: og.id,
				name: getDisplayName(og.translations, primaryLanguage),
				description: getDisplayDescription(og.translations, primaryLanguage),
				entityType: "optionGroup",
				translationStatus: og.translationStatus,
				translationStatusByLanguage: og.translationStatusByLanguage,
				translations: (og.translations ?? {}) as Record<
					string,
					{ name?: string; description?: string }
				>,
			});

			for (const choice of og.choices) {
				entities.push({
					id: choice.id,
					name: getDisplayName(choice.translations, primaryLanguage),
					description: null,
					entityType: "optionChoice",
					translationStatus: choice.translationStatus,
					translationStatusByLanguage: choice.translationStatusByLanguage,
					translations: (choice.translations ?? {}) as Record<
						string,
						{ name?: string; description?: string }
					>,
				});
			}
		}

		return entities;
	}, [data, primaryLanguage]);

	// Apply filters
	const filteredEntities = useMemo(() => {
		return allEntities.filter((entity) => {
			// Entity type filter
			if (
				entityTypeFilter !== "all" &&
				entity.entityType !== entityTypeFilter
			) {
				return false;
			}

			// Language filter - show only entities with specific language status
			if (languageFilter !== "all") {
				const langStatus = entity.translationStatusByLanguage[languageFilter];
				if (!langStatus) return false;
				// If status filter is also applied, check both
				if (statusFilter !== "all" && langStatus !== statusFilter) {
					return false;
				}
			} else if (statusFilter !== "all") {
				// Status filter without language filter - check overall status
				if (entity.translationStatus !== statusFilter) {
					return false;
				}
			}

			// Search filter
			if (deferredSearch) {
				const searchLower = deferredSearch.toLowerCase();
				if (!entity.name.toLowerCase().includes(searchLower)) {
					return false;
				}
			}

			return true;
		});
	}, [
		allEntities,
		entityTypeFilter,
		languageFilter,
		statusFilter,
		deferredSearch,
	]);

	// Find selected entity data
	const selectedEntityData = selectedEntity
		? allEntities.find(
				(e) =>
					e.entityType === selectedEntity.type && e.id === selectedEntity.id,
			)
		: null;

	// Calculate progress stats
	const progressStats = useMemo(() => {
		const total = allEntities.length;
		const complete = allEntities.filter(
			(e) => e.translationStatus === "complete",
		).length;
		const partial = allEntities.filter(
			(e) => e.translationStatus === "partial",
		).length;
		const missing = allEntities.filter(
			(e) => e.translationStatus === "missing",
		).length;
		const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;

		return { total, complete, partial, missing, percentage };
	}, [allEntities]);

	// Handle selection
	const handleSelect = (entityType: EntityType, id: number) => {
		setSelectedEntity({ type: entityType, id });
	};

	const handleDetailClose = () => {
		setSelectedEntity(null);
	};

	// No target languages configured
	if (targetLanguages.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Languages />
					</EmptyMedia>
					<EmptyTitle>
						{t("translations.noLanguagesTitle", "No Additional Languages")}
					</EmptyTitle>
					<EmptyDescription>
						{t(
							"translations.noLanguagesDescription",
							"Configure additional languages in settings to start translating your menu content.",
						)}
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button variant="outline" asChild>
						<Link to="/console/settings/merchant">
							<Settings className="me-2 size-4" />
							{t("translations.configureLanguages", "Configure Languages")}
						</Link>
					</Button>
				</EmptyContent>
			</Empty>
		);
	}

	// Render master list
	const renderMasterList = () => (
		<div className="flex h-full flex-col">
			{/* Progress Summary */}
			<div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2.5">
				<div className="flex items-center gap-3 text-xs">
					<div className="flex items-center gap-1.5">
						<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
						<span className="font-medium">{progressStats.complete}</span>
						<span className="text-muted-foreground">complete</span>
					</div>
					<span className="text-muted-foreground/50">|</span>
					<span className="text-muted-foreground">
						{progressStats.total} items total
					</span>
				</div>
				<div className="flex items-center gap-2">
					<Progress value={progressStats.percentage} className="h-1.5 w-20" />
					<span className="w-8 text-end font-semibold text-xs tabular-nums">
						{progressStats.percentage}%
					</span>
				</div>
			</div>

			<TranslationFilters
				entityType={entityTypeFilter}
				language={languageFilter}
				status={statusFilter}
				search={searchQuery}
				targetLanguages={targetLanguages}
				onEntityTypeChange={setEntityTypeFilter}
				onLanguageChange={setLanguageFilter}
				onStatusChange={setStatusFilter}
				onSearchChange={setSearchQuery}
			/>

			<ScrollArea className="flex-1">
				<div className="space-y-1 p-2">
					{filteredEntities.length === 0 ? (
						<div className="p-8 text-center text-muted-foreground text-sm">
							{deferredSearch || statusFilter !== "all"
								? t("translations.noMatchingItems", "No matching items")
								: t("translations.noItems", "No items to translate")}
						</div>
					) : (
						filteredEntities.map((entity) => (
							<TranslationListItem
								key={`${entity.entityType}-${entity.id}`}
								id={entity.id}
								name={entity.name}
								entityType={entity.entityType}
								status={entity.translationStatus}
								statusByLanguage={entity.translationStatusByLanguage}
								targetLanguages={targetLanguages}
								isSelected={
									selectedEntity?.type === entity.entityType &&
									selectedEntity?.id === entity.id
								}
								onSelect={handleSelect}
							/>
						))
					)}
				</div>
			</ScrollArea>
		</div>
	);

	// Render detail panel
	const renderDetailPanel = () => {
		if (!selectedEntityData) {
			return (
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Languages />
						</EmptyMedia>
						<EmptyTitle>
							{t("translations.selectItemTitle", "Select an Item")}
						</EmptyTitle>
						<EmptyDescription>
							{t(
								"translations.selectItemDescription",
								"Select an item from the list to edit its translations.",
							)}
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			);
		}

		return (
			<TranslationEditor
				// Key forces remount when switching items so form resets with new values
				key={`${selectedEntityData.entityType}-${selectedEntityData.id}`}
				entityId={selectedEntityData.id}
				entityType={selectedEntityData.entityType}
				name={selectedEntityData.name}
				description={selectedEntityData.description}
				translations={selectedEntityData.translations}
				primaryLanguage={primaryLanguage}
				targetLanguages={targetLanguages}
				storeId={storeId}
				onClose={handleDetailClose}
			/>
		);
	};

	return (
		<MasterDetailLayout
			master={renderMasterList()}
			detail={renderDetailPanel()}
			hasSelection={!!selectedEntity}
			onDetailClose={handleDetailClose}
			sheetTitle={selectedEntityData?.name ?? "Translation Editor"}
			masterWidth="default"
		/>
	);
}
