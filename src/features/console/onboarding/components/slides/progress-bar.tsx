import { motion } from "motion/react";

interface ProgressBarProps {
	current: number;
	total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
	// Calculate progress percentage (skip welcome slide in calculation)
	const progress = total > 0 ? (current / total) * 100 : 0;

	return (
		<div className="fixed top-0 right-0 left-0 z-50">
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
		</div>
	);
}
