import {
	Box,
	Circle,
	HStack,
	Icon,
	Progress,
	Spinner,
	Text,
	VStack,
} from "@chakra-ui/react";
import { Check, FileText, Search, Sparkles } from "lucide-react";
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
		<VStack gap="6" align="stretch">
			{/* Main spinner */}
			<Box display="flex" justifyContent="center">
				{isComplete ? (
					<Circle
						w="16"
						h="16"
						display="flex"
						alignItems="center"
						justifyContent="center"
						rounded="full"
						bg="primary/10"
					>
						<Icon w="8" h="8" color="primary">
							<Check />
						</Icon>
					</Circle>
				) : (
					<Spinner size="xl" color="primary" />
				)}
			</Box>

			{/* Current status text */}
			<Box textAlign="center">
				<Text fontWeight="medium" textStyle="lg">
					{isComplete
						? t("import.progress.complete")
						: t(`import.progress.${STAGES[currentStage]?.key ?? "analyzing"}`)}
				</Text>
				<Text mt="1" color="fg.muted" textStyle="sm">
					{isComplete
						? t("import.progress.reviewReady")
						: t("import.status.pleaseWait")}
				</Text>
			</Box>

			{/* Stage indicators */}
			<HStack justify="center" gap="6" pt="4">
				{STAGES.map((stage, index) => {
					const StageIcon = stage.icon;
					const isActive = index === currentStage && !isComplete;
					const isDone = index < currentStage || isComplete;

					return (
						<VStack key={stage.key} gap="2" align="center">
							<Circle
								w="10"
								h="10"
								display="flex"
								alignItems="center"
								justifyContent="center"
								rounded="full"
								transition="colors"
								bg={isDone ? "primary" : isActive ? "primary/20" : "bg.muted"}
								color={
									isDone
										? "primary-foreground"
										: isActive
											? "primary"
											: "fg.muted"
								}
							>
								{isDone ? (
									<Icon w="5" h="5">
										<Check />
									</Icon>
								) : isActive ? (
									<Icon w="5" h="5" animation="pulse">
										<StageIcon />
									</Icon>
								) : (
									<Icon w="5" h="5">
										<StageIcon />
									</Icon>
								)}
							</Circle>
							<Text
								textStyle="xs"
								fontWeight={isDone || isActive ? "medium" : "normal"}
								color={isDone || isActive ? "fg" : "fg.muted"}
							>
								{t(`import.progress.stages.${stage.key}`)}
							</Text>
						</VStack>
					);
				})}
			</HStack>

			{/* Progress bar for current stage */}
			{!isComplete && !isFailed && (
				<Box mx="auto" maxW="xs">
					<Progress.Root value={stageProgress} h="1">
						<Progress.Track
							h="1"
							rounded="full"
							bg="bg.muted"
							overflow="hidden"
						>
							<Progress.Range
								h="full"
								bg="primary"
								transition="all 0.1s ease-linear"
							/>
						</Progress.Track>
					</Progress.Root>
				</Box>
			)}
		</VStack>
	);
}
