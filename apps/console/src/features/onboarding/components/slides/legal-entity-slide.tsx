import {
	Box,
	createListCollection,
	Field,
	Flex,
	Heading,
	Input,
	Portal,
	Select,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FieldError } from "@/components/ui/field-error";
import {
	companyNameSchema,
	LEGAL_FORMS_REQUIRING_REGISTER,
	type LegalEntitySlideInput,
	type LegalForm,
	legalFormEnum,
	registerCourtSchema,
	registerNumberSchema,
	representativeNameSchema,
	vatIdSchema,
} from "../../schemas";
import { SlideFooter } from "./slide-footer";
import { StepIndicator } from "./step-indicator";

interface LegalEntitySlideProps {
	questionNumber: number;
	totalQuestions: number;
	direction: number;
	defaultValues: LegalEntitySlideInput;
	onComplete: (data: LegalEntitySlideInput) => void;
	onBack: () => void;
}

const slideVariants = {
	enter: (direction: number) => ({
		y: direction > 0 ? 50 : -50,
		opacity: 0,
	}),
	center: {
		y: 0,
		opacity: 1,
	},
	exit: (direction: number) => ({
		y: direction > 0 ? -50 : 50,
		opacity: 0,
	}),
};

// Helper to create field validator from Zod schema
function zodFieldValidator<T>(schema: {
	safeParse: (val: T) => {
		success: boolean;
		error?: { issues: { message: string }[] };
	};
}) {
	return ({ value }: { value: T }) => {
		const result = schema.safeParse(value);
		if (!result.success) {
			return result.error?.issues[0]?.message;
		}
		return undefined;
	};
}

// Legal form options for the dropdown
const LEGAL_FORM_OPTIONS: { value: LegalForm; labelKey: string }[] = [
	{ value: "einzelunternehmen", labelKey: "legalForms.einzelunternehmen" },
	{ value: "gbr", labelKey: "legalForms.gbr" },
	{ value: "ug", labelKey: "legalForms.ug" },
	{ value: "gmbh", labelKey: "legalForms.gmbh" },
	{ value: "ohg", labelKey: "legalForms.ohg" },
	{ value: "kg", labelKey: "legalForms.kg" },
	{ value: "ag", labelKey: "legalForms.ag" },
	{ value: "freiberufler", labelKey: "legalForms.freiberufler" },
	{ value: "other", labelKey: "legalForms.other" },
];

export function LegalEntitySlide({
	questionNumber,
	totalQuestions,
	direction,
	defaultValues,
	onComplete,
	onBack,
}: LegalEntitySlideProps) {
	const { t } = useTranslation("onboarding");

	const form = useForm({
		defaultValues: {
			legalForm: defaultValues.legalForm,
			legalFormOther: defaultValues.legalFormOther || "",
			companyName: defaultValues.companyName,
			representativeName: defaultValues.representativeName,
			registerCourt: defaultValues.registerCourt || "",
			registerNumber: defaultValues.registerNumber || "",
			vatId: defaultValues.vatId || "",
		},
		onSubmit: ({ value }) => {
			onComplete(value as LegalEntitySlideInput);
		},
	});

	// Use state for dynamic fields - we'll update them when form values change
	const [showRegister, setShowRegister] = useState(
		LEGAL_FORMS_REQUIRING_REGISTER.includes(defaultValues.legalForm),
	);
	const [showOther, setShowOther] = useState(
		defaultValues.legalForm === "other",
	);

	// Create collection for Select component
	const legalFormCollection = useMemo(
		() =>
			createListCollection({
				items: LEGAL_FORM_OPTIONS.map((option) => ({
					value: option.value,
					label: t(option.labelKey),
				})),
			}),
		[t],
	);

	return (
		<motion.div
			custom={direction}
			variants={slideVariants}
			initial="enter"
			animate="center"
			exit="exit"
			transition={{
				y: { type: "spring" as const, stiffness: 300, damping: 30 },
				opacity: { duration: 0.25 },
			}}
		>
			<Flex flex="1" direction="column" justify="center" p="3rem 1rem">
				<Box
					as="form"
					mx="auto"
					w="100%"
					maxW="xl"
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<StepIndicator current={questionNumber} total={totalQuestions} />

					{/* Question title */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, duration: 0.3 }}
					>
						<Heading
							as="h2"
							fontWeight="semibold"
							textStyle={{ base: "2xl", sm: "3xl", md: "4xl" }}
							lineHeight="tight"
							letterSpacing="tight"
						>
							{t("slides.legalEntity.title")}
						</Heading>
					</motion.div>

					{/* Why */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.25, duration: 0.3 }}
					>
						<Text
							mt="4"
							textStyle={{ base: "base", sm: "lg" }}
							color="fg.muted"
							lineHeight="relaxed"
						>
							{t("slides.legalEntity.why")}
						</Text>
					</motion.div>

					{/* Form fields */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.35, duration: 0.3 }}
					>
						<VStack gap="6" align="stretch" mt="10">
							{/* Legal Form Select */}
							<form.Field name="legalForm">
								{(field) => (
									<Field.Root>
										<Field.Label
											htmlFor="legalForm"
											mb="2"
											fontWeight="medium"
											color="fg.muted"
										>
											{t("fields.legalForm")}
										</Field.Label>
										<Select.Root
											collection={legalFormCollection}
											value={field.state.value ? [field.state.value] : []}
											onValueChange={(details) => {
												const value = details.value[0];
												if (value) {
													const lf = value as LegalForm;
													field.handleChange(lf);
													setShowRegister(
														LEGAL_FORMS_REQUIRING_REGISTER.includes(lf),
													);
													setShowOther(lf === "other");
												}
											}}
										>
											<Select.HiddenSelect />
											<Select.Control>
												<Select.Trigger h="12" w="100%">
													<Select.ValueText
														placeholder={t("placeholders.legalForm")}
													/>
													<Select.IndicatorGroup>
														<Select.Indicator />
													</Select.IndicatorGroup>
												</Select.Trigger>
											</Select.Control>
											<Portal>
												<Select.Positioner>
													<Select.Content>
														{legalFormCollection.items.map((item) => (
															<Select.Item key={item.value} item={item}>
																{item.label}
																<Select.ItemIndicator />
															</Select.Item>
														))}
													</Select.Content>
												</Select.Positioner>
											</Portal>
										</Select.Root>
									</Field.Root>
								)}
							</form.Field>

							{/* Legal Form Other (conditional) */}
							{showOther && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
								>
									<form.Field name="legalFormOther">
										{(field) => {
											const hasError =
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0;
											return (
												<Field.Root invalid={hasError}>
													<Field.Label
														htmlFor="legalFormOther"
														mb="2"
														fontWeight="medium"
														color="fg.muted"
													>
														{t("fields.legalFormOther")}
													</Field.Label>
													<Input
														id="legalFormOther"
														h="12"
														textStyle="lg"
														placeholder={t("placeholders.legalFormOther")}
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														onBlur={field.handleBlur}
														aria-invalid={hasError}
													/>
													{hasError && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field.Root>
											);
										}}
									</form.Field>
								</motion.div>
							)}

							{/* Company Name */}
							<form.Field
								name="companyName"
								validators={{
									onBlur: zodFieldValidator(companyNameSchema),
								}}
							>
								{(field) => {
									const hasError =
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0;
									return (
										<Field.Root invalid={hasError}>
											<Field.Label
												htmlFor="companyName"
												mb="2"
												fontWeight="medium"
												color="fg.muted"
											>
												{t("fields.companyName")}
											</Field.Label>
											<Input
												id="companyName"
												h="12"
												textStyle="lg"
												placeholder={t("placeholders.companyName")}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												autoComplete="organization"
												aria-invalid={hasError}
											/>
											{hasError && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field.Root>
									);
								}}
							</form.Field>

							{/* Representative Name */}
							<form.Field
								name="representativeName"
								validators={{
									onBlur: zodFieldValidator(representativeNameSchema),
								}}
							>
								{(field) => {
									const hasError =
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0;
									return (
										<Field.Root invalid={hasError}>
											<Field.Label
												htmlFor="representativeName"
												mb="2"
												fontWeight="medium"
												color="fg.muted"
											>
												{t("fields.representativeName")}
											</Field.Label>
											<Input
												id="representativeName"
												h="12"
												textStyle="lg"
												placeholder={t("placeholders.representativeName")}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												autoComplete="name"
												aria-invalid={hasError}
											/>
											{hasError && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field.Root>
									);
								}}
							</form.Field>

							{/* Register Court (conditional) */}
							{showRegister && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
								>
									<VStack gap="6" align="stretch">
										<form.Field
											name="registerCourt"
											validators={{
												onBlur: zodFieldValidator(registerCourtSchema),
											}}
										>
											{(field) => {
												const hasError =
													field.state.meta.isTouched &&
													field.state.meta.errors.length > 0;
												return (
													<Field.Root invalid={hasError}>
														<Field.Label
															htmlFor="registerCourt"
															mb="2"
															fontWeight="medium"
															color="fg.muted"
														>
															{t("fields.registerCourt")}
														</Field.Label>
														<Input
															id="registerCourt"
															h="12"
															textStyle="lg"
															placeholder={t("placeholders.registerCourt")}
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															onBlur={field.handleBlur}
															aria-invalid={hasError}
														/>
														{hasError && (
															<FieldError errors={field.state.meta.errors} />
														)}
													</Field.Root>
												);
											}}
										</form.Field>

										{/* Register Number */}
										<form.Field
											name="registerNumber"
											validators={{
												onBlur: zodFieldValidator(registerNumberSchema),
											}}
										>
											{(field) => {
												const hasError =
													field.state.meta.isTouched &&
													field.state.meta.errors.length > 0;
												return (
													<Field.Root invalid={hasError}>
														<Field.Label
															htmlFor="registerNumber"
															mb="2"
															fontWeight="medium"
															color="fg.muted"
														>
															{t("fields.registerNumber")}
														</Field.Label>
														<Input
															id="registerNumber"
															h="12"
															textStyle="lg"
															placeholder={t("placeholders.registerNumber")}
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															onBlur={field.handleBlur}
															aria-invalid={hasError}
														/>
														{hasError && (
															<FieldError errors={field.state.meta.errors} />
														)}
													</Field.Root>
												);
											}}
										</form.Field>
									</VStack>
								</motion.div>
							)}

							{/* VAT ID (optional) */}
							<form.Field
								name="vatId"
								validators={{
									onBlur: ({ value }) => {
										if (!value || value === "") return undefined;
										const result = vatIdSchema.safeParse(value);
										if (!result.success) {
											return result.error?.issues[0]?.message;
										}
										return undefined;
									},
								}}
							>
								{(field) => {
									const hasError =
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0;
									return (
										<Field.Root invalid={hasError}>
											<Field.Label
												htmlFor="vatId"
												mb="2"
												fontWeight="medium"
												color="fg.muted"
											>
												{t("fields.vatId")}{" "}
												<Text as="span" color="fg.muted" opacity={0.6}>
													({t("fields.optional")})
												</Text>
											</Field.Label>
											<Input
												id="vatId"
												h="12"
												textStyle="lg"
												placeholder={t("placeholders.vatId")}
												value={field.state.value}
												onChange={(e) =>
													field.handleChange(e.target.value.toUpperCase())
												}
												onBlur={field.handleBlur}
												aria-invalid={hasError}
											/>
											{hasError && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field.Root>
									);
								}}
							</form.Field>
						</VStack>
					</motion.div>

					<form.Subscribe
						selector={(state) => ({
							legalForm: state.values.legalForm,
							legalFormOther: state.values.legalFormOther,
							companyName: state.values.companyName,
							representativeName: state.values.representativeName,
							registerCourt: state.values.registerCourt,
							registerNumber: state.values.registerNumber,
						})}
					>
						{({
							legalForm,
							legalFormOther,
							companyName,
							representativeName,
							registerCourt,
							registerNumber,
						}) => {
							const legalFormParsed = legalFormEnum.safeParse(legalForm);
							const requiresReg =
								legalFormParsed.success &&
								LEGAL_FORMS_REQUIRING_REGISTER.includes(legalFormParsed.data);
							const isOtherForm = legalForm === "other";

							// Validation checks
							const hasLegalForm = legalFormParsed.success;
							const hasOtherIfNeeded =
								!isOtherForm || legalFormOther.length >= 2;
							const hasCompanyName = companyName.length >= 2;
							const hasRepresentative = representativeName.length >= 2;
							const hasRegisterIfNeeded =
								!requiresReg ||
								(registerCourt.length >= 2 && registerNumber.length >= 2);

							const canGoNext =
								hasLegalForm &&
								hasOtherIfNeeded &&
								hasCompanyName &&
								hasRepresentative &&
								hasRegisterIfNeeded;

							return <SlideFooter onBack={onBack} canGoNext={canGoNext} />;
						}}
					</form.Subscribe>
				</Box>
			</Flex>
		</motion.div>
	);
}
