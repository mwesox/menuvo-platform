import { Box, Field, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { FieldError } from "@/components/ui/field-error";
import { type OwnerSlideInput, ownerSlideSchema } from "../../schemas";
import { SlideFooter } from "./slide-footer";
import { StepIndicator } from "./step-indicator";

interface OwnerSlideProps {
	questionNumber: number;
	totalQuestions: number;
	direction: number;
	defaultValue: string;
	onComplete: (data: OwnerSlideInput) => void;
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

export function OwnerSlide({
	questionNumber,
	totalQuestions,
	direction,
	defaultValue,
	onComplete,
	onBack,
}: OwnerSlideProps) {
	const { t } = useTranslation("onboarding");

	const form = useForm({
		defaultValues: { ownerName: defaultValue },
		validators: {
			onSubmit: ownerSlideSchema,
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
							{t("slides.owner.title")}
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
							{t("slides.owner.why")}
						</Text>
					</motion.div>

					{/* Input */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.35 }}
					>
						<Box mt="10">
							<form.Field name="ownerName">
								{(field) => {
									const hasError =
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0;
									return (
										<Field.Root invalid={hasError}>
											<Field.Label
												htmlFor="owner-name"
												mb="2"
												fontWeight="medium"
												color="fg.muted"
											>
												{t("fields.ownerName")}
											</Field.Label>
											<Input
												id="owner-name"
												h="12"
												textStyle="lg"
												type="text"
												placeholder={t("placeholders.ownerName")}
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												autoFocus
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
							<form.Subscribe selector={(state) => state.canSubmit}>
								{(canSubmit) => (
									<SlideFooter onBack={onBack} canGoNext={canSubmit} />
								)}
							</form.Subscribe>
						</Box>
					</motion.div>
				</form>
			</Flex>
		</motion.div>
	);
}
