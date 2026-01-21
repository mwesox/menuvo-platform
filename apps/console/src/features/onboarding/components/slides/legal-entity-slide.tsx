import {
	Field,
	FieldError,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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

	return (
		<motion.div
			custom={direction}
			variants={slideVariants}
			initial="enter"
			animate="center"
			exit="exit"
			transition={{
				y: { type: "spring", stiffness: 300, damping: 30 },
				opacity: { duration: 0.25 },
			}}
			className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6"
		>
			<form
				className="mx-auto w-full max-w-xl"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<StepIndicator current={questionNumber} total={totalQuestions} />

				{/* Question title */}
				<motion.h2
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="font-body font-semibold text-2xl text-foreground leading-tight tracking-tight sm:text-3xl md:text-4xl"
				>
					{t("slides.legalEntity.title")}
				</motion.h2>

				{/* Why */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.25 }}
					className="mt-4 font-body text-base text-muted-foreground leading-relaxed sm:text-lg"
				>
					{t("slides.legalEntity.why")}
				</motion.p>

				{/* Form fields */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.35 }}
					className="mt-10 space-y-6"
				>
					{/* Legal Form Select */}
					<form.Field name="legalForm">
						{(field) => (
							<Field>
								<FieldLabel
									htmlFor="legalForm"
									className="mb-2 font-body font-medium text-muted-foreground"
								>
									{t("fields.legalForm")}
								</FieldLabel>
								<Select
									value={field.state.value}
									onValueChange={(value) => {
										const lf = value as LegalForm;
										field.handleChange(lf);
										setShowRegister(
											LEGAL_FORMS_REQUIRING_REGISTER.includes(lf),
										);
										setShowOther(lf === "other");
									}}
								>
									<SelectTrigger className="h-12 w-full">
										<SelectValue placeholder={t("placeholders.legalForm")} />
									</SelectTrigger>
									<SelectContent>
										{LEGAL_FORM_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{t(option.labelKey)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
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
										<Field data-invalid={hasError}>
											<FieldLabel
												htmlFor="legalFormOther"
												className="mb-2 font-body font-medium text-muted-foreground"
											>
												{t("fields.legalFormOther")}
											</FieldLabel>
											<Input
												id="legalFormOther"
												className="h-12 text-lg"
												placeholder={t("placeholders.legalFormOther")}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												aria-invalid={hasError}
											/>
											<FieldError errors={field.state.meta.errors} />
										</Field>
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
								<Field data-invalid={hasError}>
									<FieldLabel
										htmlFor="companyName"
										className="mb-2 font-body font-medium text-muted-foreground"
									>
										{t("fields.companyName")}
									</FieldLabel>
									<Input
										id="companyName"
										className="h-12 text-lg"
										placeholder={t("placeholders.companyName")}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										autoComplete="organization"
										aria-invalid={hasError}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
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
								<Field data-invalid={hasError}>
									<FieldLabel
										htmlFor="representativeName"
										className="mb-2 font-body font-medium text-muted-foreground"
									>
										{t("fields.representativeName")}
									</FieldLabel>
									<Input
										id="representativeName"
										className="h-12 text-lg"
										placeholder={t("placeholders.representativeName")}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										autoComplete="name"
										aria-invalid={hasError}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							);
						}}
					</form.Field>

					{/* Register Court (conditional) */}
					{showRegister && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="space-y-6"
						>
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
										<Field data-invalid={hasError}>
											<FieldLabel
												htmlFor="registerCourt"
												className="mb-2 font-body font-medium text-muted-foreground"
											>
												{t("fields.registerCourt")}
											</FieldLabel>
											<Input
												id="registerCourt"
												className="h-12 text-lg"
												placeholder={t("placeholders.registerCourt")}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												aria-invalid={hasError}
											/>
											<FieldError errors={field.state.meta.errors} />
										</Field>
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
										<Field data-invalid={hasError}>
											<FieldLabel
												htmlFor="registerNumber"
												className="mb-2 font-body font-medium text-muted-foreground"
											>
												{t("fields.registerNumber")}
											</FieldLabel>
											<Input
												id="registerNumber"
												className="h-12 text-lg"
												placeholder={t("placeholders.registerNumber")}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												aria-invalid={hasError}
											/>
											<FieldError errors={field.state.meta.errors} />
										</Field>
									);
								}}
							</form.Field>
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
								<Field data-invalid={hasError}>
									<FieldLabel
										htmlFor="vatId"
										className="mb-2 font-body font-medium text-muted-foreground"
									>
										{t("fields.vatId")}{" "}
										<span className="text-muted-foreground/60">
											({t("fields.optional")})
										</span>
									</FieldLabel>
									<Input
										id="vatId"
										className="h-12 text-lg"
										placeholder={t("placeholders.vatId")}
										value={field.state.value}
										onChange={(e) =>
											field.handleChange(e.target.value.toUpperCase())
										}
										onBlur={field.handleBlur}
										aria-invalid={hasError}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							);
						}}
					</form.Field>
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
						const hasOtherIfNeeded = !isOtherForm || legalFormOther.length >= 2;
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
			</form>
		</motion.div>
	);
}
