import {
	Badge,
	Button,
	Field,
	HStack,
	Icon,
	Popover,
	Portal,
	VStack,
} from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SettingsFormFooter } from "@/components/layout/settings-form-footer";
import { FormSection } from "@/components/ui/form-section";
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
		>
			<VStack layerStyle="settingsContent">
				<FormSection
					title={t("sections.languageSettings")}
					description={t("descriptions.languageSettings")}
				>
					{/* Supported Languages */}
					<form.Field name="supportedLanguages">
						{(field) => {
							const availableLanguages = getAvailableLanguages(
								field.state.value,
							);

							return (
								<Field.Root>
									<Field.Label>
										{t("fields.supportedLanguages", "Supported Languages")}
									</Field.Label>

									{/* List of languages */}
									<VStack gap="2" align="stretch" mt="2">
										<HStack gap="2" flexWrap="wrap">
											{field.state.value.map((langCode, index) => {
												const lang = LANGUAGE_OPTIONS.find(
													(l) => l.value === langCode,
												);
												const isFirst = index === 0;
												const canRemove = field.state.value.length > 1;

												return (
													<Badge
														key={langCode}
														variant={isFirst ? "solid" : "subtle"}
														gap="1"
														pe="2"
													>
														<Icon
															as={GripVertical}
															fontSize="xs"
															color="fg.muted"
														/>
														{lang?.label ?? langCode}
														{canRemove && (
															<Button
																type="button"
																variant="ghost"
																size="xs"
																p="0"
																h="4"
																w="4"
																minW="4"
																onClick={() => {
																	field.handleChange(
																		field.state.value.filter(
																			(l) => l !== langCode,
																		),
																	);
																}}
																aria-label={tCommon("buttons.remove")}
															>
																<Icon as={X} fontSize="xs" />
															</Button>
														)}
													</Badge>
												);
											})}
										</HStack>

										{/* Add language popover */}
										{availableLanguages.length > 0 && (
											<Popover.Root>
												<Popover.Trigger asChild>
													<Button type="button" variant="outline" size="sm">
														<Icon as={Plus} fontSize="xs" me="1" />
														{t("actions.addLanguage", "Add Language")}
													</Button>
												</Popover.Trigger>
												<Portal>
													<Popover.Positioner>
														<Popover.Content w="48" p="2">
															<Popover.Body>
																<VStack gap="1" align="stretch">
																	{availableLanguages.map((lang) => (
																		<Button
																			key={lang.value}
																			type="button"
																			variant="ghost"
																			size="sm"
																			w="full"
																			justifyContent="flex-start"
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
																</VStack>
															</Popover.Body>
														</Popover.Content>
													</Popover.Positioner>
												</Portal>
											</Popover.Root>
										)}
									</VStack>
								</Field.Root>
							);
						}}
					</form.Field>
				</FormSection>

				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => <SettingsFormFooter isSubmitting={isSubmitting} />}
				</form.Subscribe>
			</VStack>
		</form>
	);
}
