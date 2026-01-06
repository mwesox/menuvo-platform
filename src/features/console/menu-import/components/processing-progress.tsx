import { Check, FileText, Loader2, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ProcessingProgressProps {
	/** Whether processing is complete */
	isComplete: boolean;
	/** Whether processing failed */
	isFailed: boolean;
}

const STAGES = [
	{ key: "extracting", icon: FileText, duration: 3000 },
	{ key: "analyzing", icon: Sparkles, duration: 8000 },
	{ key: "comparing", icon: Search, duration: 4000 },
] as const;

/**
 * Animated processing progress with stages.
 * Shows estimated progress through extraction, AI analysis, and comparison.
 */
export function ProcessingProgress({
	isComplete,
	isFailed,
}: ProcessingProgressProps) {
	const { t } = useTranslation("menu");
	const [currentStage, setCurrentStage] = useState(0);
	const [stageProgress, setStageProgress] = useState(0);

	// Auto-advance stages based on estimated timing
	useEffect(() => {
		if (isComplete || isFailed) return;

		const stage = STAGES[currentStage];
		if (!stage) return;

		// Progress within current stage
		const progressInterval = setInterval(() => {
			setStageProgress((prev) => {
				if (prev >= 100) return 100;
				return prev + 100 / (stage.duration / 100);
			});
		}, 100);

		// Move to next stage
		const stageTimeout = setTimeout(() => {
			if (currentStage < STAGES.length - 1) {
				setCurrentStage((prev) => prev + 1);
				setStageProgress(0);
			}
		}, stage.duration);

		return () => {
			clearInterval(progressInterval);
			clearTimeout(stageTimeout);
		};
	}, [currentStage, isComplete, isFailed]);

	// Complete all stages when done
	useEffect(() => {
		if (isComplete) {
			setCurrentStage(STAGES.length);
			setStageProgress(100);
		}
	}, [isComplete]);

	return (
		<div className="space-y-6">
			{/* Main spinner */}
			<div className="flex justify-center">
				{isComplete ? (
					<div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
						<Check className="size-8 text-primary" />
					</div>
				) : (
					<Loader2 className="size-16 animate-spin text-primary" />
				)}
			</div>

			{/* Current status text */}
			<div className="text-center">
				<p className="font-medium text-lg">
					{isComplete
						? t("import.progress.complete")
						: t(`import.progress.${STAGES[currentStage]?.key ?? "analyzing"}`)}
				</p>
				<p className="mt-1 text-muted-foreground text-sm">
					{isComplete
						? t("import.progress.reviewReady")
						: t("import.status.pleaseWait")}
				</p>
			</div>

			{/* Stage indicators */}
			<div className="flex justify-center gap-6 pt-4">
				{STAGES.map((stage, index) => {
					const Icon = stage.icon;
					const isActive = index === currentStage && !isComplete;
					const isDone = index < currentStage || isComplete;

					return (
						<div key={stage.key} className="flex flex-col items-center gap-2">
							<div
								className={`flex size-10 items-center justify-center rounded-full transition-colors ${
									isDone
										? "bg-primary text-primary-foreground"
										: isActive
											? "bg-primary/20 text-primary"
											: "bg-muted text-muted-foreground"
								}`}
							>
								{isDone ? (
									<Check className="size-5" />
								) : isActive ? (
									<Icon className="size-5 animate-pulse" />
								) : (
									<Icon className="size-5" />
								)}
							</div>
							<span
								className={`text-xs ${
									isDone || isActive
										? "font-medium text-foreground"
										: "text-muted-foreground"
								}`}
							>
								{t(`import.progress.stages.${stage.key}`)}
							</span>
						</div>
					);
				})}
			</div>

			{/* Progress bar for current stage */}
			{!isComplete && !isFailed && (
				<div className="mx-auto max-w-xs">
					<div className="h-1 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full bg-primary transition-all duration-100 ease-linear"
							style={{ width: `${stageProgress}%` }}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
