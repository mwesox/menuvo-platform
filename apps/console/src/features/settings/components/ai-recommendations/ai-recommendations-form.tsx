import {
	Button,
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
	SettingsRowGroup,
	SettingsRowItem,
} from "@/components/ui/settings-row";
import { Label } from "@/components/ui/typography";
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
			<VStack gap="8" align="stretch" w="full">
				{/* Enable/Disable Toggle */}
				<form.Field name="enabled">
					{(field) => (
						<SettingsRowGroup title={t("aiRecommendations.enableToggle")}>
							<SettingsRowItem
								label={t("aiRecommendations.enableToggle")}
								description={t("aiRecommendations.enableDescription")}
								action={
									<Switch.Root
										id="ai-enabled"
										checked={field.state.value}
										onCheckedChange={(e) => field.handleChange(e.checked)}
										colorPalette="red"
									>
										<Switch.HiddenInput />
										<Switch.Control />
									</Switch.Root>
								}
							/>
						</SettingsRowGroup>
					)}
				</form.Field>

				{/* Tone Selector */}
				<FormSection
					title={t("aiRecommendations.toneLabel")}
					description={t("aiRecommendations.toneHint")}
				>
					<form.Field name="tone">
						{(field) => (
							<VStack gap="4" align="stretch">
								<SimpleGrid columns={3} gap="4">
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
												justifyContent="center"
												gap="3"
												p="6"
												h="auto"
												minH="120px"
												borderWidth="2px"
												borderColor={isSelected ? "colorPalette.500" : "border"}
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
														top="3"
														right="3"
														fontSize="md"
														color="colorPalette.500"
													/>
												)}
												<Icon
													as={ToneIcon}
													fontSize="2xl"
													color={isSelected ? "colorPalette.500" : "fg.muted"}
												/>
												<VStack gap="0.5">
													<Label>
														{t(`aiRecommendations.tones.${toneKey}.label`)}
													</Label>
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
										<Label>
											{t(
												`aiRecommendations.tones.${field.state.value}.exampleTitle`,
											)}
										</Label>
									</HStack>
									<Text mt="1" ml="6" textStyle="xs" color="fg.muted">
										{t(
											`aiRecommendations.tones.${field.state.value}.exampleReason`,
										)}
									</Text>
								</VStack>
							</VStack>
						)}
					</form.Field>
				</FormSection>

				{/* Pairing Rules List */}
				<FormSection
					title={t("aiRecommendations.pairingRulesLabel")}
					description={t("aiRecommendations.pairingRulesHint")}
				>
					<form.Field name="pairingRules" mode="array">
						{(field) => (
							<VStack gap="3" align="stretch">
								{field.state.value.map((_, index) => (
									<form.Field key={index} name={`pairingRules[${index}]`}>
										{(ruleField) => (
											<HStack gap="2">
												<Input
													value={ruleField.state.value}
													onChange={(e) =>
														ruleField.handleChange(e.target.value)
													}
													placeholder={t("aiRecommendations.rulePlaceholder")}
													maxLength={AI_RECOMMENDATIONS_LIMITS.MAX_RULE_LENGTH}
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

								<HStack justify="space-between" align="center">
									{field.state.value.length <
										AI_RECOMMENDATIONS_LIMITS.MAX_RULES && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => field.pushValue("")}
										>
											<Icon as={Plus} me="2" fontSize="md" />
											{t("aiRecommendations.addRule")}
										</Button>
									)}
									<Text textStyle="xs" color="fg.muted">
										{field.state.value.length}/
										{AI_RECOMMENDATIONS_LIMITS.MAX_RULES}{" "}
										{tCommon("labels.rules")}
									</Text>
								</HStack>
							</VStack>
						)}
					</form.Field>
				</FormSection>

				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => <SettingsFormFooter isSubmitting={isSubmitting} />}
				</form.Subscribe>
			</VStack>
		</form>
	);
}
