import { ArrowRight, Loader2, Pencil } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type {
	OnboardingData,
	SlideIndex,
} from "../../hooks/use-onboarding-wizard";

interface ReviewSlideProps {
	direction: number;
	data: OnboardingData;
	onEdit: (slideIndex: SlideIndex) => void;
	onSubmit: () => void;
	isSubmitting: boolean;
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

export function ReviewSlide({
	direction,
	data,
	onEdit,
	onSubmit,
	isSubmitting,
}: ReviewSlideProps) {
	const { t } = useTranslation("onboarding");

	const sections = [
		{
			title: t("slides.review.sections.business"),
			editSlide: 1 as SlideIndex, // Business name slide
			items: [
				{ label: t("fields.businessName"), value: data.merchant.name },
				{ label: t("fields.ownerName"), value: data.merchant.ownerName },
			],
		},
		{
			title: t("slides.review.sections.contact"),
			editSlide: 3 as SlideIndex, // Contact slide
			items: [
				{ label: t("fields.contactEmail"), value: data.merchant.email },
				{ label: t("fields.phone"), value: data.merchant.phone },
			],
		},
		{
			title: t("slides.review.sections.store"),
			editSlide: 4 as SlideIndex, // Store name slide
			items: [
				{ label: t("fields.storeName"), value: data.store.name },
				{
					label: t("fields.streetAddress"),
					value: `${data.store.street}, ${data.store.postalCode} ${data.store.city}`,
				},
			],
		},
	];

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
			<div className="mx-auto w-full max-w-xl">
				<h2 className="text-center font-body font-bold text-2xl text-foreground sm:text-3xl md:text-4xl">
					{t("slides.review.title")}
				</h2>
				<p className="mt-3 text-center font-body text-lg text-muted-foreground">
					{t("slides.review.subtitle")}
				</p>

				{/* Data summary */}
				<div className="mt-10 space-y-4">
					{sections.map((section, i) => (
						<motion.div
							key={section.title}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 + i * 0.1 }}
							className="rounded-xl border border-border bg-card p-5"
						>
							<div className="flex items-center justify-between">
								<h3 className="font-body font-semibold text-muted-foreground text-xs uppercase tracking-wider">
									{section.title}
								</h3>
								<button
									type="button"
									onClick={() => onEdit(section.editSlide)}
									className="flex items-center gap-1 font-body font-medium text-accent text-xs hover:underline"
								>
									<Pencil className="h-3 w-3" />
									{t("slides.review.edit")}
								</button>
							</div>
							<dl className="mt-3 space-y-2">
								{section.items.map((item) => (
									<div key={item.label} className="flex justify-between gap-4">
										<dt className="font-body text-muted-foreground text-sm">
											{item.label}
										</dt>
										<dd className="text-right font-body font-medium text-foreground text-sm">
											{item.value || "—"}
										</dd>
									</div>
								))}
							</dl>
						</motion.div>
					))}
				</div>

				{/* Submit */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.7 }}
					className="mt-10"
				>
					<Button
						onClick={onSubmit}
						disabled={isSubmitting}
						size="lg"
						className="h-14 w-full gap-2 text-base"
					>
						{isSubmitting ? (
							<>
								<Loader2 className="h-5 w-5 animate-spin" />
								{t("slides.review.creating")}
							</>
						) : (
							<>
								{t("slides.review.createAccount")}
								<ArrowRight className="h-5 w-5" />
							</>
						)}
					</Button>
				</motion.div>
			</div>
		</motion.div>
	);
}
