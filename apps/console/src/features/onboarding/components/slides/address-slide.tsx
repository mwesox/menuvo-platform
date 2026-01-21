import {
	Box,
	Field,
	Flex,
	Heading,
	Input,
	SimpleGrid,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/typography";
import { type AddressSlideInput, addressSlideSchema } from "../../schemas";
import { SlideFooter } from "./slide-footer";
import { StepIndicator } from "./step-indicator";

interface AddressSlideProps {
	questionNumber: number;
	totalQuestions: number;
	direction: number;
	defaultValues: { street: string; city: string; postalCode: string };
	onComplete: (data: AddressSlideInput) => void;
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

export function AddressSlide({
	questionNumber,
	totalQuestions,
	direction,
	defaultValues,
	onComplete,
	onBack,
}: AddressSlideProps) {
	const { t } = useTranslation("onboarding");

	const form = useForm({
		defaultValues: {
			street: defaultValues.street,
			city: defaultValues.city,
			postalCode: defaultValues.postalCode,
		},
		validators: {
			onSubmit: addressSlideSchema,
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
							{t("slides.address.title")}
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
							{t("slides.address.why")}
						</Text>
					</motion.div>

					{/* Input fields */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.35 }}
					>
						<VStack gap="6" align="stretch" mt="10">
							{/* Street */}
							<form.Field name="street">
								{(field) => {
									const hasError =
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0;
									return (
										<Field.Root invalid={hasError}>
											<Field.Label
												htmlFor="street"
												mb="2"
												fontWeight="medium"
												color="fg.muted"
											>
												{t("fields.streetAddress")}
											</Field.Label>
											<Input
												id="street"
												h="12"
												textStyle="lg"
												type="text"
												placeholder={t("placeholders.streetAddress")}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												autoFocus
												autoComplete="street-address"
												aria-invalid={hasError}
											/>
											{hasError && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field.Root>
									);
								}}
							</form.Field>

							{/* Postal & City - side by side on larger screens (German format: PLZ first) */}
							<SimpleGrid columns={{ base: 1, sm: 2 }} gap="6">
								{/* Postal Code */}
								<form.Field name="postalCode">
									{(field) => {
										const hasError =
											field.state.meta.isTouched &&
											field.state.meta.errors.length > 0;
										return (
											<Field.Root invalid={hasError}>
												<Field.Label
													htmlFor="postalCode"
													mb="2"
													fontWeight="medium"
													color="fg.muted"
												>
													{t("fields.postalCode")}
												</Field.Label>
												<Input
													id="postalCode"
													h="12"
													textStyle="lg"
													type="text"
													inputMode="numeric"
													maxLength={5}
													placeholder={t("placeholders.postalCode")}
													value={field.state.value}
													onChange={(e) => {
														// Only allow digits
														const digits = e.target.value.replace(/\D/g, "");
														field.handleChange(digits);
													}}
													onBlur={field.handleBlur}
													autoComplete="postal-code"
													aria-invalid={hasError}
												/>
												{hasError && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field.Root>
										);
									}}
								</form.Field>

								{/* City */}
								<form.Field name="city">
									{(field) => {
										const hasError =
											field.state.meta.isTouched &&
											field.state.meta.errors.length > 0;
										return (
											<Field.Root invalid={hasError}>
												<Field.Label
													htmlFor="city"
													mb="2"
													fontWeight="medium"
													color="fg.muted"
												>
													{t("fields.city")}
												</Field.Label>
												<Input
													id="city"
													h="12"
													textStyle="lg"
													type="text"
													placeholder={t("placeholders.city")}
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													autoComplete="address-level2"
													aria-invalid={hasError}
												/>
												{hasError && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field.Root>
										);
									}}
								</form.Field>
							</SimpleGrid>

							{/* Country - hardcoded to Germany */}
							<Box maxW="xs">
								<Label muted mb="2">
									{t("fields.country")}
								</Label>
								<Input
									h="12"
									textStyle="lg"
									value="Deutschland"
									disabled
									readOnly
								/>
							</Box>
						</VStack>
					</motion.div>

					<form.Subscribe selector={(state) => state.canSubmit}>
						{(canSubmit) => (
							<SlideFooter onBack={onBack} canGoNext={canSubmit} />
						)}
					</form.Subscribe>
				</form>
			</Flex>
		</motion.div>
	);
}
