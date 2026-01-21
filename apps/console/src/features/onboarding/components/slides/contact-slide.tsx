import { Field, Flex, Heading, Input, Text, VStack } from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { FieldError } from "@/components/ui/field-error";
import { PhoneInput } from "@/components/ui/phone-input";
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
		>
			<Flex flex="1" direction="column" justify="center" p="3rem 1rem">
				<form
					style={{ margin: "0 auto", width: "100%", maxWidth: "36rem" }}
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
						transition={{ delay: 0.1 }}
					>
						<Heading
							as="h2"
							fontWeight="semibold"
							textStyle={{ base: "2xl", sm: "3xl", md: "4xl" }}
							lineHeight="tight"
							letterSpacing="tight"
						>
							{t("slides.contact.title")}
						</Heading>
					</motion.div>

					{/* Why */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.25 }}
					>
						<Text
							mt="4"
							textStyle={{ base: "base", sm: "lg" }}
							color="fg.muted"
							lineHeight="relaxed"
						>
							{t("slides.contact.why")}
						</Text>
					</motion.div>

					{/* Input fields - stacked */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.35 }}
					>
						<VStack gap="8" align="stretch" mt="10">
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
										<Field.Root invalid={hasError}>
											<Field.Label
												htmlFor="email"
												mb="2"
												fontWeight="medium"
												color="fg.muted"
											>
												{t("fields.contactEmail")}
											</Field.Label>
											<Input
												id="email"
												h="12"
												textStyle="lg"
												type="email"
												placeholder={t("placeholders.contactEmail")}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												autoFocus
												autoComplete="email"
												aria-invalid={hasError}
											/>
											{hasError && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field.Root>
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
										<Field.Root invalid={hasError}>
											<Field.Label
												htmlFor="phone"
												mb="2"
												fontWeight="medium"
												color="fg.muted"
											>
												{t("fields.phone")}
											</Field.Label>
											<PhoneInput
												defaultCountry="DE"
												placeholder={t("placeholders.phone")}
												value={field.state.value}
												onChange={field.handleChange}
												onBlur={field.handleBlur}
												invalid={hasError}
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
			</Flex>
		</motion.div>
	);
}
