import {
	Button,
	Field,
	HStack,
	Icon,
	Input,
	SimpleGrid,
	Switch,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
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
import { SettingsFormFooter } from "@/components/layout/settings-form-footer";
import { FormSection } from "@/components/ui/form-section";
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
		>
			<VStack layerStyle="settingsContent">
				<FormSection
					title={t("aiRecommendations.title")}
					description={t("aiRecommendations.description")}
				>
					<VStack gap="6" align="stretch">
						{/* Enable/Disable Toggle */}
						<form.Field name="enabled">
							{(field) => (
								<Field.Root>
									<HStack gap="3" align="center">
										<Switch.Root
											id="ai-enabled"
											checked={field.state.value}
											onCheckedChange={(e) => field.handleChange(e.checked)}
											colorPalette="red"
										>
											<Switch.HiddenInput />
											<Switch.Control />
										</Switch.Root>
										<Field.Label htmlFor="ai-enabled" cursor="pointer">
											{t("aiRecommendations.enableToggle")}
										</Field.Label>
									</HStack>
								</Field.Root>
							)}
						</form.Field>

						{/* Tone Selector */}
						<form.Field name="tone">
							{(field) => (
								<Field.Root>
									<Field.Label>{t("aiRecommendations.toneLabel")}</Field.Label>
									<Field.HelperText mb="3" textStyle="sm">
										{t("aiRecommendations.toneHint")}
									</Field.HelperText>
									<SimpleGrid columns={3} gap="3">
										{recommendationTones.map((toneKey) => {
											const ToneIcon = TONE_ICONS[toneKey];
											const isSelected = field.state.value === toneKey;
											return (
												<Button
													key={toneKey}
													type="button"
													variant="outline"
													onClick={() =>
														field.handleChange(toneKey as RecommendationTone)
													}
													position="relative"
													flexDirection="column"
													alignItems="center"
													gap="2"
													p="4"
													borderWidth="2px"
													borderColor={
														isSelected ? "colorPalette.500" : "border"
													}
													bg={isSelected ? "colorPalette.subtle" : undefined}
													colorPalette="blue"
													_hover={{
														borderColor: isSelected
															? "colorPalette.500"
															: "colorPalette.300",
													}}
												>
													{isSelected && (
														<Icon
															as={Check}
															position="absolute"
															top="2"
															right="2"
															fontSize="md"
															color="colorPalette.500"
														/>
													)}
													<Icon
														as={ToneIcon}
														fontSize="lg"
														color={isSelected ? "colorPalette.500" : "fg.muted"}
													/>
													<VStack gap="0">
														<Text fontWeight="medium" textStyle="sm">
															{t(`aiRecommendations.tones.${toneKey}.label`)}
														</Text>
														<Text
															textAlign="center"
															textStyle="xs"
															color="fg.muted"
														>
															{t(`aiRecommendations.tones.${toneKey}.subtitle`)}
														</Text>
													</VStack>
												</Button>
											);
										})}
									</SimpleGrid>

									{/* Preview Section */}
									<VStack
										mt="4"
										rounded="lg"
										borderWidth="1px"
										borderStyle="dashed"
										bg="bg.muted"
										p="4"
										align="stretch"
									>
										<Text
											mb="2"
											fontWeight="medium"
											textStyle="xs"
											textTransform="uppercase"
											letterSpacing="wide"
											color="fg.muted"
										>
											{t("aiRecommendations.previewLabel")}
										</Text>
										<HStack gap="2">
											<Icon
												as={Sparkles}
												fontSize="md"
												color="colorPalette.500"
											/>
											<Text fontWeight="medium" textStyle="sm">
												{t(
													`aiRecommendations.tones.${field.state.value}.exampleTitle`,
												)}
											</Text>
										</HStack>
										<Text mt="1" ml="6" textStyle="xs" color="fg.muted">
											{t(
												`aiRecommendations.tones.${field.state.value}.exampleReason`,
											)}
										</Text>
									</VStack>
								</Field.Root>
							)}
						</form.Field>

						{/* Pairing Rules List */}
						<form.Field name="pairingRules" mode="array">
							{(field) => (
								<Field.Root>
									<Field.Label>
										{t("aiRecommendations.pairingRulesLabel")}
									</Field.Label>
									<VStack gap="2" align="stretch">
										{field.state.value.map((_, index) => (
											<form.Field key={index} name={`pairingRules[${index}]`}>
												{(ruleField) => (
													<HStack gap="2">
														<Input
															value={ruleField.state.value}
															onChange={(e) =>
																ruleField.handleChange(e.target.value)
															}
															placeholder={t(
																"aiRecommendations.rulePlaceholder",
															)}
															maxLength={
																AI_RECOMMENDATIONS_LIMITS.MAX_RULE_LENGTH
															}
															flex="1"
														/>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															w="10"
															h="10"
															p="0"
															onClick={() => field.removeValue(index)}
															aria-label={tCommon("buttons.delete")}
														>
															<Icon as={X} fontSize="md" />
														</Button>
													</HStack>
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
												mt="2"
											>
												<Icon as={Plus} me="2" fontSize="md" />
												{t("aiRecommendations.addRule")}
											</Button>
										)}
									</VStack>
									<Field.HelperText mt="2" textStyle="sm">
										{t("aiRecommendations.pairingRulesHint")}
									</Field.HelperText>
									<HStack justify="flex-end">
										<Field.HelperText textStyle="xs">
											{field.state.value.length}/
											{AI_RECOMMENDATIONS_LIMITS.MAX_RULES}{" "}
											{tCommon("labels.rules")}
										</Field.HelperText>
									</HStack>
								</Field.Root>
							)}
						</form.Field>
					</VStack>
				</FormSection>

				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => <SettingsFormFooter isSubmitting={isSubmitting} />}
				</form.Subscribe>
			</VStack>
		</form>
	);
}
