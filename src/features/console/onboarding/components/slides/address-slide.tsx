import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
			className="flex min-h-dvh flex-col justify-center px-4 py-12 sm:px-6"
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
					{t("slides.address.title")}
				</motion.h2>

				{/* Why */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.25 }}
					className="mt-4 font-body text-base text-muted-foreground leading-relaxed sm:text-lg"
				>
					{t("slides.address.why")}
				</motion.p>

				{/* Input fields */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.35 }}
					className="mt-10 space-y-6"
				>
					{/* Street */}
					<form.Field name="street">
						{(field) => {
							const hasError =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;
							return (
								<Field data-invalid={hasError}>
									<FieldLabel
										htmlFor="street"
										className="mb-2 font-body font-medium text-muted-foreground"
									>
										{t("fields.streetAddress")}
									</FieldLabel>
									<Input
										id="street"
										className="h-12 text-lg"
										type="text"
										placeholder={t("placeholders.streetAddress")}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										autoFocus
										autoComplete="street-address"
										aria-invalid={hasError}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							);
						}}
					</form.Field>

					{/* City & Postal - side by side on larger screens */}
					<div className="grid gap-6 sm:grid-cols-2">
						{/* City */}
						<form.Field name="city">
							{(field) => {
								const hasError =
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0;
								return (
									<Field data-invalid={hasError}>
										<FieldLabel
											htmlFor="city"
											className="mb-2 font-body font-medium text-muted-foreground"
										>
											{t("fields.city")}
										</FieldLabel>
										<Input
											id="city"
											className="h-12 text-lg"
											type="text"
											placeholder={t("placeholders.city")}
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											autoComplete="address-level2"
											aria-invalid={hasError}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>

						{/* Postal Code */}
						<form.Field name="postalCode">
							{(field) => {
								const hasError =
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0;
								return (
									<Field data-invalid={hasError}>
										<FieldLabel
											htmlFor="postalCode"
											className="mb-2 font-body font-medium text-muted-foreground"
										>
											{t("fields.postalCode")}
										</FieldLabel>
										<Input
											id="postalCode"
											className="h-12 text-lg"
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
										<FieldError errors={field.state.meta.errors} />
									</Field>
								);
							}}
						</form.Field>
					</div>

					{/* Country - hardcoded to Germany */}
					<div className="max-w-xs">
						<span className="mb-2 block font-body font-medium text-muted-foreground text-sm">
							{t("fields.country")}
						</span>
						<Input
							className="h-12 text-lg"
							value="Deutschland"
							disabled
							readOnly
						/>
					</div>
				</motion.div>

				<form.Subscribe selector={(state) => state.canSubmit}>
					{(canSubmit) => <SlideFooter onBack={onBack} canGoNext={canSubmit} />}
				</form.Subscribe>
			</form>
		</motion.div>
	);
}
