import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Field, FieldError, FieldLabel } from "@menuvo/ui/field";
import { Input } from "@menuvo/ui/input";
import { PhoneInput } from "@menuvo/ui/phone-input";
import {
	type ContactSlideInput,
	contactSlideSchema,
	merchantEmailSchema,
	merchantPhoneSchema,
} from "../../schemas";
import { SlideFooter } from "./slide-footer";
import { StepIndicator } from "./step-indicator";

interface ContactSlideProps {
	questionNumber: number;
	totalQuestions: number;
	direction: number;
	defaultValues: { email: string; phone: string };
	onComplete: (data: ContactSlideInput) => void;
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

export function ContactSlide({
	questionNumber,
	totalQuestions,
	direction,
	defaultValues,
	onComplete,
	onBack,
}: ContactSlideProps) {
	const { t } = useTranslation("onboarding");

	const form = useForm({
		defaultValues: {
			email: defaultValues.email,
			phone: defaultValues.phone,
		},
		validators: {
			onSubmit: contactSlideSchema,
		},
		onSubmit: ({ value }) => {
			onComplete(value);
		},
	});

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
					{t("slides.contact.title")}
				</motion.h2>

				{/* Why */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.25 }}
					className="mt-4 font-body text-base text-muted-foreground leading-relaxed sm:text-lg"
				>
					{t("slides.contact.why")}
				</motion.p>

				{/* Input fields - stacked */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.35 }}
					className="mt-10 space-y-8"
				>
					{/* Email */}
					<form.Field
						name="email"
						validators={{
							onBlur: zodFieldValidator(merchantEmailSchema),
						}}
					>
						{(field) => {
							const hasError =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;
							return (
								<Field data-invalid={hasError}>
									<FieldLabel
										htmlFor="email"
										className="mb-2 font-body font-medium text-muted-foreground"
									>
										{t("fields.contactEmail")}
									</FieldLabel>
									<Input
										id="email"
										className="h-12 text-lg"
										type="email"
										placeholder={t("placeholders.contactEmail")}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										autoFocus
										autoComplete="email"
										aria-invalid={hasError}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							);
						}}
					</form.Field>

					{/* Phone */}
					<form.Field
						name="phone"
						validators={{
							onBlur: zodFieldValidator(merchantPhoneSchema),
						}}
					>
						{(field) => {
							const hasError =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;

							return (
								<Field data-invalid={hasError}>
									<FieldLabel
										htmlFor="phone"
										className="mb-2 font-body font-medium text-muted-foreground"
									>
										{t("fields.phone")}
									</FieldLabel>
									<PhoneInput
										defaultCountry="DE"
										placeholder={t("placeholders.phone")}
										value={field.state.value}
										onChange={(value) => field.handleChange(value || "")}
										onBlur={field.handleBlur}
										className={hasError ? "[&_input]:border-destructive" : ""}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							);
						}}
					</form.Field>
				</motion.div>

				<form.Subscribe
					selector={(state) => ({
						email: state.values.email,
						phone: state.values.phone,
					})}
				>
					{({ email, phone }) => {
						const emailValid = email.includes("@") && email.includes(".");
						const phoneValid = phone.length >= 8;
						return (
							<SlideFooter
								onBack={onBack}
								canGoNext={emailValid && phoneValid}
							/>
						);
					}}
				</form.Subscribe>
			</form>
		</motion.div>
	);
}
