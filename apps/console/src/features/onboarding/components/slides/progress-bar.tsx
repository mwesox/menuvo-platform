import { Box } from "@chakra-ui/react";
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
					initial={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.1 }}
					style={{
						position: "fixed",
						top: 0,
						right: 0,
						left: 0,
						zIndex: 50,
					}}
				>
					{/* Track */}
					<Box h="1" w="full" bg="border.muted">
						{/* Fill */}
						<motion.div
							initial={{ width: 0 }}
							animate={{ width: `${progress}%` }}
							transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
							style={{
								height: "100%",
								backgroundColor: "var(--chakra-colors-primary)",
							}}
						/>
					</Box>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
