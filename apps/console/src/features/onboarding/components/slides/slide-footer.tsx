import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface SlideFooterProps {
	onBack?: () => void;
	canGoNext: boolean;
	isLastQuestion?: boolean;
	isSubmitting?: boolean;
}

export function SlideFooter({
	onBack,
	canGoNext,
	isLastQuestion,
	isSubmitting,
}: SlideFooterProps) {
	const { t } = useTranslation("onboarding");

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.5 }}
			className="mt-12 flex items-center justify-between"
		>
			{/* Back button - tabIndex={-1} to skip in tab order */}
			{onBack ? (
				<button
					type="button"
					tabIndex={-1}
					onClick={onBack}
					className="flex items-center gap-2 font-body font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					{t("slides.back")}
				</button>
			) : (
				<div />
			)}

			{/* Continue/Submit */}
			<div className="flex items-center gap-4">
				{/* Keyboard hint - desktop only */}
				<span className="hidden font-body text-muted-foreground text-xs sm:block">
					{t("slides.pressEnter")} <kbd className="font-semibold">↵</kbd>
				</span>

				<motion.button
					type="submit"
					disabled={!canGoNext || isSubmitting}
					whileHover={canGoNext && !isSubmitting ? { scale: 1.02 } : {}}
					whileTap={canGoNext && !isSubmitting ? { scale: 0.98 } : {}}
					className={cn(
						"flex items-center gap-2 rounded-lg px-6 py-3",
						"font-body font-semibold text-sm",
						"transition-all duration-200",
						canGoNext && !isSubmitting
							? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
							: "cursor-not-allowed bg-muted text-muted-foreground",
					)}
				>
					{isSubmitting ? (
						<>
							<Loader2 className="h-4 w-4 animate-spin" />
							{t("slides.creating")}
						</>
					) : isLastQuestion ? (
						<>
							{t("slides.createAccount")}
							<ArrowRight className="h-4 w-4" />
						</>
					) : (
						<>
							{t("slides.continue")}
							<ArrowRight className="h-4 w-4" />
						</>
					)}
				</motion.button>
			</div>
		</motion.div>
	);
}
