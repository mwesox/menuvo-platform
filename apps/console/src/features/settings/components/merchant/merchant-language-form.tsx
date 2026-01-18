import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FieldLabel,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LANGUAGE_OPTIONS } from "@/features/translations/constants.ts";
import {
	type LanguageCode,
	supportedLanguagesFormSchema,
} from "@/features/translations/schemas.ts";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

export function MerchantLanguageForm() {
	const { t } = useTranslation("settings");
	const { t: tCommon } = useTranslation("common");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { data: merchant } = useQuery({
		...trpc.merchant.getCurrent.queryOptions(),
	});

	const updateMutation = useMutation({
		...trpc.merchant.updateLanguages.mutationOptions(),
		mutationFn: async ({
			supportedLanguages,
		}: {
			supportedLanguages: LanguageCode[];
		}) =>
			trpcClient.merchant.updateLanguages.mutate({
				supportedLanguages,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.merchant.getCurrent.queryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.menu.translations.getStatus.pathKey(),
			});
			toast.success(tToasts("success.languagesUpdated", "Languages updated"));
		},
		onError: () => {
			toast.error(
				tToasts("error.updateLanguages", "Failed to update languages"),
			);
		},
	});

	if (!merchant) {
		return null;
	}

	// Get supported languages (default to ['de'] if empty)
	const supportedLanguages = (merchant.supportedLanguages ?? [
		"de",
	]) as LanguageCode[];

	const form = useForm({
		defaultValues: {
			supportedLanguages,
		},
		validators: {
			onSubmit: supportedLanguagesFormSchema,
		},
		onSubmit: async ({ value }) => {
			await updateMutation.mutateAsync({
				supportedLanguages: value.supportedLanguages,
			});
		},
	});

	// Get available languages (not yet added)
	const getAvailableLanguages = (current: LanguageCode[]) => {
		const used = new Set(current);
		return LANGUAGE_OPTIONS.filter((lang) => !used.has(lang.value));
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-6"
		>
			<Card>
				<CardHeader>
					<CardTitle>{t("sections.languageSettings")}</CardTitle>
					<CardDescription>
						{t("descriptions.languageSettings")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Supported Languages */}
					<form.Field name="supportedLanguages">
						{(field) => {
							const availableLanguages = getAvailableLanguages(
								field.state.value,
							);

							return (
								<Field>
									<FieldLabel>
										{t("fields.supportedLanguages", "Supported Languages")}
									</FieldLabel>

									{/* List of languages */}
									<div className="mt-2 space-y-2">
										<div className="flex flex-wrap gap-2">
											{field.state.value.map((langCode, index) => {
												const lang = LANGUAGE_OPTIONS.find(
													(l) => l.value === langCode,
												);
												const isFirst = index === 0;
												const canRemove = field.state.value.length > 1;

												return (
													<Badge
														key={langCode}
														variant={isFirst ? "default" : "secondary"}
														className="gap-1 pe-2"
													>
														<GripVertical className="size-3 text-muted-foreground" />
														{lang?.label ?? langCode}
														{canRemove && (
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="size-4 p-0 hover:bg-destructive/20"
																onClick={() => {
																	field.handleChange(
																		field.state.value.filter(
																			(l) => l !== langCode,
																		),
																	);
																}}
															>
																<X className="size-3" />
																<span className="sr-only">
																	{tCommon("buttons.remove")}
																</span>
															</Button>
														)}
													</Badge>
												);
											})}
										</div>

										{/* Add language popover */}
										{availableLanguages.length > 0 && (
											<Popover>
												<PopoverTrigger asChild>
													<Button
														type="button"
														variant="outline"
														size="sm"
														className="gap-1"
													>
														<Plus className="h-3.5 w-3.5" />
														{t("actions.addLanguage", "Add Language")}
													</Button>
												</PopoverTrigger>
												<PopoverContent className="w-48 p-2" align="start">
													<div className="space-y-1">
														{availableLanguages.map((lang) => (
															<Button
																key={lang.value}
																type="button"
																variant="ghost"
																size="sm"
																className="w-full justify-start"
																onClick={() => {
																	field.handleChange([
																		...field.state.value,
																		lang.value,
																	]);
																}}
															>
																{lang.label}
															</Button>
														))}
													</div>
												</PopoverContent>
											</Popover>
										)}
									</div>
								</Field>
							);
						}}
					</form.Field>
				</CardContent>
			</Card>

			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting
							? tCommon("states.saving")
							: tCommon("buttons.saveChanges")}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
