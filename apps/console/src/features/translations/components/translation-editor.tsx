import {
	Button,
	Field,
	FieldLabel,
	Input,
	ScrollArea,
	Textarea,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { Circle, Layers, ListChecks, UtensilsCrossed, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_OPTIONS } from "../constants";
import {
	useUpdateCategoryTranslations,
	useUpdateItemTranslations,
	useUpdateOptionChoiceTranslations,
	useUpdateOptionGroupTranslations,
} from "../queries";
import type { EntityType } from "../schemas";
import { TranslationStatusBadge } from "./translation-status-badge";

interface TranslationEditorProps {
	entityId: string;
	entityType: EntityType;
	name: string;
	description?: string | null;
	translations: Record<string, { name?: string; description?: string }>;
	primaryLanguage: string;
	targetLanguages: string[];
	storeId: string;
	onClose: () => void;
}

const entityIcons = {
	category: Layers,
	item: UtensilsCrossed,
	optionGroup: ListChecks,
	optionChoice: Circle,
};

const entityLabels = {
	category: "Category",
	item: "Item",
	optionGroup: "Option Group",
	optionChoice: "Option",
};

export function TranslationEditor({
	entityId,
	entityType,
	name,
	description,
	translations,
	primaryLanguage,
	targetLanguages,
	storeId,
	onClose,
}: TranslationEditorProps) {
	const { t } = useTranslation("common");
	const { t: tForms } = useTranslation("forms");
	const Icon = entityIcons[entityType];

	// Mutation hooks (only storeId needed for cache invalidation)
	const updateCategoryMutation = useUpdateCategoryTranslations(storeId);
	const updateItemMutation = useUpdateItemTranslations(storeId);
	const updateOptionGroupMutation = useUpdateOptionGroupTranslations(storeId);
	const updateOptionChoiceMutation = useUpdateOptionChoiceTranslations(storeId);

	// Determine if entity has description field
	const hasDescription = entityType !== "optionChoice";

	// Build initial form values with FLATTENED keys to avoid TanStack Form
	// issues with dynamic nested paths like `translations.${lang}.name`
	const initialValues: Record<string, string> = {};
	for (const lang of targetLanguages) {
		initialValues[`name_${lang}`] = translations[lang]?.name ?? "";
		if (hasDescription) {
			initialValues[`description_${lang}`] =
				translations[lang]?.description ?? "";
		}
	}

	const form = useForm({
		defaultValues: initialValues,
		onSubmit: async ({ value }) => {
			// Reconstruct translations object from flattened form values
			const cleanedTranslations: Record<
				string,
				{ name?: string; description?: string }
			> = {};

			for (const lang of targetLanguages) {
				const name = (value[`name_${lang}`] as string)?.trim();
				const description = hasDescription
					? (value[`description_${lang}`] as string)?.trim()
					: undefined;

				if (name || description) {
					cleanedTranslations[lang] = {};
					if (name) cleanedTranslations[lang].name = name;
					if (description) cleanedTranslations[lang].description = description;
				}
			}

			// Call appropriate mutation
			switch (entityType) {
				case "category":
					await updateCategoryMutation.mutateAsync({
						categoryId: entityId,
						translations: cleanedTranslations,
					});
					break;
				case "item":
					await updateItemMutation.mutateAsync({
						itemId: entityId,
						translations: cleanedTranslations,
					});
					break;
				case "optionGroup":
					await updateOptionGroupMutation.mutateAsync({
						optionGroupId: entityId,
						translations: cleanedTranslations,
					});
					break;
				case "optionChoice":
					await updateOptionChoiceMutation.mutateAsync({
						optionChoiceId: entityId,
						translations: cleanedTranslations,
					});
					break;
			}
		},
	});

	const isPending =
		updateCategoryMutation.isPending ||
		updateItemMutation.isPending ||
		updateOptionGroupMutation.isPending ||
		updateOptionChoiceMutation.isPending;

	const primaryLangLabel =
		LANGUAGE_OPTIONS.find((l) => l.value === primaryLanguage)?.label ??
		primaryLanguage;

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b p-4">
				<div className="flex min-w-0 items-center gap-3">
					<div className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
						<Icon className="size-5" />
					</div>
					<div className="min-w-0">
						<h3 className="truncate font-semibold">{name}</h3>
						<p className="text-muted-foreground text-sm">
							{entityLabels[entityType]}
						</p>
					</div>
				</div>
				<Button variant="ghost" size="icon" onClick={onClose}>
					<X className="size-4" />
					<span className="sr-only">{t("buttons.close")}</span>
				</Button>
			</div>

			{/* Content */}
			<ScrollArea className="flex-1">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="space-y-6 p-4"
				>
					{/* Primary language (read-only) */}
					<div className="space-y-3 rounded-lg bg-muted/30 p-4">
						<div className="flex items-center gap-2 font-medium text-sm">
							<span className="text-muted-foreground uppercase">
								{primaryLanguage}
							</span>
							<span className="text-muted-foreground">·</span>
							<span>{primaryLangLabel}</span>
							<span className="text-muted-foreground text-xs">(Primary)</span>
						</div>

						<Field>
							<FieldLabel className="text-muted-foreground text-xs">
								{tForms("fields.name")}
							</FieldLabel>
							<div className="text-sm">{name}</div>
						</Field>

						{hasDescription && description && (
							<Field>
								<FieldLabel className="text-muted-foreground text-xs">
									{tForms("fields.description")}
								</FieldLabel>
								<div className="whitespace-pre-wrap text-sm">{description}</div>
							</Field>
						)}
					</div>

					{/* Target languages */}
					{targetLanguages.map((lang) => {
						const langLabel =
							LANGUAGE_OPTIONS.find((l) => l.value === lang)?.label ?? lang;

						// Calculate status for this language
						const hasName = !!translations[lang]?.name;
						const hasDesc =
							!hasDescription || !!translations[lang]?.description;
						const status = !hasName
							? "missing"
							: hasDescription && !hasDesc
								? "partial"
								: "complete";

						return (
							<div key={lang} className="space-y-3 rounded-lg border p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 font-medium text-sm">
										<span className="text-muted-foreground uppercase">
											{lang}
										</span>
										<span className="text-muted-foreground">·</span>
										<span>{langLabel}</span>
									</div>
									<TranslationStatusBadge status={status} size="sm" showLabel />
								</div>

								<form.Field name={`name_${lang}`}>
									{(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>
												{tForms("fields.name")}
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value ?? ""}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												placeholder={name}
											/>
										</Field>
									)}
								</form.Field>

								{hasDescription && (
									<form.Field name={`description_${lang}`}>
										{(field) => (
											<Field>
												<FieldLabel htmlFor={field.name}>
													{tForms("fields.description")}
												</FieldLabel>
												<Textarea
													id={field.name}
													name={field.name}
													value={field.state.value ?? ""}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													placeholder={description ?? ""}
													rows={3}
												/>
											</Field>
										)}
									</form.Field>
								)}
							</div>
						);
					})}

					{/* Submit button */}
					<div className="pt-2">
						<Button type="submit" disabled={isPending} className="w-full">
							{isPending ? t("states.saving") : t("buttons.saveTranslations")}
						</Button>
					</div>
				</form>
			</ScrollArea>
		</div>
	);
}
