import {
	Box,
	Button,
	HStack,
	Icon,
	Kbd,
	Spinner,
	Text,
} from "@chakra-ui/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

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
			style={{ marginTop: "3rem" }}
		>
			<HStack justify="space-between" align="center">
				{/* Back button - tabIndex={-1} to skip in tab order */}
				{onBack ? (
					<Button
						variant="ghost"
						size="sm"
						tabIndex={-1}
						onClick={onBack}
						color="fg.muted"
						_hover={{ color: "fg" }}
					>
						<Icon size="sm">
							<ArrowLeft style={{ height: "1rem", width: "1rem" }} />
						</Icon>
						{t("slides.back")}
					</Button>
				) : (
					<Box />
				)}

				{/* Continue/Submit */}
				<HStack gap="4" align="center">
					{/* Keyboard hint - desktop only */}
					<Text color="fg.muted" textStyle="xs" hideBelow="sm">
						{t("slides.pressEnter")} <Kbd fontWeight="semibold">↵</Kbd>
					</Text>

					<Button
						type="submit"
						disabled={!canGoNext || isSubmitting}
						size="md"
						px="6"
						py="3"
						_hover={
							canGoNext && !isSubmitting ? { transform: "scale(1.02)" } : {}
						}
						_active={
							canGoNext && !isSubmitting ? { transform: "scale(0.98)" } : {}
						}
						transition="transform 0.2s"
						opacity={canGoNext && !isSubmitting ? 1 : 0.6}
						cursor={canGoNext && !isSubmitting ? "pointer" : "not-allowed"}
					>
						{isSubmitting ? (
							<>
								<Spinner size="xs" mr="2" />
								{t("slides.creating")}
							</>
						) : isLastQuestion ? (
							<>
								{t("slides.createAccount")}
								<Icon size="sm" ml="2">
									<ArrowRight style={{ height: "1rem", width: "1rem" }} />
								</Icon>
							</>
						) : (
							<>
								{t("slides.continue")}
								<Icon size="sm" ml="2">
									<ArrowRight style={{ height: "1rem", width: "1rem" }} />
								</Icon>
							</>
						)}
					</Button>
				</HStack>
			</HStack>
		</motion.div>
	);
}
