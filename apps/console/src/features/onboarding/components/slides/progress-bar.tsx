import { AnimatePresence, motion } from "motion/react";

interface ProgressBarProps {
	current: number;
	total: number;
	isVisible?: boolean;
}

export function ProgressBar({
	current,
	total,
	isVisible = true,
}: ProgressBarProps) {
	// Calculate progress percentage (skip welcome slide in calculation)
	const progress = total > 0 ? (current / total) * 100 : 0;

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					className="fixed top-0 right-0 left-0 z-50"
					initial={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.1 }}
				>
					{/* Track */}
					<div className="h-1 w-full bg-border/50">
						{/* Fill */}
						<motion.div
							className="h-full bg-accent"
							initial={{ width: 0 }}
							animate={{ width: `${progress}%` }}
							transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
						/>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
