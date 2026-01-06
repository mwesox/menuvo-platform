import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type StoreNameSlideInput, storeNameSlideSchema } from "../../schemas";
import { SlideFooter } from "./slide-footer";
import { StepIndicator } from "./step-indicator";

interface StoreNameSlideProps {
	questionNumber: number;
	totalQuestions: number;
	direction: number;
	defaultValue: string;
	onComplete: (data: StoreNameSlideInput) => void;
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

export function StoreNameSlide({
	questionNumber,
	totalQuestions,
	direction,
	defaultValue,
	onComplete,
	onBack,
}: StoreNameSlideProps) {
	const { t } = useTranslation("onboarding");

	const form = useForm({
		defaultValues: { name: defaultValue },
		validators: {
			onSubmit: storeNameSlideSchema,
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
					{t("slides.store.title")}
				</motion.h2>

				{/* Why */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.25 }}
					className="mt-4 font-body text-base text-muted-foreground leading-relaxed sm:text-lg"
				>
					{t("slides.store.why")}
				</motion.p>

				{/* Input */}
				<motion.div
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.35 }}
					className="mt-10"
				>
					<form.Field name="name">
						{(field) => {
							const hasError =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;
							return (
								<Field data-invalid={hasError}>
									<Input
										id="store-name"
										className="h-12 text-lg"
										type="text"
										placeholder={t("placeholders.storeName")}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										autoFocus
										aria-invalid={hasError}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							);
						}}
					</form.Field>

					<form.Subscribe selector={(state) => state.canSubmit}>
						{(canSubmit) => (
							<SlideFooter onBack={onBack} canGoNext={canSubmit} />
						)}
					</form.Subscribe>
				</motion.div>
			</form>
		</motion.div>
	);
}
