import type { AppRouter } from "@menuvo/api/trpc";
import {
	Button,
	cn,
	Field,
	FieldGroup,
	FieldLabel,
	Input,
	Switch,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import {
	Check,
	PartyPopper,
	Plus,
	Smile,
	Sparkles,
	Wine,
	X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ContentSection } from "@/components/ui/content-section";
import {
	AI_RECOMMENDATIONS_LIMITS,
	aiRecommendationsFormSchema,
	recommendationTones,
} from "@/features/settings/schemas";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

// Types from tRPC router
type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;
type SaveAiSettingsInput =
	RouterInput["store"]["recommendations"]["saveAiSettings"];
type AiSettings = RouterOutput["store"]["recommendations"]["getAiSettings"];
type RecommendationTone = AiSettings["tone"];

interface AiRecommendationsFormProps {
	storeId: string;
}

const TONE_ICONS = {
	professional: Wine,
	friendly: Smile,
	playful: PartyPopper,
} as const;

export function AiRecommendationsForm({ storeId }: AiRecommendationsFormProps) {
	const { t } = useTranslation("settings");
	const { t: tCommon } = useTranslation("common");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	// useSuspenseQuery guarantees data is available (prefetched by route loader)
	const { data: settings } = useSuspenseQuery(
		trpc.store.recommendations.getAiSettings.queryOptions({ storeId }),
	);

	const saveMutation = useMutation({
		mutationKey: trpc.store.recommendations.saveAiSettings.mutationKey(),
		mutationFn: async (input: SaveAiSettingsInput) =>
			trpcClient.store.recommendations.saveAiSettings.mutate(input),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.recommendations.getAiSettings.queryKey({
					storeId: variables.storeId,
				}),
			});
			toast.success(tToasts("success.settingsSaved"));
		},
		onError: () => {
			toast.error(tToasts("error.saveSettings"));
		},
	});

	const form = useForm({
		defaultValues: {
			enabled: settings.enabled,
			pairingRules: settings.pairingRules,
			tone: settings.tone,
		},
		validators: {
			onSubmit: aiRecommendationsFormSchema,
		},
		onSubmit: async ({ value }) => {
			// Filter out empty rules
			const validRules = value.pairingRules.filter(
				(rule) => rule.trim().length > 0,
			);
			await saveMutation.mutateAsync({
				storeId,
				enabled: value.enabled,
				pairingRules: validRules,
				tone: value.tone,
			});
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-8"
		>
			<ContentSection
				title={t("aiRecommendations.title")}
				description={t("aiRecommendations.description")}
			>
				<FieldGroup className="space-y-6">
					{/* Enable/Disable Toggle */}
					<form.Field name="enabled">
						{(field) => (
							<div className="flex items-center gap-3">
								<Switch
									id="ai-enabled"
									checked={field.state.value}
									onCheckedChange={field.handleChange}
								/>
								<FieldLabel htmlFor="ai-enabled" className="cursor-pointer">
									{t("aiRecommendations.enableToggle")}
								</FieldLabel>
							</div>
						)}
					</form.Field>

					{/* Tone Selector */}
					<form.Field name="tone">
						{(field) => (
							<Field>
								<FieldLabel>{t("aiRecommendations.toneLabel")}</FieldLabel>
								<p className="mb-3 text-muted-foreground text-sm">
									{t("aiRecommendations.toneHint")}
								</p>
								<div className="grid grid-cols-3 gap-3">
									{recommendationTones.map((toneKey) => {
										const Icon = TONE_ICONS[toneKey];
										const isSelected = field.state.value === toneKey;
										return (
											<button
												key={toneKey}
												type="button"
												onClick={() =>
													field.handleChange(toneKey as RecommendationTone)
												}
												className={cn(
													"relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
													isSelected
														? "border-primary bg-primary/5"
														: "border-border hover:border-primary/50",
												)}
											>
												{isSelected && (
													<div className="absolute top-2 right-2">
														<Check className="size-4 text-primary" />
													</div>
												)}
												<Icon
													className={cn(
														"size-6",
														isSelected
															? "text-primary"
															: "text-muted-foreground",
													)}
												/>
												<span className="font-medium text-sm">
													{t(`aiRecommendations.tones.${toneKey}.label`)}
												</span>
												<span className="text-center text-muted-foreground text-xs">
													{t(`aiRecommendations.tones.${toneKey}.subtitle`)}
												</span>
											</button>
										);
									})}
								</div>

								{/* Preview Section */}
								<div className="mt-4 rounded-lg border border-dashed bg-muted/30 p-4">
									<p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
										{t("aiRecommendations.previewLabel")}
									</p>
									<div className="flex items-center gap-2">
										<Sparkles className="size-4 text-primary" />
										<span className="font-medium text-sm">
											{t(
												`aiRecommendations.tones.${field.state.value}.exampleTitle`,
											)}
										</span>
									</div>
									<p className="mt-1 ml-6 text-muted-foreground text-xs">
										{t(
											`aiRecommendations.tones.${field.state.value}.exampleReason`,
										)}
									</p>
								</div>
							</Field>
						)}
					</form.Field>

					{/* Pairing Rules List */}
					<form.Field name="pairingRules" mode="array">
						{(field) => (
							<Field>
								<FieldLabel>
									{t("aiRecommendations.pairingRulesLabel")}
								</FieldLabel>
								<div className="space-y-2">
									{field.state.value.map((_, index) => (
										<form.Field key={index} name={`pairingRules[${index}]`}>
											{(ruleField) => (
												<div className="flex items-center gap-2">
													<Input
														value={ruleField.state.value}
														onChange={(e) =>
															ruleField.handleChange(e.target.value)
														}
														placeholder={t("aiRecommendations.rulePlaceholder")}
														maxLength={
															AI_RECOMMENDATIONS_LIMITS.MAX_RULE_LENGTH
														}
														className="flex-1"
													/>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => field.removeValue(index)}
														aria-label={tCommon("buttons.delete")}
													>
														<X className="size-4" />
													</Button>
												</div>
											)}
										</form.Field>
									))}

									{field.state.value.length <
										AI_RECOMMENDATIONS_LIMITS.MAX_RULES && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => field.pushValue("")}
											className="mt-2"
										>
											<Plus className="mr-2 size-4" />
											{t("aiRecommendations.addRule")}
										</Button>
									)}
								</div>
								<p className="mt-2 text-muted-foreground text-sm">
									{t("aiRecommendations.pairingRulesHint")}
								</p>
								<div className="text-right text-muted-foreground text-xs">
									{field.state.value.length}/
									{AI_RECOMMENDATIONS_LIMITS.MAX_RULES}{" "}
									{tCommon("labels.rules")}
								</div>
							</Field>
						)}
					</form.Field>
				</FieldGroup>
			</ContentSection>

			<div className="flex justify-end">
				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => (
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? tCommon("states.saving")
								: tCommon("buttons.saveChanges")}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	);
}
