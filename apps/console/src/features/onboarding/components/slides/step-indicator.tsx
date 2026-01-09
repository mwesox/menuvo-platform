import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
	current: number;
	total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
	const { t } = useTranslation("onboarding");

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.2 }}
			className="mb-8 space-y-3"
		>
			{/* Step segments - full width */}
			<div className="flex items-center gap-2">
				{Array.from({ length: total }, (_, i) => (
					<div
						key={`step-${i + 1}`}
						className={cn(
							"h-1.5 flex-1 rounded-full transition-colors",
							i + 1 <= current ? "bg-accent" : "bg-border",
						)}
					/>
				))}
			</div>

			{/* Step text */}
			<span className="font-body text-muted-foreground text-sm">
				{t("slides.stepIndicator", { current, total })}
			</span>
		</motion.div>
	);
}
